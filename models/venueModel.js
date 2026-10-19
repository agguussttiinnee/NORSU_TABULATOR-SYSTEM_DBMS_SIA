const db = require('../config/db');

const getAll = async () => {
  const [rows] = await db.query('SELECT * FROM venues ORDER BY name');
  return rows;
};

module.exports = { getAll };