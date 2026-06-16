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
import { notFound, errorHandler } from "./middleware/error.js";
import { stripeWebhook } from "./controllers/paymentController.js";

dotenv.config();
connectDB();

const app = express();

// Render (and most PaaS) sit behind a proxy; required for secure cookies + correct IPs.
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`LUXE API running on http://localhost:${PORT}`)
);
