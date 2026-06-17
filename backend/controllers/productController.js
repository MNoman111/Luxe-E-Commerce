import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";

const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// @route GET /api/products?search=&category=&sort=&page=
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, sort } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;

  const filter = {};
  if (search) filter.name = { $regex: search, $options: "i" };
  if (category && category !== "All") filter.category = category;

  let query = Product.find(filter);
  if (sort === "price-asc") query = query.sort({ price: 1 });
  else if (sort === "price-desc") query = query.sort({ price: -1 });
  else if (sort === "rating") query = query.sort({ rating: -1 });
  else query = query.sort({ createdAt: -1 });

  const count = await Product.countDocuments(filter);
  const products = await query.skip((page - 1) * limit).limit(limit).lean();

  res.json({ products, page, pages: Math.ceil(count / limit), count });
});

// @route GET /api/products/featured
export const getFeatured = asyncHandler(async (req, res) => {
  const products = await Product.find({ featured: true }).limit(8).lean();
  res.json(products);
});

// @route GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// @route POST /api/products  (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (!body.slug && body.name) {
    body.slug = `${slugify(body.name)}-${Date.now().toString(36)}`;
  }
  const product = await Product.create(body);
  res.status(201).json(product);
});

// @route PUT /api/products/:id  (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.name && !body.slug) body.slug = slugify(body.name);
  const product = await Product.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// @route DELETE /api/products/:id  (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ message: "Product removed" });
});

// @route POST /api/products/:id/reviews
export const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  const already = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (already) {
    res.status(400);
    throw new Error("You already reviewed this product");
  }
  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ message: "Review added" });
});
