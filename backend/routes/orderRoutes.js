import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  confirmPayment,
} from "../controllers/orderController.js";
import { protect, admin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.route("/").post(optionalAuth, createOrder).get(protect, admin, getAllOrders);
router.get("/mine", protect, getMyOrders);
router.get("/admin/stats", protect, admin, getOrderStats);
router.get("/:id", optionalAuth, getOrderById);
router.put("/:id/confirm-payment", protect, admin, confirmPayment);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
