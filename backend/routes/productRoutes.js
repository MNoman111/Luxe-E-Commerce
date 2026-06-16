import express from "express";
import {
  getProducts,
  getFeatured,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createReview,
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

router.route("/").get(getProducts).post(protect, admin, createProduct);
router.get("/featured", getFeatured);
router.post("/:id/reviews", protect, createReview);
router
  .route("/:id")
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
