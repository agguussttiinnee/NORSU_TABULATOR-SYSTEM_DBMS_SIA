const db = require('../config/db');

function clean(value) {
  if (!value) return null;
  const copy = Object.assign({}, value);
  delete copy.password_hash;
  return JSON.stringify(copy);
}

exports.logAudit = async (userId, action, tableName, recordId, oldValue, newValue) => {
  try {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, tableName, recordId, clean(oldValue), clean(newValue)]
    );
  } catch (e) {
    // A failed audit write should not break the user action itself.
    console.error('Audit log failed:', e.message);
  }
};