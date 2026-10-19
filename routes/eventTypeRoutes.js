const router = require('express').Router();
const controller = require('../controllers/eventTypeController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, controller.getAll);

module.exports = router;