const express = require("express");
const Product = require("../models/product.model");
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");
const {
  validateProduct,
  validateMongoId,
} = require("../middlewares/validation.middleware");
const { asyncHandler } = require("../middlewares/error.middleware");

const router = express.Router();

// Get all products (public)
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, search, inStock } = req.query;

    const query = { isActive: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }
    if (inStock === "true") {
      query.$expr = { $gt: ["$stock", "$reservedStock"] };
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  })
);

router.get(
  "/admin", authMiddleware , authorize('admin','staff') ,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, search, inStock } = req.query;

    const query = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }
    if (inStock === "true") {
      query.$expr = { $gt: ["$stock", "$reservedStock"] };
    }

    const products = await Product.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  })
);

// Get product by ID (public)
router.get(
  "/:id",
  validateMongoId,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  })
);

// Create product (admin/staff only)
router.post(
  "/",
  authMiddleware,
  authorize("admin", "staff"),
  validateProduct,
  asyncHandler(async (req, res) => {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({ product });
  })
);

// Update product (admin/staff only)
router.put(
  "/:id",
  authMiddleware,
  authorize("admin", "staff"),
  validateMongoId,
  validateProduct,
  asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  })
);

// Update stock (admin/staff only)
router.patch(
  "/:id/stock",
  authMiddleware,
  authorize("admin", "staff"),
  validateMongoId,
  asyncHandler(async (req, res) => {
    const { quantity, operation } = req.body;

    if (
      !quantity ||
      !operation ||
      !["add", "subtract", "set"].includes(operation)
    ) {
      return res.status(400).json({ error: "Invalid stock update request" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    switch (operation) {
      case "add":
        product.stock += quantity;
        break;
      case "subtract":
        if (product.stock - quantity < 0) {
          return res.status(400).json({ error: "Insufficient stock" });
        }
        product.stock -= quantity;
        break;
      case "set":
        product.stock = quantity;
        break;
    }

    await product.save();

    res.json({
      message: "Stock updated successfully",
      product,
    });
  })
);

// Toggle product active status (admin only)
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  authorize("admin"),
  validateMongoId,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      message: `Product ${
        product.isActive ? "activated" : "deactivated"
      } successfully`,
      isActive: product.isActive,
    });
  })
);

// Get product categories (public)
router.get(
  "/meta/categories",
  asyncHandler(async (req, res) => {
    const categories = await Product.distinct("category", { isActive: true });
    res.json({ categories });
  })
);

module.exports = router;
