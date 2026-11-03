const router = require('express').Router();
const controller = require('../controllers/scoreSubmissionController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, controller.getAll);
router.get('/report/judges-vs-submissions', verifyToken, requireRole('admin'), controller.judgeSubmissionReport);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, controller.create);
router.patch('/:id/submit', verifyToken, controller.submit);
router.delete('/:id', verifyToken, requireRole('admin'), controller.remove);

module.exports = router;

