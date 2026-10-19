require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const routes = require('./routes');
const { error } = require('./utils/response');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);

// 404 handler
app.use((req, res) => error(res, 'Route not found', 404));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  error(res, err.message || 'Internal server error', 500);
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await db.query('SELECT 1');
    console.log('MySQL connected');
  } catch (e) {
    console.error('MySQL connection failed:', e.message);
  }
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();
