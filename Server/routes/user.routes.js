const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");
const {
  validateMongoId,
  validateUserRegistration,
} = require("../middlewares/validation.middleware");
const { asyncHandler } = require("../middlewares/error.middleware");

const router = express.Router();

// Get all users (admin only)
router.get(
  "/",
  authMiddleware,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, role, search } = req.query;

    const query = {};
    if (role && role!=='admin') {
      query.role = role;
    } else {
      query.role = { $ne: "admin" };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("-passwordHash")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  })
);

// Create user (admin only - for creating staff accounts)
router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  validateUserRegistration,
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, address } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      passwordHash,
      role,
      phone,
      address,
    });

    await user.save();

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  })
);

// Get user by ID (admin only)
router.get(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validateMongoId,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  })
);

// Update user (admin only)
router.put(
  "/:id",
  authMiddleware,
  authorize("admin"),
  validateMongoId,
  asyncHandler(async (req, res) => {
    const updates = req.body;
    delete updates.passwordHash; // Prevent password update through this route

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  })
);

// Toggle user active status (admin only)
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  authorize("admin"),
  validateMongoId,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      isActive: user.isActive,
    });
  })
);

module.exports = router;
