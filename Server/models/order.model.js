const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product",
    required: true 
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtTime: { 
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderId: { 
      type: String,
      unique: true,
      required: true
    },
    customerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    },
    items: {
      type: [orderItemSchema],
      validate: [array => array.length > 0, 'Order must have at least one item']
    },
    status: {
      type: String,
      enum: ["PLACED", "PICKED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },
    paymentStatus: { 
      type: Boolean, 
      default: false 
    },
    totalAmount: {
      type: Number,
      required: true
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    notes: String,
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);


// Index for efficient queries
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

const orderModel = mongoose.model("Order", orderSchema);

module.exports = orderModel;