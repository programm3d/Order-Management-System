import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api.service";
import { toast } from "react-hot-toast";

const CreateOrderForCustomer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (customerSearch.length > 2) {
      fetchCustomers(customerSearch);
    }
  }, [customerSearch]);

  const fetchCustomers = async (search = "") => {
    try {
      const params = new URLSearchParams();
      params.append("role", "customer");
      if (search) params.append("search", search);
      params.append("limit", 20);

      const response = await api.get(`/users?${params}`);
      setCustomers(response.users || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products?limit=100");
      setProducts(response.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      setSelectedCustomer(customerId);
      if (customer.address) {
        setShippingAddress(customer.address);
      }
    }
  };

  const handleAddProduct = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1 }]);
  };

  const handleRemoveProduct = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress({
      ...shippingAddress,
      [field]: value,
    });
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const product = products.find((p) => p._id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    // Validation
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (orderItems.length === 0 || orderItems.some((item) => !item.productId)) {
      toast.error("Please add at least one product");
      return;
    }

    if (!shippingAddress.street || !shippingAddress.city) {
      toast.error("Please provide shipping address");
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerId: selectedCustomer,
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
        })),
        shippingAddress,
        notes,
        paymentStatus,
      };

      const response = await api.post("/orders/create-for-customer", orderData);

      toast.success("Order created successfully!");
      navigate(`/orders/${response.order._id}`);
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="create-order-for-customer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1>Create Order for Customer</h1>

      <div className="order-form-container">
        {/* Customer Selection */}
        <div className="form-section">
          <h2>Select Customer</h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="Search customer by name or email..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="form-group">
            <select
              value={selectedCustomer}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer._id} value={customer._id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Selection */}
        <div className="form-section">
          <h2>Order Items</h2>
          {orderItems.map((item, index) => (
            <div key={index} className="order-item-row">
              <select
                value={item.productId}
                onChange={(e) =>
                  handleProductChange(index, "productId", e.target.value)
                }
                className="product-select"
                required
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - ${product.price} (Stock:{" "}
                    {product.availableStock || product.stock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  handleProductChange(index, "quantity", e.target.value)
                }
                className="quantity-input"
                placeholder="Qty"
              />

              <span className="item-total">
                $
                {(() => {
                  const product = products.find(
                    (p) => p._id === item.productId
                  );
                  return product
                    ? (product.price * item.quantity).toFixed(2)
                    : "0.00";
                })()}
              </span>

              <button
                onClick={() => handleRemoveProduct(index)}
                className="btn btn-danger btn-small"
              >
                Remove
              </button>
            </div>
          ))}

          <button onClick={handleAddProduct} className="btn btn-secondary">
            Add Product
          </button>

          <div className="order-total">
            <h3>Total: ${calculateTotal().toFixed(2)}</h3>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="form-section">
          <h2>Shipping Address</h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="Street Address"
              value={shippingAddress.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="State"
                value={shippingAddress.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                placeholder="Zip Code"
                value={shippingAddress.zipCode}
                onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Country"
                value={shippingAddress.country}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="form-section">
          <h2>Additional Options</h2>
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.checked)}
              />
              Payment Received
            </label>
          </div>

          <div className="form-group">
            <label>Order Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            onClick={handleSubmitOrder}
            disabled={loading}
            className="btn btn-primary btn-large"
          >
            {loading ? "Creating Order..." : "Create Order"}
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CreateOrderForCustomer;
