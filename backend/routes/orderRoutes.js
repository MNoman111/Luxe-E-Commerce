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
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.route("/").post(protect, createOrder).get(protect, admin, getAllOrders);
router.get("/mine", protect, getMyOrders);
router.get("/admin/stats", protect, admin, getOrderStats);
router.get("/:id", protect, getOrderById);
router.put("/:id/pay", protect, markOrderPaid);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
