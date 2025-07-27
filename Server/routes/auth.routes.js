const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { validateUserRegistration, validateUserLogin } = require('../middlewares/validation.middleware');
const { asyncHandler } = require('../middlewares/error.middleware');
const { authLimiter } = require('../middlewares/rateLimit.middleware');

const router = express.Router();

// Register
router.post('/register', authLimiter, validateUserRegistration, asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;
  
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = new User({
    name,
    email,
    passwordHash,
    phone,
    address,
    role: role||'customer' // Default role for registration
  });

  await user.save();

  const token = jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
}));

// Login
router.post('/login', authLimiter, validateUserLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, isActive: true });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { _id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  });
}));

// Get current user
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

// Logout 
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  // In a real app, you might want to blacklist the token here
  res.json({ message: 'Logged out successfully' });
}));

module.exports = router;