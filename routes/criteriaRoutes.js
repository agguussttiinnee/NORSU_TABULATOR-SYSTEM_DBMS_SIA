
const express = require('express');
const router = express.Router();

const criteria = require('../controllers/criteriaController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Only administrators can manage event criteria.
router.use(verifyToken, requireRole('admin'));

// Get all criteria for an event.
router.get('/event/:eventId', criteria.list);

// Get the total weight of criteria for an event.
router.get('/event/:eventId/total-weight', criteria.totalWeight);

// Get one criterion.
router.get('/:id', criteria.get);

// Create a criterion.
router.post('/', criteria.create);

// Update a criterion.
router.put('/:id', criteria.update);
router.patch('/:id', criteria.update);

module.exports = router;