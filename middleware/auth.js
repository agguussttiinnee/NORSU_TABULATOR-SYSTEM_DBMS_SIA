const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

// Requires header:  Authorization: Bearer <token>
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return error(res, 'Authentication required', 401);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, email }
    next();
  } catch (e) {
    return error(res, 'Invalid or expired token', 401);
  }
};

// Usage: requireRole('admin')  or  requireRole('admin', 'judge')
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return error(res, 'You do not have permission to do this', 403);
  }
  next();
};

module.exports = { verifyToken, requireRole };
