import express from "express";
import {
  validateVoucher,
  getVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
} from "../controllers/voucherController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.post("/validate", protect, validateVoucher); // signed-in users only
router.route("/").get(protect, admin, getVouchers).post(protect, admin, createVoucher);
router
  .route("/:id")
  .put(protect, admin, updateVoucher)
  .delete(protect, admin, deleteVoucher);

export default router;
