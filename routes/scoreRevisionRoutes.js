
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


const router = require('express').Router();

const controller = require('../controllers/scoreRevisionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Judges and admins can view revision requests
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Only judges can request revisions
router.post(
    '/',
    requireRole('judge'),
    controller.create
);

// Only admins can approve or reject revisions
router.patch(
    '/:id/decision',
    requireRole('admin'),
    controller.decide
);

module.exports = router;
>>>>>>> origin/main
