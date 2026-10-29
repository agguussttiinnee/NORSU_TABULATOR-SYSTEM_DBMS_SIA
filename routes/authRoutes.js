const express = require('express');
const router = express.Router();
const auth = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/login', auth.login);
router.get('/me', verifyToken, auth.me);

module.exports = router;
