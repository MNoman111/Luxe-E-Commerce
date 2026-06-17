import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import Order from "../models/Order.js";

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

// @route POST /api/payment/create-intent  { orderId }
// Creates a Stripe PaymentIntent for an existing order and returns clientSecret.
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  // Guest orders (no user) can be paid by anyone with the order id; user orders need the owner.
  if (order.user) {
    const isOwner =
      req.user && order.user.toString() === req.user._id.toString();
    if (!isOwner) {
      res.status(403);
      throw new Error("Not authorized for this order");
    }
  }

  const intent = await getStripe().paymentIntents.create({
    amount: Math.round(order.totalPrice * 100), // smallest currency unit
    currency: process.env.STRIPE_CURRENCY || "usd",
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: order._id.toString(),
      userId: req.user ? req.user._id.toString() : "guest",
    },
  });

  res.json({ clientSecret: intent.client_secret, amount: order.totalPrice });
});

// Mark an order paid from a verified Stripe event (single source of truth).
const fulfillOrder = async (paymentIntent) => {
  const orderId = paymentIntent.metadata?.orderId;
  if (!orderId) return;
  const order = await Order.findById(orderId);
  if (!order || order.isPaid) return;
  order.isPaid = true;
  order.paidAt = new Date();
  order.status = "Processing";
  order.paymentResult = {
    id: paymentIntent.id,
    status: paymentIntent.status,
    provider: "Stripe",
  };
  await order.save();
  console.log(`Order ${orderId} marked paid via webhook.`);
};

// @route POST /api/payment/webhook   (Stripe calls this; raw body required)
// Verifies the Stripe signature and confirms payment server-side.
export const stripeWebhook = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event = req.body;

  try {
    if (secret) {
      const signature = req.headers["stripe-signature"];
      event = getStripe().webhooks.constructEvent(req.body, signature, secret);
    } else {
      // No secret configured (local dev without Stripe CLI): parse raw body.
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "payment_intent.succeeded") {
      await fulfillOrder(event.data.object);
    }
  } catch (err) {
    console.error("Webhook handler error:", err.message);
  }

  res.json({ received: true });
};
