import mongoose from "mongoose";

// A short-lived snapshot of an order, saved when a Stripe PaymentIntent is created.
// It is NOT an order — it only exists so the order can be created from a SUCCESSFUL
// payment, whether finalized by the browser or by the Stripe webhook (safety net).
// Auto-expires after 24h so abandoned drafts never accumulate.
const draftItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    image: String,
    price: Number,
    size: String,
    qty: Number,
  },
  { _id: false }
);

const paymentDraftSchema = new mongoose.Schema({
  paymentIntentId: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isGuest: { type: Boolean, default: false },
  email: String, // where the confirmation is sent
  accountEmail: String, // registered account email (null for guests) — shown to admin
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  paymentMethod: { type: String, default: "Stripe" },
  voucherCode: { type: String, default: null },
  orderItems: [draftItemSchema],
  itemsPrice: Number,
  discountAmount: Number,
  shippingPrice: Number,
  taxPrice: Number,
  totalPrice: Number,
  createdAt: { type: Date, default: Date.now, expires: "24h" },
});

export default mongoose.model("PaymentDraft", paymentDraftSchema);
