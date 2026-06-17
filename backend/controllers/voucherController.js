import asyncHandler from "express-async-handler";
import Voucher from "../models/Voucher.js";

// @route POST /api/vouchers/validate   { code, subtotal }
// Signed-in only: checks a code (incl. one-use-per-user) and returns the discount.
export const validateVoucher = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const amount = Number(subtotal) || 0;
  let voucher;
  try {
    voucher = await Voucher.validateCode(code, amount, req.user._id);
  } catch (err) {
    res.status(400);
    throw err;
  }
  res.json({
    code: voucher.code,
    description: voucher.description,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    discountAmount: voucher.discountFor(amount),
    expiresAt: voucher.expiresAt,
  });
});

// @route GET /api/vouchers   (admin)
export const getVouchers = asyncHandler(async (req, res) => {
  const vouchers = await Voucher.find({}).sort({ createdAt: -1 }).lean();
  res.json(vouchers);
});

// @route POST /api/vouchers   (admin)
export const createVoucher = asyncHandler(async (req, res) => {
  const { code, description, discountType, discountValue, minOrder, expiresAt, usageLimit, active } =
    req.body;
  if (!code || discountValue == null) {
    res.status(400);
    throw new Error("Code and discount value are required");
  }
  const exists = await Voucher.findOne({ code: String(code).toUpperCase().trim() });
  if (exists) {
    res.status(400);
    throw new Error("A voucher with that code already exists");
  }
  const voucher = await Voucher.create({
    code,
    description,
    discountType: discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(discountValue),
    minOrder: Number(minOrder) || 0,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    usageLimit: Number(usageLimit) || 0,
    active: active !== false,
  });
  res.status(201).json(voucher);
});

// @route PUT /api/vouchers/:id   (admin)
export const updateVoucher = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.expiresAt) body.expiresAt = new Date(body.expiresAt);
  const voucher = await Voucher.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  res.json(voucher);
});

// @route DELETE /api/vouchers/:id   (admin)
export const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await Voucher.findByIdAndDelete(req.params.id);
  if (!voucher) {
    res.status(404);
    throw new Error("Voucher not found");
  }
  res.json({ message: "Voucher removed" });
});
