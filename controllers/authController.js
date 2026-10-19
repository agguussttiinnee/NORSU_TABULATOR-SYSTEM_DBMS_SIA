const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { success, error } = require('../utils/response');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required', 400);

    const user = await User.findByEmail(email);
    if (!user || !user.is_active) return error(res, 'Invalid email or password', 401);

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return error(res, 'Invalid email or password', 401);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return success(
      res,
      { token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } },
      'Login successful'
    );
  } catch (e) {
    next(e);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (e) {
    next(e);
  }
};
