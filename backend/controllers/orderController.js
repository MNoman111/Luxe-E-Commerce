import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Voucher from "../models/Voucher.js";
import PaymentDraft from "../models/PaymentDraft.js";
import { sendOrderEmails, sendStatusUpdateEmail } from "../utils/email.js";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 9.99;

let _stripe = null;
const getStripe = () => {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
};

// Rebuild line items + items subtotal server-side from the DB to prevent tampering.
const buildOrderItems = async (items) => {
  let itemsPrice = 0;
  const orderItems = [];
  for (const i of items) {
    const product = await Product.findById(i.product);
    if (!product) throw new Error("Product in cart no longer exists");
    const qty = Math.max(1, Number(i.qty) || 1);
    itemsPrice += product.price * qty;
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      size: i.size || product.sizes?.[0] || "M",
      qty,
    });
  }
  return { orderItems, itemsPrice: +itemsPrice.toFixed(2) };
};

// Compute authoritative pricing from the DB cart. Validates a voucher WITHOUT
// consuming it (signed-in only, once per user). Shared by checkout + payment-intent.
export const priceOrder = async ({ orderItems, voucherCode, userId, isGuest }) => {
  const { orderItems: lineItems, itemsPrice } = await buildOrderItems(orderItems);
  let discountAmount = 0;
  let appliedCode = null;
  let voucherDoc = null;
  if (voucherCode) {
    if (isGuest || !userId) throw new Error("Please sign in to use a voucher code");
    voucherDoc = await Voucher.validateCode(voucherCode, itemsPrice, userId);
    discountAmount = voucherDoc.discountFor(itemsPrice);
    appliedCode = voucherDoc.code;
  }
  const discountedItems = Math.max(0, +(itemsPrice - discountAmount).toFixed(2));
  const shippingPrice =
    itemsPrice >= FREE_SHIPPING_THRESHOLD || itemsPrice === 0 ? 0 : SHIPPING_FEE;
  const taxPrice = +(discountedItems * TAX_RATE).toFixed(2);
  const totalPrice = +(discountedItems + shippingPrice + taxPrice).toFixed(2);
  return {
    lineItems,
    itemsPrice,
    discountAmount,
    appliedCode,
    shippingPrice,
    taxPrice,
    totalPrice,
    voucherDoc,
  };
};

// Create the order from a SUCCESSFUL Stripe payment using the saved draft.
// Idempotent and safe to call from both the browser and the Stripe webhook — only
// the first caller creates the order (the draft is claimed atomically).
export const finalizeStripeOrder = async (paymentIntentId) => {
  // Already created? (e.g. webhook beat the browser, or vice-versa.)
  const existing = await Order.findOne({ "paymentResult.id": paymentIntentId });
  if (existing) return existing;

  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  if (!intent || intent.status !== "succeeded") {
    const e = new Error("Payment has not been completed");
    e.statusCode = 400;
    throw e;
  }

  // Atomically claim the draft so two concurrent callers can't both create the order.
  const draft = await PaymentDraft.findOneAndDelete({ paymentIntentId });
  if (!draft) {
    const again = await Order.findOne({ "paymentResult.id": paymentIntentId });
    if (again) return again;
    const e = new Error("This payment session has expired — please contact support.");
    e.statusCode = 409;
    throw e;
  }

  const order = await Order.create({
    user: draft.user || undefined,
    isGuest: draft.isGuest,
    guestEmail: draft.isGuest ? draft.email : undefined,
    contactEmail: draft.email,
    orderItems: draft.orderItems,
    itemsPrice: draft.itemsPrice,
    discountAmount: draft.discountAmount,
    voucherCode: draft.voucherCode,
    shippingPrice: draft.shippingPrice,
    taxPrice: draft.taxPrice,
    totalPrice: draft.totalPrice,
    shippingAddress: draft.shippingAddress,
    paymentMethod: "Stripe",
    isPaid: true,
    paidAt: new Date(),
    status: "Processing",
    paymentResult: { id: intent.id, status: intent.status, provider: "Stripe" },
  });

  // Record voucher redemption (once).
  if (draft.voucherCode && draft.user) {
    try {
      const v = await Voucher.findOne({ code: draft.voucherCode });
      if (v && !v.usedBy.some((id) => id.toString() === draft.user.toString())) {
        v.usedCount += 1;
        v.usedBy.push(draft.user);
        await v.save();
      }
    } catch (err) {
      console.error("voucher redemption error:", err.message);
    }
  }

  try {
    await sendOrderEmails(order, {
      customerEmail: draft.email,
      accountEmail: draft.accountEmail,
    });
  } catch (err) {
    console.error("sendOrderEmails error:", err.message);
  }

  return order;
};

// @route POST /api/orders   (logged-in users and guests via optionalAuth)
export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    voucherCode,
    guestEmail,
    contactEmail,
    paymentReference,
    paymentIntentId,
  } = req.body;
  const method = ["COD", "BankTransfer"].includes(paymentMethod)
    ? paymentMethod
    : "Stripe";

  // Stripe: the order is created from the server-side draft after the payment succeeds.
  if (method === "Stripe") {
    if (!paymentIntentId) {
      res.status(400);
      throw new Error("Payment is required before placing this order");
    }
    let order;
    try {
      order = await finalizeStripeOrder(paymentIntentId);
    } catch (err) {
      res.status(err.statusCode || 400);
      throw err;
    }
    return res.status(201).json(order);
  }

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const isGuest = !req.user;
  // Where the confirmation goes: guests use their entered email; logged-in users
  // may override per order (contactEmail), else their saved notification email, else login email.
  let email;
  if (isGuest) {
    email = (guestEmail || shippingAddress?.email || "").trim();
    if (!email) {
      res.status(400);
      throw new Error("An email address is required to place a guest order");
    }
  } else {
    // Logged-in: send the confirmation to the per-order email if given, else the account email.
    email = ((contactEmail && contactEmail.trim()) || req.user.email).toLowerCase();
  }

  let pricing;
  try {
    pricing = await priceOrder({
      orderItems,
      voucherCode,
      userId: req.user?._id,
      isGuest,
    });
  } catch (err) {
    res.status(400);
    throw err;
  }

  // Consume the voucher now that the order is actually being created.
  if (pricing.voucherDoc) {
    pricing.voucherDoc.usedCount += 1;
    pricing.voucherDoc.usedBy.push(req.user._id);
    await pricing.voucherDoc.save();
  }

  // COD / bank transfer are placed unpaid (confirmed on delivery / after verification).
  const order = await Order.create({
    user: req.user?._id,
    isGuest,
    guestEmail: isGuest ? email : undefined,
    contactEmail: email,
    orderItems: pricing.lineItems,
    itemsPrice: pricing.itemsPrice,
    discountAmount: pricing.discountAmount,
    voucherCode: pricing.appliedCode,
    shippingPrice: pricing.shippingPrice,
    taxPrice: pricing.taxPrice,
    totalPrice: pricing.totalPrice,
    shippingAddress,
    paymentMethod: method,
    paymentReference: method === "BankTransfer" ? (paymentReference || "").trim() : "",
    isPaid: false,
    status: "Pending",
  });

  // Confirmation email at placement (COD / bank transfer).
  try {
    await sendOrderEmails(order, {
      customerEmail: email,
      accountEmail: isGuest ? null : req.user.email,
    });
  } catch (err) {
    console.error("sendOrderEmails error:", err.message);
  }

  res.status(201).json(order);
});

// @route GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @route GET /api/orders/:id   (optionalAuth)
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  // Guest orders (no user) are viewable by anyone holding the unguessable order id —
  // this is what lets the guest confirmation page work. User orders require the owner/admin.
  if (order.user) {
    const isOwner =
      req.user && order.user._id.toString() === req.user._id.toString();
    if (!isOwner && !(req.user && req.user.isAdmin)) {
      res.status(403);
      throw new Error("Not authorized to view this order");
    }
  }
  res.json(order);
});

// @route PUT /api/orders/:id/confirm-payment  (admin)
// Manually mark an order paid after verifying a JazzCash/Easypaisa/bank transfer.
export const confirmPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.isPaid = true;
  order.paidAt = order.paidAt || new Date();
  if (order.status === "Pending") order.status = "Processing";
  order.paymentResult = {
    id: order.paymentReference || "manual",
    status: "confirmed",
    provider: order.paymentMethod,
  };
  const updated = await order.save();
  res.json(updated);
});

// @route GET /api/orders  (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @route PUT /api/orders/:id/status  (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error("Invalid status");
  }
  const order = await Order.findById(req.params.id).populate("user", "name email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.status = status;
  if (status === "Delivered") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
    if (order.paymentMethod === "COD") {
      order.isPaid = true;
      order.paidAt = order.paidAt || new Date();
    }
  }
  const updated = await order.save();

  // Notify the customer of the new status (never blocks the response).
  try {
    const customerEmail = order.contactEmail || order.user?.email || order.guestEmail;
    await sendStatusUpdateEmail(updated, customerEmail);
  } catch (err) {
    console.error("status email error:", err.message);
  }

  res.json(updated);
});

// @route GET /api/orders/admin/stats  (admin)
export const getOrderStats = asyncHandler(async (req, res) => {
  const orders = await Order.find({});
  const revenue = orders
    .filter((o) => o.isPaid)
    .reduce((a, o) => a + o.totalPrice, 0);
  const byStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});
  res.json({
    totalOrders: orders.length,
    paidOrders: orders.filter((o) => o.isPaid).length,
    revenue: +revenue.toFixed(2),
    byStatus,
  });
});
