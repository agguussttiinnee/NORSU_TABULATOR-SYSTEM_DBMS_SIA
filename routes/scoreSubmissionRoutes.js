const router = require('express').Router();

const controller = require('../controllers/scoreSubmissionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Retrieve submissions
router.get('/', controller.getAll);

// Admin report
router.get(
    '/report/judges-vs-submissions',
    requireRole('admin'),
    controller.judgeSubmissionReport
);

// Retrieve one submission
router.get('/:id', controller.getById);

// Only judges can create submissions
router.post(
    '/',
    requireRole('judge'),
    controller.create
);

// Only judges can submit and lock scores
router.patch(
    '/:id/submit',
    requireRole('judge'),
    controller.submit
);

// Only admins can delete draft submissions
router.delete(
    '/:id',
    requireRole('admin'),
    controller.remove
);

module.exports = router;