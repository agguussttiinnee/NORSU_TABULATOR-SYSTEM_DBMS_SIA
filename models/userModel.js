const db = require('../config/db');

const BASE = `
  SELECT u.id, u.role_id, r.name AS role, u.full_name, u.email,
         u.is_active, u.created_at, u.updated_at
  FROM users u
  INNER JOIN roles r ON r.id = u.role_id`;

exports.findAll = async () => {
  const [rows] = await db.query(`${BASE} WHERE u.is_active = 1 ORDER BY u.id`);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(`${BASE} WHERE u.id = ? AND u.is_active = 1`, [id]);
  return rows[0] || null;
};

// Includes password_hash. Used by login only.
exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    `SELECT u.*, r.name AS role
     FROM users u INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
};

exports.roleExists = async (roleId) => {
  const [rows] = await db.query('SELECT id FROM roles WHERE id = ?', [roleId]);
  return rows.length > 0;
};

exports.create = async ({ role_id, full_name, email, password_hash }) => {
  const [result] = await db.query(
    'INSERT INTO users (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
    [role_id, full_name, email, password_hash]
  );
  return result.insertId;
};

exports.update = async (id, fields) => {
  const allowed = ['role_id', 'full_name', 'email', 'password_hash'];
  const keys = Object.keys(fields).filter((k) => allowed.includes(k));
  if (!keys.length) return 0;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  const [result] = await db.query(
    `UPDATE users SET ${sets} WHERE id = ? AND is_active = 1`,
    [...values, id]
  );
  return result.affectedRows;
};

// Soft delete
exports.softDelete = async (id) => {
  const [result] = await db.query(
    'UPDATE users SET is_active = 0 WHERE id = ? AND is_active = 1',
    [id]
  );
  return result.affectedRows;
};

exports.findAllRoles = async () => {
  const [rows] = await db.query('SELECT id, name FROM roles ORDER BY id');
  return rows;
};
