const express = require('express');
const router = express.Router();
const ej = require('../controllers/eventJudgeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Judge routes
router.get('/my', requireRole('judge'), ej.myAssignments);
router.get('/mine', requireRole('judge'), ej.mine);

// Admin-only routes
router.use(requireRole('admin'));

router.get('/report', ej.report);
router.get('/', ej.list);
router.post('/', ej.assign);
router.delete('/:id', ej.remove);

module.exports = router;