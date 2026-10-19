const db = require('../config/db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM event_types ORDER BY name');
  return rows;
};

module.exports = { getAll };