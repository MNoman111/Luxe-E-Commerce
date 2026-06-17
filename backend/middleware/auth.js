import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// Reads the bearer token from the Authorization header. Token-only auth (no cookies)
// so logging out on the client (clearing the token) fully de-authenticates the request.
const getBearer = (req) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.split(" ")[1];
  return null;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = getBearer(req);

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized, user not found");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token failed");
  }
});

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) return next();
  res.status(403);
  throw new Error("Admin access required");
};

// Sets req.user if a valid token is present, but never blocks the request.
// Used for endpoints that work for both logged-in users and guests.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getBearer(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      req.user = null;
    }
  }
  next();
});
