import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  image: String,
  price: Number,
  size: String,
  qty: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    // Optional: guest orders have no user, identified by guestEmail instead.
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isGuest: { type: Boolean, default: false },
    guestEmail: { type: String, lowercase: true, trim: true },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Stripe", "COD"],
      default: "Stripe",
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    voucherCode: { type: String, default: null },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: Date,
    paymentResult: {
      id: String,
      status: String,
      provider: String,
    },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: Date,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
