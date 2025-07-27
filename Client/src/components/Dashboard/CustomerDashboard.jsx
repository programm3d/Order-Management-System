import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api.service';

const CustomerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const ordersData = await api.get('/orders?limit=5');
      
      const totalOrders = ordersData.total;
      const pendingOrders = ordersData.orders.filter(o => 
        ['PLACED', 'PICKED', 'SHIPPED'].includes(o.status)
      ).length;
      const deliveredOrders = ordersData.orders.filter(o => 
        o.status === 'DELIVERED'
      ).length;

      setStats({
        totalOrders,
        pendingOrders,
        deliveredOrders,
        recentOrders: ordersData.orders
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  return (
    <motion.div 
      className="customer-dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1>Welcome back, {user.name}!</h1>

      <div className="stats-grid">
        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.05 }}
        >
          <h3>Total Orders</h3>
          <p className="stat-number">{stats.totalOrders}</p>
        </motion.div>

        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.05 }}
        >
          <h3>Pending Orders</h3>
          <p className="stat-number">{stats.pendingOrders}</p>
        </motion.div>

        <motion.div 
          className="stat-card"
          whileHover={{ scale: 1.05 }}
        >
          <h3>Delivered Orders</h3>
          <p className="stat-number">{stats.deliveredOrders}</p>
        </motion.div>
      </div>

      <div className="recent-orders-section">
        <h2>Recent Orders</h2>
        {stats.recentOrders.length > 0 ? (
          <div className="recent-orders-list">
            {stats.recentOrders.map(order => (
              <div key={order._id} className="recent-order-item">
                <div className="order-info">
                  <h4>Order #{order.orderId}</h4>
                // src/components/Dashboard/CustomerDashboard.jsx (continued)
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="order-status">
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
                <div className="order-amount">
                  ${order.totalAmount.toFixed(2)}
                </div>
                <Link to={`/orders/${order._id}`} className="btn btn-secondary btn-small">
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>No orders yet</p>
        )}
        
        <div className="dashboard-actions">
          <Link to="/orders" className="btn btn-primary">View All Orders</Link>
          <Link to="/" className="btn btn-secondary">Browse Products</Link>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerDashboard;