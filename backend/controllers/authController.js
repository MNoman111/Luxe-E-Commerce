import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendToken = (res, user, statusCode = 200) => {
  const token = signToken(user._id);
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    // Cross-site (frontend and API on different domains) requires SameSite=None + Secure.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(statusCode).json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
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
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// @route GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
