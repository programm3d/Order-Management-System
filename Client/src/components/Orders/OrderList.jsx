import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import OrderCard from "./OrderCard";
import api from "../../services/api.service";
import { AuthContext } from "../../contexts/AuthContext";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    paymentStatus: "",
  });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.paymentStatus)
        params.append("paymentStatus", filters.paymentStatus);

      const data = await api.get(`/orders?${params}`);
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  return (
    <div className="order-list-container">
      <h1>My Orders</h1>

      <div className="filters">
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="PLACED">Placed</option>
          <option value="PICKED">Picked</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          name="paymentStatus"
          value={filters.paymentStatus}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Payments</option>
          <option value="true">Paid</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {loading ? (
        <motion.div
          className="loading-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="loader"></div>
        </motion.div>
      ) : (
        <motion.div
          className="orders-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {orders.length > 0 ? (
            orders.map((order) => <OrderCard key={order._id} order={order} />)
          ) : (
            <p className="no-orders">No orders found</p>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default OrderList;
