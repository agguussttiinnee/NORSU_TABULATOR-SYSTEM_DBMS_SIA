const router = require('express').Router();
const controller = require('../controllers/scoreRevisionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, controller.getAll);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, requireRole('admin', 'judge'), controller.create);
router.patch('/:id/approve', verifyToken, requireRole('admin'), controller.approve);
router.patch('/:id/reject', verifyToken, requireRole('admin'), controller.reject);
router.patch('/:id/cancel', verifyToken, controller.cancel);

module.exports = router;
