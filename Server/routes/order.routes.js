const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const { authMiddleware, authorize } = require("../middlewares/auth.middleware");
const {
  validateOrder,
  validateOrderStatus,
  validateMongoId,
  validateOrderId,
} = require("../middlewares/validation.middleware");
const { asyncHandler } = require("../middlewares/error.middleware");
const { orderLimiter } = require("../middlewares/rateLimit.middleware");
const { getIO } = require("../services/websocket.service");

const router = express.Router();

// Helper function to reserve inventory
const reserveInventory = async (items, session) => {
  for (const item of items) {
    const product = await Product.findById(item.productId).session(session);

    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    if (product.availableStock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    product.reservedStock += item.quantity;
    await product.save({ session });
  }
};

// Helper function to release inventory
const releaseInventory = async (items, session) => {
  for (const item of items) {
    const product = await Product.findById(item.productId).session(session);

    if (product) {
      product.reservedStock = Math.max(
        0,
        product.reservedStock - item.quantity
      );
      await product.save({ session });
    }
  }
};


router.post(
  "/",
  authMiddleware,
  orderLimiter,
  validateOrder,
  asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { items, shippingAddress, notes } = req.body;

      // Calculate total and prepare order items with priceAtTime
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      let orderId = `ORD-${timestamp}-${random}`;

      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);

        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} not found or inactive`);
        }

        if (product.availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: product.price, // Make sure this is included
        });
      }

      // Reserve inventory
      await reserveInventory(items, session);

      const order = new Order({
        orderId,
        customerId: req.user._id,
        items: orderItems,
        totalAmount,
        shippingAddress: shippingAddress || req.user.address,
        notes,
        createdBy: req.user._id,
      });

      await order.save({ session });
      await session.commitTransaction();

      // Populate product details
      await order.populate("items.productId", "name sku price");

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        // Notify the customer
        io.to(`user:${order.customerId}`).emit("orderCreated", {
          orderId: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount,
          timestamp: new Date(),
        });

        // Notify admin/staff
        io.to("admin-room").emit("newOrder", {
          order: {
            _id: order._id,
            orderId: order.orderId,
            customerId: order.customerId,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
          },
        });
      }

      res.status(201).json({ order });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  })
);

router.post(
  "/create-for-customer",
  authMiddleware,
  authorize("staff", "admin"),
  validateOrder,
  asyncHandler(async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { customerId, items, shippingAddress, notes, paymentStatus } =
        req.body;

      // Verify customer exists
      const customer = await mongoose.model("User").findById(customerId);
      if (!customer || customer.role !== "customer") {
        throw new Error("Invalid customer");
      }

      // Calculate total and prepare order items with priceAtTime
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);

        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} not found or inactive`);
        }

        if (product.availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}`);
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          priceAtTime: product.price, // Make sure this is included
        });
      }

      // Reserve inventory
      await reserveInventory(items, session);

      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 5).toUpperCase();
      let orderId = `ORD-${timestamp}-${random}`;
      const order = new Order({
        orderId,
        customerId,
        items: orderItems,
        totalAmount,
        shippingAddress: shippingAddress || customer.address,
        notes,
        paymentStatus: paymentStatus || false,
        createdBy: req.user._id,
      });

      await order.save({ session });
      await session.commitTransaction();

      // Populate product details
      await order.populate("items.productId", "name sku price");

      // Emit WebSocket event
      const io = getIO();
      if (io) {
        // Notify the customer
        io.to(`user:${order.customerId}`).emit("orderCreated", {
          orderId: order.orderId,
          status: order.status,
          totalAmount: order.totalAmount,
          timestamp: new Date(),
        });

        // Notify admin/staff
        io.to("admin-room").emit("newOrder", {
          order: {
            _id: order._id,
            orderId: order.orderId,
            customerId: order.customerId,
            totalAmount: order.totalAmount,
            status: order.status,
            createdAt: order.createdAt,
          },
        });
      }

      res.status(201).json({ order });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  })
);
// Get all orders (admin/staff see all, customers see their own)
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      paymentStatus,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    // Customers can only see their own orders
    if (req.user.role === "customer") {
      query.customerId = req.user._id;
    }

    if (status) query.status = status;
    if (paymentStatus !== undefined)
      query.paymentStatus = paymentStatus === "true";

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate("customerId", "name email")
      .populate("items.productId", "name sku")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  })
);

// Get order by orderId (public lookup)
router.get(
  "/lookup/:orderId",
  validateOrderId,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderId: req.params.orderId })
      .populate("items.productId", "name sku")
      .select("orderId status items totalAmount createdAt");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ order });
  })
);

// Get order by ID (authenticated)
router.get(
  "/:id",
  authMiddleware,
  validateMongoId,
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id };

    // Customers can only see their own orders
    if (req.user.role === "customer") {
      query.customerId = req.user._id;
    }

    const order = await Order.findOne(query)
      .populate("customerId", "name email phone")
      .populate("items.productId", "name sku price")
      .populate("createdBy", "name email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ order });
  })
);

// Update order status (staff/admin only)
router.patch(
  "/:id/status",
  authMiddleware,
  authorize("staff", "admin"),
  validateMongoId,
  validateOrderStatus,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        throw new Error("Order not found");
      }

      const oldStatus = order.status;

      // Handle cancelled orders - release inventory
      if (status === "CANCELLED" && oldStatus !== "CANCELLED") {
        await releaseInventory(order.items, session);
      }

      // Handle reactivating cancelled orders - reserve inventory again
      if (oldStatus === "CANCELLED" && status !== "CANCELLED") {
        await reserveInventory(order.items, session);
      }

      order.status = status;
      await order.save({ session });

      await session.commitTransaction();

      // Emit WebSocket event
      const io = getIO();

      // Notify the customer
      io.to(`user:${order.customerId}`).emit("orderStatusUpdated", {
        orderId: order.orderId,
        oldStatus,
        newStatus: status,
        timestamp: new Date(),
      });

      // Notify admin/staff
      io.to("admin-room").emit("orderStatusChanged", {
        orderId: order.orderId,
        customerId: order.customerId,
        oldStatus,
        newStatus: status,
        updatedBy: req.user._id,
      });
      res.json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  })
);

// Update payment status (staff/admin only)
router.patch(
  "/:id/payment",
  authMiddleware,
  authorize("staff", "admin"),
  validateMongoId,
  asyncHandler(async (req, res) => {
    const { paymentStatus } = req.body;

    if (typeof paymentStatus !== "boolean") {
      return res
        .status(400)
        .json({ error: "Payment status must be a boolean" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({
      message: "Payment status updated successfully",
      order,
    });
  })
);

// Export orders to CSV (admin/staff only)
router.get(
  "/export/csv",
  authMiddleware,
  authorize("staff", "admin"),
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .populate("customerId", "name email")
      .populate("items.productId", "name sku")
      .sort({ createdAt: -1 });

    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Create CSV
    const csv = [
      "Order ID,Customer Name,Customer Email,Status,Payment Status,Total Amount,Created At",
      ...orders.map(
        (order) =>
          `${order.orderId},"${order.customerId.name}",${
            order.customerId.email
          },${order.status},${order.paymentStatus},${
            order.totalAmount
          },${formatDate(order.createdAt)}`
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
    res.send(csv);
  })
);

module.exports = router;
