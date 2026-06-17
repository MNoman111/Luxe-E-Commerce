import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendToken = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  // Token-only auth: the client stores this and sends it as a Bearer header.
  // No auth cookie is set, so client-side logout fully de-authenticates the user.
  res.status(statusCode).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      notificationEmail: user.notificationEmail || "",
      savedAddress: user.savedAddress || {},
    },
  });
};

// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Email already registered");
  }
  const user = await User.create({ name, email, password });
  sendToken(res, user, 201);
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  sendToken(res, user);
});

// @route POST /api/auth/logout
// Token-only auth: the client discards its stored token. Endpoint kept for symmetry.
export const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out" });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

// @route PUT /api/auth/profile   (protected)
// Update display name and/or saved shipping address.
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, notificationEmail, savedAddress } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (typeof name === "string" && name.trim()) user.name = name.trim();
  // The login email is fixed; this is only where order confirmations are sent.
  if (typeof notificationEmail === "string") {
    user.notificationEmail = notificationEmail.trim().toLowerCase();
  }
  if (savedAddress && typeof savedAddress === "object") {
    const fields = ["fullName", "address", "city", "postalCode", "country", "phone"];
    user.savedAddress = {
      ...user.savedAddress,
      ...Object.fromEntries(
        fields.map((f) => [f, savedAddress[f] ?? user.savedAddress?.[f] ?? ""])
      ),
    };
  }
  await user.save();
  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      notificationEmail: user.notificationEmail || "",
      savedAddress: user.savedAddress || {},
    },
  });
});
