const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");
const Order = require("../models/order.model");

let io;

const initializeWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded._id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.userEmail} connected`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // If staff/admin, join admin room
    if (["staff", "admin"].includes(socket.userRole)) {
      socket.join("admin-room");

      // Send initial stats to admin
      sendAdminStats(socket);
    }

    // Handle custom events
    socket.on("subscribeToOrder", async (orderId) => {
      try {
        // Verify user has access to this order
        const order = await Order.findOne({ orderId });

        if (
          order &&
          (order.customerId.toString() === socket.userId ||
            ["staff", "admin"].includes(socket.userRole))
        ) {
          socket.join(`order:${orderId}`);
          socket.emit("subscribedToOrder", { orderId, success: true });
        } else {
          socket.emit("subscribedToOrder", {
            orderId,
            success: false,
            error: "Access denied",
          });
        }
      } catch (error) {
        socket.emit("subscribedToOrder", {
          orderId,
          success: false,
          error: error.message,
        });
      }
    });

    socket.on("unsubscribeFromOrder", (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("requestAdminStats", () => {
      if (["staff", "admin"].includes(socket.userRole)) {
        sendAdminStats(socket);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.userEmail} disconnected`);
    });
  });

  return io;
};

// Helper function to send admin statistics
const sendAdminStats = async (socket) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
    });

    socket.emit("adminStats", {
      stats,
      totalOrders,
      todayOrders,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error sending admin stats:", error);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error("WebSocket not initialized");
  }
  return io;
};

// Utility functions for common emissions
const emitOrderUpdate = (orderId, customerId, event, data) => {
  const io = getIO();

  // Notify customer
  io.to(`user:${customerId}`).emit(event, data);

  // Notify anyone subscribed to this specific order
  io.to(`order:${orderId}`).emit(event, data);

  // Notify admin room
  io.to("admin-room").emit(event, { ...data, customerId });
};

const broadcastToAdmins = (event, data) => {
  const io = getIO();
  io.to("admin-room").emit(event, data);
};

module.exports = {
  initializeWebSocket,
  getIO,
  emitOrderUpdate,
  broadcastToAdmins,
};
