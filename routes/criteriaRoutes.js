
const express = require('express');
const router = express.Router();

const criteria = require('../controllers/criteriaController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Admins and judges can view event criteria.
// The controller checks judge assignments.
router.get(
    '/event/:eventId',
    requireRole('admin', 'judge'),
    criteria.list
);

// Admin-only criteria management
router.use(requireRole('admin'));

router.get('/event/:eventId/total-weight', criteria.totalWeight);
router.get('/:id', criteria.get);
router.post('/', criteria.create);
router.put('/:id', criteria.update);
router.patch('/:id', criteria.update);
router.delete('/:id', criteria.remove);

module.exports = router;