import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const OrderCard = ({ order }) => {
  const getStatusColor = (status) => {
    const colors = {
      PLACED: "status-placed",
      PICKED: "status-picked",
      SHIPPED: "status-shipped",
      DELIVERED: "status-delivered",
      CANCELLED: "status-cancelled",
    };
    return colors[status] || "status-default";
  };

  return (
    <motion.div
      className="order-card"
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="order-header">
        <h3>Order #{order.orderId}</h3>
        <span className={`status-badge ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="order-info">
        <p>
          <strong>Date:</strong>{" "}
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
        <p>
          <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
        </p>
        <p>
          <strong>Items:</strong> {order.items.length}
        </p>
        <p>
          <strong>Payment:</strong>
          <span className={order.paymentStatus ? "paid" : "pending"}>
            {order.paymentStatus ? " Paid" : " Pending"}
          </span>
        </p>
      </div>

      <Link to={`/orders/${order._id}`} className="btn btn-secondary">
        View Details
      </Link>
    </motion.div>
  );
};

export default OrderCard;
