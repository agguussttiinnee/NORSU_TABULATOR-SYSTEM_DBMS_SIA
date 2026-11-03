
const express = require('express');
const router = express.Router();

const events = require('../controllers/eventController');
const registrations = require('../controllers/eventParticipantController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Both admins and assigned judges can view event participants.
// The controller checks whether a judge is assigned to the event.
router.get(
    '/:id/participants',
    requireRole('admin', 'judge'),
    registrations.listForEvent
);

// Admin-only routes
router.use(requireRole('admin'));

// Static paths must be registered before '/:id'.
router.get('/lookups', events.lookups);
router.get('/participants', registrations.listParticipants);

router.get('/', events.list);
router.post('/', events.create);

router.post('/:id/participants', registrations.registerForEvent);

router.delete(
    '/:id/participants/:registrationId',
    registrations.removeRegistration
);

router.get('/:id', events.get);
router.put('/:id', events.update);
router.patch('/:id', events.update);
router.delete('/:id', events.remove);

module.exports = router;