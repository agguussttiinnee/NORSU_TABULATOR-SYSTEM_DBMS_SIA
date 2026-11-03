const express = require('express');
const router = express.Router();

const scoreController = require('../controllers/scoreController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Admin-only reports
router.get(
    '/rankings/:eventId',
    requireRole('admin'),
    scoreController.getEventRankings
);

router.get(
    '/missing/:eventId',
    requireRole('admin'),
    scoreController.getMissingScores
);

// Judge-only scoring routes
router.use(requireRole('judge'));

router.get('/criterion/:criterionId', scoreController.list);
router.get('/:id', scoreController.get);
router.post('/', scoreController.create);
router.put('/:id', scoreController.update);

module.exports = router;