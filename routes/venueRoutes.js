const router = require('express').Router();
const controller = require('../controllers/venueController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, controller.getAll);

module.exports = router;