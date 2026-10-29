const express = require('express');
const router = express.Router();
const users = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('admin'));

router.get('/roles', users.roles);   // must stay above '/:id'
router.get('/', users.list);
router.get('/:id', users.get);
router.post('/', users.create);
router.put('/:id', users.update);
router.patch('/:id', users.update);
router.delete('/:id', users.remove);

module.exports = router;
