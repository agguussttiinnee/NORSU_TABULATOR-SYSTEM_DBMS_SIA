// Main router. Each member adds ONE line for their own route file.
const express = require('express');
const router = express.Router();
const { success } = require('../utils/response');

router.get('/health', (req, res) => success(res, { status: 'running' }, 'API is up'));

// ---- Montessa: Core ----
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/event-judges', require('./eventJudgeRoutes'));

// ---- Bernadette: Master data ----
// router.use('/colleges', require('./collegeRoutes'));

// ---- Carl: Transactions ----
// router.use('/events', require('./eventRoutes'));
router.use('/events', require('./eventRoutes'));

// ---- Izy: Rules ----
// router.use('/scores', require('./scoreRoutes'));

// ---- Resty: Workflow + Audit ----
// router.use('/score-revisions', require('./scoreRevisionRoutes'));

// ---- Gretchen: Reports ----
router.use('/awards', require('./awardRoutes'));

module.exports = router;
