/**
 * JWT Auth Middleware — PM Internship Scheme
 * middleware/authMiddleware.js
 */

const jwt = require('jsonwebtoken');
const Candidate = require('../models/Candidate');

/**
 * Protect routes — verify JWT token
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach candidate to request (without password)
    req.candidate = await Candidate.findById(decoded.id).select('-password');

    if (!req.candidate) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

/**
 * Generate JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, generateToken };
