import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import api from "../../services/api.service";
import { useWebSocket } from "../../hooks/useWebSocket";
import { toast } from "react-hot-toast";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    revenue: 0,
    statusCounts: {},
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const socket = useWebSocket();

  useEffect(() => {
    fetchDashboardData();

    if (socket && socket.on) {
      socket.on("adminStats", (data) => {
        console.log("Received admin stats:", data);
        updateStats(data);
      });

      // Listen for new orders
      socket.on("newOrder", (data) => {
        console.log("New order received:", data);
        setRecentOrders((prev) => [data.order, ...prev].slice(0, 10));
        toast.success("New order received!");
      });

      // Listen for order status changes
      socket.on("orderStatusChanged", (data) => {
        console.log("Order status changed:", data);
        updateOrderInList(data.orderId, data.newStatus);
      });

      // Request initial stats if needed
      if (socket.emit) {
        socket.emit("requestAdminStats");
      }
    }

    // Cleanup
    return () => {
      if (socket && socket.off) {
        socket.off("adminStats");
        socket.off("newOrder");
        socket.off("orderStatusChanged");
      }
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/orders?limit=10");
      console.log("Orders response:", response);

      const orders = response.orders || [];
      setRecentOrders(orders);

      // Calculate stats even if no orders
      const calculatedStats = calculateStats(orders);
      setStats(calculatedStats);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data. Please try again.");
      // Set default empty state
      setRecentOrders([]);
      setStats({
        totalOrders: 0,
        todayOrders: 0,
        revenue: 0,
        statusCounts: {},
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (orders) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(
      (order) => new Date(order.createdAt) >= today
    );

    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const revenue = orders
      .filter((order) => order.paymentStatus)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      revenue,
      statusCounts,
    };
  };

  const updateStats = (newStats) => {
    setStats((prevStats) => ({
      ...prevStats,
      ...newStats,
    }));
  };

  const updateOrderInList = (orderId, newStatus) => {
    setRecentOrders((prev) =>
      prev.map((order) =>
        order.orderId === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success("Order status updated");
      // Refresh the order in the list
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handlePaymentUpdate = async (orderId, paymentStatus) => {
    try {
      await api.patch(`/orders/${orderId}/payment`, { paymentStatus });
      toast.success("Payment status updated");
      fetchDashboardData();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Failed to update payment status");
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/export/csv`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();

      toast.success("Export completed");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Export failed");
    }
  };

  if (loading) {
    return (
      <motion.div
        className="loading-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loader"></div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="error-message"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {error}
        <button onClick={fetchDashboardData} className="btn btn-primary mt-2">
          Retry
        </button>
      </motion.div>
    );
  }

  return (
  <motion.div 
    className="admin-dashboard"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <div className="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div className="admin-nav">
        <button 
          onClick={() => window.location.href = '/admin/products'} 
          className="btn btn-secondary"
        >
          Manage Products
        </button>
        <button 
          onClick={() => window.location.href = '/admin/users'} 
          className="btn btn-secondary"
        >
          Manage Users
        </button>
        <button onClick={exportToCSV} className="btn btn-secondary">
          Export Orders
        </button>
      </div>
    </div>
    {/* ... rest of the component */}
      <div className="stats-grid">
        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <h3>Total Orders</h3>
          <p className="stat-number">{stats.totalOrders}</p>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <h3>Today's Orders</h3>
          <p className="stat-number">{stats.todayOrders}</p>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <h3>Revenue</h3>
          <p className="stat-number">${stats.revenue.toFixed(2)}</p>
        </motion.div>

        <motion.div className="stat-card" whileHover={{ scale: 1.05 }}>
          <h3>Pending Orders</h3>
          <p className="stat-number">{stats.statusCounts?.PLACED || 0}</p>
        </motion.div>
      </div>

      <div className="orders-management">
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <div className="no-orders">
            <p>
              No orders yet. Orders will appear here when customers place them.
            </p>
          </div>
        ) : (
          <div className="orders-table">
            <div className="table-header">
              <span>Order ID</span>
              <span>Customer</span>
              <span>Total</span>
              <span>Status</span>
              <span>Payment</span>
              <span>Actions</span>
            </div>

            <AnimatePresence>
              {recentOrders.map((order) => (
                <motion.div
                  key={order._id}
                  className="table-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <span>{order.orderId || "N/A"}</span>
                  <span>{order.customerId?.name || "N/A"}</span>
                  <span>${(order.totalAmount || 0).toFixed(2)}</span>
                  <span>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusUpdate(order._id, e.target.value)
                      }
                      className="status-select"
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="PICKED">PICKED</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </span>
                  <span>
                    <button
                      className={`payment-toggle ${
                        order.paymentStatus ? "paid" : "pending"
                      }`}
                      onClick={() =>
                        handlePaymentUpdate(order._id, !order.paymentStatus)
                      }
                    >
                      {order.paymentStatus ? "Paid" : "Pending"}
                    </button>
                  </span>
                  <span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-small btn-primary"
                    >
                      View
                    </button>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Order Details</h2>
              <div className="order-detail-content">
                <p>
                  <strong>Order ID:</strong> {selectedOrder.orderId}
                </p>
                <p>
                  <strong>Customer:</strong>{" "}
                  {selectedOrder.customerId?.name || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  {selectedOrder.customerId?.email || "N/A"}
                </p>
                <p>
                  <strong>Total:</strong> $
                  {(selectedOrder.totalAmount || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Status:</strong> {selectedOrder.status}
                </p>
                <p>
                  <strong>Payment:</strong>{" "}
                  {selectedOrder.paymentStatus ? "Paid" : "Pending"}
                </p>

                <h3>Items:</h3>
                <ul>
                  {selectedOrder.items?.map((item, index) => (
                    <li key={index}>
                      {item.productId?.name || "Unknown Product"} - Qty:{" "}
                      {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
