import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import voucherRoutes from "./routes/voucherRoutes.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { stripeWebhook } from "./controllers/paymentController.js";

dotenv.config();

const app = express();

// Render/Vercel/most PaaS sit behind a proxy; needed for secure cookies + correct IPs.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Ensure the DB is connected before handling any request (serverless-friendly; cached).
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Stripe webhook needs the raw request body, so it is mounted BEFORE express.json().
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ status: "ok", service: "LUXE API" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/vouchers", voucherRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
