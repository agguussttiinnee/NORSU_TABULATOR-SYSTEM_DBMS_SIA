
const router = require('express').Router();

const controller = require('../controllers/scoreSubmissionController');
const { verifyToken, requireRole } = require('../middleware/auth');

<<<<<<< HEAD
router.get('/', verifyToken, controller.getAll);
router.get('/report/judges-vs-submissions', verifyToken, requireRole('admin'), controller.judgeSubmissionReport);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, controller.create);
router.patch('/:id/submit', verifyToken, controller.submit);
router.delete('/:id', verifyToken, requireRole('admin'), controller.remove);
=======
router.use(verifyToken);

// Retrieve submissions
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

// Only judges can create their own submissions
router.post(
    '/',
    requireRole('judge'),
    controller.create
);

// Only judges can submit and lock their scores
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
>>>>>>> origin/main

module.exports = router;
