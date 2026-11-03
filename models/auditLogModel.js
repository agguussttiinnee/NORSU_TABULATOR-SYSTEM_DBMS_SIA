const db = require('../config/db');

const log = async (userId, action, tableName, recordId, oldValue, newValue) => {
  await db.query(
    'INSERT INTO audit_logs (user_id, action, table_name, record_id, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, action, tableName, recordId, oldValue, newValue]
  );
};

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM audit_logs ORDER BY id DESC');
  return rows;
};

module.exports = { log, getAll };
