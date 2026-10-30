const express = require('express');
const router = express.Router();

const events = require('../controllers/eventController');
const registrations = require('../controllers/eventParticipantController');
const { verifyToken, requireRole } = require('../middleware/auth');

// This initial version restricts all these routes to admins.
router.use(verifyToken, requireRole('admin'));

router.get('/', events.list);
router.post('/', events.create);

router.get('/:id/participants', registrations.listForEvent);
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