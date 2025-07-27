import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api.service';
import { toast } from 'react-hot-toast';

const CreateOrder = () => {
  const { cartItems, clearCart, getTotalAmount, updateQuantity, removeFromCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState(user?.address || {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [notes, setNotes] = useState('');

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress({
      ...shippingAddress,
      [name]: value
    });
  };

  const handleSubmitOrder = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress,
        notes
      };

      const response = await api.post('/orders', orderData);
      
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${response.order._id}`);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <motion.div 
        className="empty-cart"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2>Your Cart is Empty</h2>
        <p>Add some products to your cart to place an order.</p>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/')}
        >
          Browse Products
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="create-order-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1>Review Your Order</h1>

      <div className="order-layout">
        <div className="order-items">
          <h2>Cart Items</h2>
          <AnimatePresence>
            {cartItems.map(item => (
              <motion.div 
                key={item.productId}
                className="cart-item"
                initial={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                // src/components/Orders/CreateOrder.jsx (continued)
                <div className="item-info">
                  <h4>{item.product.name}</h4>
                  <p className="item-sku">SKU: {item.product.sku}</p>
                  <p className="item-price">${item.product.price.toFixed(2)} each</p>
                </div>
                
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="btn-small"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="btn-small"
                    >
                      +
                    </button>
                  </div>
                  
                  <p className="item-total">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="btn btn-danger btn-small"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div className="cart-total">
            <h3>Total: ${getTotalAmount().toFixed(2)}</h3>
          </div>
        </div>

        <div className="order-details">
          <h2>Shipping Address</h2>
          <form className="address-form">
            <div className="form-group">
              <label>Street Address</label>
              <input
                type="text"
                name="street"
                value={shippingAddress.street}
                onChange={handleAddressChange}
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={shippingAddress.zipCode}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={shippingAddress.country}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
          </form>

          <div className="form-group">
            <label>Order Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions..."
              rows={3}
            />
          </div>

          <button
            className="btn btn-primary btn-large"
            onClick={handleSubmitOrder}
            disabled={loading}
          >
            {loading ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateOrder;