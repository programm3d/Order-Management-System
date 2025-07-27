const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: {
      // Stock Keeping Unit
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedStock: {
      // Track reserved inventory
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual field for available stock
productSchema.virtual("availableStock").get(function () {
  return this.stock - this.reservedStock;
});

// Ensure virtual fields are included in JSON
productSchema.set("toJSON", {
  virtuals: true,
});

// Index for efficient queries
productSchema.index({ name: "text" }); // For text search
productSchema.index({ category: 1 });

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
