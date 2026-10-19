// Shared database connection. Every Model must import THIS file.
// Usage in a model:
//   const db = require('../config/db');
//   const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
