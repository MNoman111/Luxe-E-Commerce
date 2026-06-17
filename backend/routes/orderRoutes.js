import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  markOrderPaid,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
} from "../controllers/orderController.js";
import { protect, admin, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

router.route("/").post(optionalAuth, createOrder).get(protect, admin, getAllOrders);
router.get("/mine", protect, getMyOrders);
router.get("/admin/stats", protect, admin, getOrderStats);
router.get("/:id", optionalAuth, getOrderById);
router.put("/:id/pay", optionalAuth, markOrderPaid);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
