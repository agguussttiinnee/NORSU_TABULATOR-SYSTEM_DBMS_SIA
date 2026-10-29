const express = require('express');
const router = express.Router();
const ej = require('../controllers/eventJudgeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/report', ej.report);    // must stay above '/:id'
router.get('/', ej.list);
router.post('/', ej.assign);
router.delete('/:id', ej.remove);

module.exports = router;
