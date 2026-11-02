
const router = require('express').Router();

const controller = require('../controllers/scoreSubmissionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);

router.post(
    '/',
    requireRole('judge'),
    controller.create
);

router.patch(
    '/:id/submit',
    requireRole('judge'),
    controller.submit
);

router.delete(
    '/:id',
    requireRole('admin'),
    controller.remove
);

module.exports = router;