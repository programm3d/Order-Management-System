import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api.service';
import { useWebSocket } from '../../hooks/useWebSocket';

const OrderDetails = ({ isPublic = false }) => {
  const { orderId, id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const socket = useWebSocket();

  useEffect(() => {
    fetchOrderDetails();
    
    if (!isPublic && socket && socket.on && socket.emit) {
      const orderToSubscribe = orderId || id;
      
      // Subscribe to order updates
      socket.emit('subscribeToOrder', orderToSubscribe);
      
      // Listen for status updates
      socket.on('orderStatusUpdated', (data) => {
        if (data.orderId === order?.orderId) {
          setOrder(prev => ({ ...prev, status: data.newStatus }));
        }
      });
      
      // Cleanup
      return () => {
        if (socket.off && socket.emit) {
          socket.emit('unsubscribeFromOrder', orderToSubscribe);
          socket.off('orderStatusUpdated');
        }
      };
    }
  }, [orderId, id, isPublic, order?.orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      let data;
      if (isPublic) {
        data = await api.get(`/orders/lookup/${orderId}`);
      } else {
        data = await api.get(`/orders/${id}`);
      }
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusProgress = () => {
    const statuses = ['PLACED', 'PICKED', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statuses.indexOf(order?.status);
    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      active: index === currentIndex
    }));
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

  if (!order) {
    return <div className="error-message">Order not found</div>;
  }

  return (
    <motion.div 
      className="order-details-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1>Order #{order.orderId}</h1>

      <div className="order-progress">
        {getStatusProgress().map((step, index) => (
          <div key={step.status} className={`progress-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}>
            <div className="step-indicator">{index + 1}</div>
            <span className="step-label">{step.status}</span>
          </div>
        ))}
      </div>

      <div className="order-details-grid">
        <div className="order-section">
          <h2>Order Information</h2>
          <div className="info-group">
            <p><strong>Order ID:</strong> {order.orderId}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> {order.status}</p>
            <p><strong>Payment:</strong> {order.paymentStatus ? 'Paid' : 'Pending'}</p>
            <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        {!isPublic && order.shippingAddress && (
          <div className="order-section">
            <h2>Shipping Address</h2>
            <div className="info-group">
              <p>{order.shippingAddress.street}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        )}

        <div className="order-section full-width">
          <h2>Order Items</h2>
          <div className="order-items-list">
            {order.items.map((item, index) => (
              <div key={index} className="order-item-detail">
                <div className="item-info">
                  <h4>{item.productId?.name || 'Product Name'}</h4>
                  <p>SKU: {item.productId?.sku || 'N/A'}</p>
                </div>
                <div className="item-quantity">
                  Qty: {item.quantity}
                </div>
                <div className="item-price">
                  ${((item.priceAtTime || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isPublic && order.notes && (
          <div className="order-section full-width">
            <h2>Order Notes</h2>
            <p>{order.notes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default OrderDetails;