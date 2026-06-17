import mongoose from "mongoose";

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
      default: "percent",
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, default: 0 }, // minimum items subtotal required
    expiresAt: { type: Date }, // optional; null = never expires
    usageLimit: { type: Number, default: 0 }, // 0 = unlimited (total across all users)
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // one use per user
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Discount amount this voucher yields for a given items subtotal.
voucherSchema.methods.discountFor = function (subtotal) {
  let amount =
    this.discountType === "percent"
      ? (subtotal * this.discountValue) / 100
      : this.discountValue;
  amount = Math.min(amount, subtotal); // never discount below zero
  return +amount.toFixed(2);
};

// Throws a descriptive error if the code can't be applied to `subtotal` by `userId`.
// Vouchers are for signed-in users only, and each user may redeem a code once.
voucherSchema.statics.validateCode = async function (code, subtotal, userId) {
  if (!code) throw new Error("No voucher code provided");
  if (!userId) throw new Error("Please sign in to use a voucher code");
  const voucher = await this.findOne({ code: String(code).toUpperCase().trim() });
  if (!voucher || !voucher.active) throw new Error("Invalid voucher code");
  if (voucher.expiresAt && voucher.expiresAt.getTime() < Date.now())
    throw new Error("This voucher has expired");
  if (subtotal < voucher.minOrder)
    throw new Error(`A minimum order of $${voucher.minOrder} is required for this voucher`);
  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit)
    throw new Error("This voucher has reached its usage limit");
  const already = voucher.usedBy.some(
    (id) => id.toString() === userId.toString()
  );
  if (already) throw new Error("You have already used this voucher");
  return voucher;
};

export default mongoose.model("Voucher", voucherSchema);
