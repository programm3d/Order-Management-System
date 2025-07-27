// src/components/Products/ProductCard.jsx
import React, { useContext } from "react";
import { motion } from "framer-motion";
import { CartContext } from "../../contexts/CartContext";
import { AuthContext } from "../../contexts/AuthContext";
import { toast } from "react-hot-toast";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    addToCart(product);
  };

  const isAvailable = product.stock - product.reservedStock > 0;

  return (
    <motion.div
      className="product-card"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="product-header">
        <h3>{product.name}</h3>
        <span className="product-sku">{product.sku}</span>
      </div>

      <p className="product-description">{product.description}</p>

      <div className="product-info">
        <span className="product-price">${product.price.toFixed(2)}</span>
        <span className={`product-stock ${!isAvailable ? "out-of-stock" : ""}`}>
          {isAvailable ? `${product.availableStock} available` : "Out of Stock"}
        </span>
      </div>

      <div className="product-category">
        <span className="category-tag">{product.category}</span>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleAddToCart}
        disabled={!isAvailable}
      >
        {isAvailable ? "Add to Cart" : "Out of Stock"}
      </button>
    </motion.div>
  );
};

export default ProductCard;
