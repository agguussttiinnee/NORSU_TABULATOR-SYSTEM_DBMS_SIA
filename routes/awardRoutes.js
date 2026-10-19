const express = require('express');
const router = express.Router();
const award = require('../controllers/awardController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Reads: admin and judge. Writes: admin only.
// Fixed paths stay above '/:id'.
router.get('/leaderboard', requireRole('admin', 'judge'), award.leaderboard);
router.get('/categories', requireRole('admin', 'judge'), award.listCategories);
router.post('/categories', requireRole('admin'), award.createCategory);

router.get('/', requireRole('admin', 'judge'), award.list);
router.get('/:id', requireRole('admin', 'judge'), award.get);
router.post('/', requireRole('admin'), award.create);
router.patch('/:id', requireRole('admin'), award.update);
router.put('/:id', requireRole('admin'), award.update);
router.delete('/:id', requireRole('admin'), award.remove);

module.exports = router;
