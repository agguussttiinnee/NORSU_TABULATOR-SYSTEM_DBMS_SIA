const router = require('express').Router();
const controller = require('../controllers/collegeController');
const { verifyToken, requireRole } = require('../middleware/auth');

// The report route must come before '/:id'
router.get('/report/no-participants', verifyToken, controller.noParticipants);

router.get('/', verifyToken, controller.getAll);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, requireRole('admin'), controller.create);
router.put('/:id', verifyToken, requireRole('admin'), controller.update);
router.delete('/:id', verifyToken, requireRole('admin'), controller.remove);

module.exports = router;