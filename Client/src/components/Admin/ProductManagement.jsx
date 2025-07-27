import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api.service";
import { toast } from "react-hot-toast";
import ProductForm from "./ProductForm";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (categoryFilter) params.append("category", categoryFilter);

      const response = await api.get(`/products/admin?${params}`);
      setProducts(response.products);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/products/meta/categories");
      setCategories(response.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await api.delete(`/products/${productId}`);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      await api.patch(`/products/${productId}/toggle-status`);
      toast.success(
        `Product ${currentStatus ? "deactivated" : "activated"} successfully`
      );
      fetchProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
      toast.error("Failed to update product status");
    }
  };

  const handleUpdateStock = async (productId, operation, quantity) => {
    try {
      await api.patch(`/products/${productId}/stock`, {
        quantity: parseInt(quantity),
        operation,
      });
      toast.success("Stock updated successfully");
      fetchProducts();
    } catch (error) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const handleFormSubmit = async (productData) => {
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData);
        toast.success("Product updated successfully");
      } else {
        await api.post("/products", productData);
        toast.success("Product created successfully");
      }
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Failed to save product");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="product-management"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="management-header">
        <h1>Product Management</h1>
        <button onClick={handleCreateProduct} className="btn btn-primary">
          Add New Product
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="products-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td>{product.sku}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>${product.price.toFixed(2)}</td>
                <td>{product.stock}</td>
                <td>{product.reservedStock || 0}</td>
                <td>
                  {product.availableStock ||
                    product.stock - (product.reservedStock || 0)}
                </td>
                <td>
                  <span
                    className={`status-badge ${
                      product.isActive ? "active" : "inactive"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="btn btn-small btn-secondary"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() =>
                      handleToggleStatus(product._id, product.isActive)
                    }
                    className="btn btn-small btn-warning"
                  >
                    {product.isActive ? "🚫" : "✅"}
                  </button>
                  <StockUpdater
                    productId={product._id}
                    currentStock={product.stock}
                    onUpdate={handleUpdateStock}
                  />
                  <button
                    onClick={() => handleDeleteProduct(product._id)}
                    className="btn btn-small btn-danger"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editingProduct}
            onSubmit={handleFormSubmit}
            onClose={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Stock Updater Component
const StockUpdater = ({ productId, currentStock, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [operation, setOperation] = useState("add");

  const handleSubmit = () => {
    if (!quantity || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    onUpdate(productId, operation, quantity);
    setShowModal(false);
    setQuantity("");
  };

  return (
    <span className="stock-updater-wrapper">
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-small btn-primary"
      >
        Stock
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content small"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Update Stock</h3>
            <p>Current Stock: {currentStock}</p>

            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="form-select"
            >
              <option value="add">Add to Stock</option>
              <option value="subtract">Remove from Stock</option>
              <option value="set">Set Stock to</option>
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="form-input"
              min="0"
            />

            <div className="modal-actions">
              <button onClick={handleSubmit} className="btn btn-primary">
                Update
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

export default ProductManagement;
