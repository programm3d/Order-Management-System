const { body, param, query, validationResult } = require("express-validator");

// Generic validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["customer", "staff", "admin"]),
  handleValidationErrors,
];

const validateUserLogin = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  handleValidationErrors,
];

// Product validation rules
const validateProduct = [
  body("sku").trim().notEmpty().withMessage("SKU is required"),
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("price")
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage("Valid price is required"),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  handleValidationErrors,
];

// Order validation rules
const validateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),
  body("items.*.productId")
    .isMongoId()
    .withMessage("Valid product ID is required"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),
  body("shippingAddress").optional().isObject(),
  handleValidationErrors,
];

const validateOrderStatus = [
  body("status")
    .isIn(["PLACED", "PICKED", "SHIPPED", "DELIVERED", "CANCELLED"])
    .withMessage("Invalid order status"),
  handleValidationErrors,
];

// ID validation
const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

const validateOrderId = [
  param("orderId").matches(/^ORD-/).withMessage("Invalid order ID format"),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateOrder,
  validateOrderStatus,
  validateMongoId,
  validateOrderId,
};
