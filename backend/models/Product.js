import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    rating: { type: Number, required: true },
    comment: String,
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, default: "LUXE" },
    category: {
      type: String,
      required: true,
      enum: ["Men", "Women", "Accessories", "Footwear"],
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    image: { type: String, required: true },
    images: [String],
    sizes: { type: [String], default: ["S", "M", "L", "XL"] },
    colors: { type: [String], default: [] },
    countInStock: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
