import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Voucher from "../models/Voucher.js";

const TAX_RATE = 0.08;
const FREE_SHIPPING_THRESHOLD = 100;
const SHIPPING_FEE = 9.99;

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

// @route POST /api/orders   (logged-in users and guests via optionalAuth)
export const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, voucherCode, guestEmail } = req.body;
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const isGuest = !req.user;
  const email = isGuest ? (guestEmail || shippingAddress?.email) : req.user.email;
  if (isGuest && !email) {
    res.status(400);
    throw new Error("An email address is required to place a guest order");
  }

  const { orderItems: lineItems, itemsPrice } = await buildOrderItems(orderItems);

  // Apply voucher (server-side validation, so it can't be faked).
  let discountAmount = 0;
  let appliedCode = null;
  if (voucherCode) {
    let voucher;
    try {
      voucher = await Voucher.validateCode(voucherCode, itemsPrice);
    } catch (err) {
      res.status(400);
      throw err;
    }
    discountAmount = voucher.discountFor(itemsPrice);
    appliedCode = voucher.code;
    voucher.usedCount += 1;
    await voucher.save();
  }

  const discountedItems = Math.max(0, +(itemsPrice - discountAmount).toFixed(2));
  const shippingPrice =
    itemsPrice >= FREE_SHIPPING_THRESHOLD || itemsPrice === 0 ? 0 : SHIPPING_FEE;
  const taxPrice = +(discountedItems * TAX_RATE).toFixed(2);
  const totalPrice = +(discountedItems + shippingPrice + taxPrice).toFixed(2);

  const order = await Order.create({
    user: req.user?._id,
    isGuest,
    guestEmail: isGuest ? email : undefined,
    orderItems: lineItems,
    itemsPrice,
    discountAmount,
    voucherCode: appliedCode,
    shippingPrice,
    taxPrice,
    totalPrice,
    shippingAddress,
    paymentMethod: paymentMethod === "COD" ? "COD" : "Stripe",
    status: "Pending",
  });
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

// @route PUT /api/orders/:id/pay  (mark paid after Stripe confirmation; optionalAuth)
export const markOrderPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user) {
    const isOwner =
      req.user && order.user.toString() === req.user._id.toString();
    if (!isOwner && !(req.user && req.user.isAdmin)) {
      res.status(403);
      throw new Error("Not authorized for this order");
    }
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.status = "Processing";
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    provider: "Stripe",
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
  const order = await Order.findById(req.params.id);
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
