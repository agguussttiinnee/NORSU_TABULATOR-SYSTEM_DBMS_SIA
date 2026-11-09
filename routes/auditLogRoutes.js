const router = require('express').Router();
const controller = require('../controllers/auditLogController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('admin'), controller.getAll);

module.exports = router;
