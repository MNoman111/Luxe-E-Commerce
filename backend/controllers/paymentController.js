import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import PaymentDraft from "../models/PaymentDraft.js";
import { priceOrder, finalizeStripeOrder } from "./orderController.js";

let stripe = null;
const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// @route POST /api/payment/create-intent   (full checkout payload)
// Computes the amount from the cart, creates a Stripe PaymentIntent, and saves a
// short-lived draft so the order can be created from a successful payment by either
// the browser or the webhook. No order is created here.
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderItems, voucherCode, shippingAddress, contactEmail, guestEmail } = req.body;
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const isGuest = !req.user;
  let email;
  if (isGuest) {
    email = (guestEmail || "").trim();
    if (!email) {
      res.status(400);
      throw new Error("An email address is required to place a guest order");
    }
  } else {
    email = ((contactEmail && contactEmail.trim()) || req.user.email).toLowerCase();
  }

  let pricing;
  try {
    pricing = await priceOrder({ orderItems, voucherCode, userId: req.user?._id, isGuest });
  } catch (err) {
    res.status(400);
    throw err;
  }

  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(pricing.totalPrice * 100), // smallest currency unit
    currency: process.env.STRIPE_CURRENCY || "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { userId: req.user ? req.user._id.toString() : "guest" },
  });

  // Save the draft so a successful payment can always be turned into an order.
  await PaymentDraft.findOneAndUpdate(
    { paymentIntentId: intent.id },
    {
      paymentIntentId: intent.id,
      user: req.user?._id || null,
      isGuest,
      email,
      accountEmail: isGuest ? null : req.user.email,
      shippingAddress,
      paymentMethod: "Stripe",
      voucherCode: pricing.appliedCode,
      orderItems: pricing.lineItems,
      itemsPrice: pricing.itemsPrice,
      discountAmount: pricing.discountAmount,
      shippingPrice: pricing.shippingPrice,
      taxPrice: pricing.taxPrice,
      totalPrice: pricing.totalPrice,
      createdAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  res.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
    amount: pricing.totalPrice,
  });
});

// @route POST /api/payment/webhook   (Stripe calls this; raw body required)
// Safety net: if the browser never finalizes the order after paying (closed tab,
// lost connection), Stripe's payment_intent.succeeded event creates the order here.
export const stripeWebhook = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = req.body;

  try {
    if (secret) {
      const signature = req.headers["stripe-signature"];
      event = getStripe().webhooks.constructEvent(req.body, signature, secret);
    } else {
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await finalizeStripeOrder(event.data.object.id);
    }
  } catch (err) {
    console.error("Webhook order finalization error:", err.message);
  }

  res.json({ received: true });
};
