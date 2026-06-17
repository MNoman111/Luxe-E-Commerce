import express from "express";
import { createPaymentIntent } from "../controllers/paymentController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-intent", optionalAuth, createPaymentIntent);

export default router;
