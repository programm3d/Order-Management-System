const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    type: {
      type: String,
      enum: ["RESERVATION", "RELEASE", "ADJUSTMENT"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    reason: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

inventoryTransactionSchema.index({ productId: 1 });
inventoryTransactionSchema.index({ orderId: 1 });

const inventoryTransactionModel = mongoose.model(
  "InventoryTransaction",
  inventoryTransactionSchema
);

module.exports = inventoryTransactionModel;
