const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { success, error } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    return success(res, await User.findAll());
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, user);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { role_id, full_name, email, password } = req.body;
    if (!role_id || !full_name || !email || !password) {
      return error(res, 'role_id, full_name, email and password are required', 400);
    }
    if (password.length < 8) return error(res, 'Password must be at least 8 characters', 400);
    if (!(await User.roleExists(role_id))) return error(res, 'Invalid role_id', 400);

    const password_hash = await bcrypt.hash(password, 10);
    const id = await User.create({ role_id, full_name, email, password_hash });
    return success(res, await User.findById(id), 'User created', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return error(res, 'Email is already in use', 409);
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { role_id, full_name, email, password } = req.body;
    const fields = {};
    if (role_id !== undefined) {
      if (!(await User.roleExists(role_id))) return error(res, 'Invalid role_id', 400);
      fields.role_id = role_id;
    }
    if (full_name !== undefined) fields.full_name = full_name;
    if (email !== undefined) fields.email = email;
    if (password !== undefined) {
      if (password.length < 8) return error(res, 'Password must be at least 8 characters', 400);
      fields.password_hash = await bcrypt.hash(password, 10);
    }
    if (!Object.keys(fields).length) return error(res, 'Nothing to update', 400);

    const affected = await User.update(req.params.id, fields);
    if (!affected) return error(res, 'User not found', 404);
    return success(res, await User.findById(req.params.id), 'User updated');
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return error(res, 'Email is already in use', 409);
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return error(res, 'You cannot delete your own account', 400);
    }
    const affected = await User.softDelete(req.params.id);
    if (!affected) return error(res, 'User not found', 404);
    return success(res, null, 'User deleted');
  } catch (e) { next(e); }
};

exports.roles = async (req, res, next) => {
  try {
    return success(res, await User.findAllRoles());
  } catch (e) { next(e); }
};
