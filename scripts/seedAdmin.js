// Creates the first admin user. Run once: npm run seed:admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

(async () => {
  try {
    const name = process.env.ADMIN_NAME || 'System Admin';
    const email = process.env.ADMIN_EMAIL || 'admin@norsu.edu.ph';
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }
    const [roles] = await db.query("SELECT id FROM roles WHERE name = 'admin'");
    if (!roles.length) throw new Error('Run database/01_montessa_core.sql first (roles missing)');

    const hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (role_id, full_name, email, password_hash) VALUES (?, ?, ?, ?)',
      [roles[0].id, name, email, hash]
    );
    console.log('Admin created:', email);
    process.exit(0);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(1);
  }
})();
