const router = require('express').Router();

const controller = require('../controllers/scoreRevisionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// View revision requests
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