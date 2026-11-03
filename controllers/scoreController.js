const scores = require('../models/scoreModel');
const criteria = require('../models/criteriaModel');
const { success, error } = require('../utils/response');

exports.list = async (req, res) => {
    try {
        const criterionId = Number(req.params.criterionId);
        const judgeId = req.user.id;

        if (!Number.isInteger(criterionId) || criterionId <= 0) {
            return error(res, 'Invalid criterion ID', 400);
        }

        const criterion = await criteria.findById(criterionId);

        if (!criterion) {
            return error(res, 'Criterion not found', 404);
        }

        const rows = await scores.findAllByJudgeAndCriterion(
            judgeId,
            criterionId
        );

        return success(res, rows, 'Scores retrieved successfully');
    } catch (err) {
        console.error('List scores error:', err);
        return error(res, 'Failed to retrieve scores');
    }
};

exports.get = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const judgeId = req.user.id;

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid score ID', 400);
        }

        const row = await scores.findById(id);

        if (!row || Number(row.judge_id) !== Number(judgeId)) {
            return error(res, 'Score not found', 404);
        }

        return success(res, row, 'Score retrieved successfully');
    } catch (err) {
        console.error('Get score error:', err);
        return error(res, 'Failed to retrieve score');
    }
};

exports.create = async (req, res) => {
    try {
        const judgeId = req.user.id;
        const participant_id = Number(req.body.participant_id);
        const criterion_id = Number(req.body.criterion_id);
        const rawScore = req.body.score;

        if (
            rawScore === undefined ||
            rawScore === null ||
            rawScore === '' ||
            typeof rawScore === 'boolean'
        ) {
            return error(res, 'Score is required', 400);
        }

        const score = Number(rawScore);

        if (!Number.isInteger(participant_id) || participant_id <= 0) {
            return error(res, 'Invalid participant ID', 400);
        }

        if (!Number.isInteger(criterion_id) || criterion_id <= 0) {
            return error(res, 'Invalid criterion ID', 400);
        }

        if (!Number.isFinite(score)) {
            return error(res, 'Score must be a valid number', 400);
        }

        if (score < 0) {
            return error(res, 'Score must be zero or greater', 400);
        }

        const criterion = await criteria.findById(criterion_id);

        if (!criterion) {
            return error(res, 'Criterion not found', 404);
        }

        const isRegistered = await scores.isParticipantRegisteredForEvent(
            participant_id,
            criterion.event_id
        );

        if (!isRegistered) {
            return error(res, 'Participant is not registered for this event', 400);
        }

        if (score > Number(criterion.max_score)) {
            return error(res, 'Score cannot exceed the criterion maximum score', 400);
        }

        const id = await scores.createWithLock({
            judge_id: judgeId,
            participant_id,
            criterion_id,
            score,
            event_id: criterion.event_id
        });

        return success(res, { id }, 'Score created successfully', 201);
    } catch (err) {
        console.error('Create score error:', err);

        if (err.code === 'NOT_ASSIGNED') {
            return error(res, 'You are not assigned to this event', 403);
        }

        if (err.code === 'SCORE_LOCKED') {
            return error(res, 'Your scores for this event are already locked', 403);
        }

        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'You have already scored this participant for this criterion', 409);
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'Invalid participant or criterion', 400);
        }

        return error(res, 'Failed to create score', 500);
    }
};

exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const judgeId = req.user.id;
        const rawScore = req.body.score;

        if (
            rawScore === undefined ||
            rawScore === null ||
            rawScore === '' ||
            typeof rawScore === 'boolean'
        ) {
            return error(res, 'Score is required', 400);
        }

        const score = Number(rawScore);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid score ID', 400);
        }

        if (!Number.isFinite(score)) {
            return error(res, 'Score must be a valid number', 400);
        }

        if (score < 0) {
            return error(res, 'Score must be zero or greater', 400);
        }

        const existing = await scores.findById(id);

        if (!existing || Number(existing.judge_id) !== Number(judgeId)) {
            return error(res, 'Score not found', 404);
        }

        const criterion = await criteria.findById(existing.criterion_id);

        if (!criterion) {
            return error(res, 'Criterion not found', 404);
        }

        const isRegistered = await scores.isParticipantRegisteredForEvent(
            existing.participant_id,
            criterion.event_id
        );

        if (!isRegistered) {
            return error(res, 'Participant is not registered for this event', 400);
        }

        if (score > Number(criterion.max_score)) {
            return error(res, 'Score cannot exceed the criterion maximum score', 400);
        }

        const affectedRows = await scores.updateWithLock({
            id,
            judge_id: judgeId,
            event_id: criterion.event_id,
            score
        });

        if (!affectedRows) {
            return error(res, 'No changes were made', 400);
        }

        return success(res, null, 'Score updated successfully');
    } catch (err) {
        console.error('Update score error:', err);

        if (err.code === 'NOT_ASSIGNED') {
            return error(res, 'You are not assigned to this event', 403);
        }

        if (err.code === 'SCORE_LOCKED') {
            return error(res, 'Your scores for this event are already locked', 403);
        }

        if (err.code === 'SCORE_NOT_FOUND') {
            return error(res, 'Score not found', 404);
        }

        return error(res, 'Failed to update score', 500);
    }
};

exports.getEventRankings = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return error(res, 'Invalid event ID', 400);
        }

        const rankings = await scores.getEventRankings(eventId);

        return success(
            res,
            rankings,
            'Event rankings retrieved successfully'
        );

    } catch (err) {
        console.error('Get event rankings error:', err);

        const statusCodes = {
            EVENT_NOT_FOUND: 404,
            NO_CRITERIA: 400,
            WEIGHTS_NOT_COMPLETE: 400,
            INVALID_MAX_SCORE: 400,
            NO_PARTICIPANTS: 400,
            NO_JUDGES: 400,
            JUDGES_NOT_FINISHED: 409,
            SCORES_INCOMPLETE: 409
        };

        return error(
            res,
            err.message || 'Failed to retrieve event rankings',
            statusCodes[err.code] || 500
        );
    }
};

// Get missing scores report for an event
exports.getMissingScores = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return error(res, 'Invalid event ID', 400);
        }

        const missingScores = await scores.findMissingScoresByEvent(eventId);

        return success(
            res,
            missingScores,
            'Missing scores report retrieved successfully'
        );

    } catch (err) {
        console.error('Get missing scores error:', err);
        return error(
            res,
            'Failed to retrieve missing scores report',
            500
        );
    }
};