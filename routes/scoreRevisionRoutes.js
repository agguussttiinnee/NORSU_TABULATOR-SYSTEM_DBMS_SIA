const router = require('express').Router();
const controller = require('../controllers/scoreRevisionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, controller.getAll);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, requireRole('judge'), controller.create);
router.patch(['/:id/decide', '/:id/decision'], verifyToken, requireRole('admin'), controller.decide);


module.exports = router;