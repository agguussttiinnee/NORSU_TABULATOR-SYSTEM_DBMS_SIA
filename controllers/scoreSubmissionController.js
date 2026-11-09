const Submission = require('../models/scoreSubmissionModel');
const AuditLog = require('../models/auditLogModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
    try {
        let data;

        if (req.user.role === 'admin') {
            data = await Submission.getAll();
        } else if (req.user.role === 'judge') {
            data = await Submission.getAllByJudge(req.user.id);
        } else {
            return error(res, 'You do not have permission to view submissions', 403);
        }

        return success(res, data, 'Submissions retrieved');
    } catch (err) {
        console.error('Get submissions error:', err);
        return error(res, 'Failed to retrieve submissions', 500);
    }
};

const getById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid submission ID', 400);
        }

        const submission = await Submission.getByIdWithAssignment(id);

        if (!submission) {
            return error(res, 'Submission not found', 404);
        }

        if (
            req.user.role !== 'admin' &&
            Number(submission.user_id) !== Number(req.user.id)
        ) {
            return error(res, 'You do not have permission to view this submission', 403);
        }

        return success(res, submission, 'Submission retrieved');
    } catch (err) {
        console.error('Get submission error:', err);
        return error(res, 'Failed to retrieve submission', 500);
    }
};

const create = async (req, res) => {
    try {
        const eventJudgeId = Number(req.body.event_judge_id);

        if (!Number.isInteger(eventJudgeId) || eventJudgeId <= 0) {
            return error(res, 'Valid event_judge_id is required', 400);
        }

        if (req.user.role !== 'judge') {
            return error(res, 'Only judges can create their submissions', 403);
        }

        const id = await Submission.create(eventJudgeId, req.user.id);

        if (!id) {
            return error(res, 'You are not assigned to this event', 403);
        }

        await AuditLog.log(req.user.id, 'create', 'score_submissions', id, null, 'draft');
        return success(res, { id }, 'Submission created', 201);
    } catch (err) {
        console.error('Create submission error:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return error(res, 'This judge already has a submission for this event', 409);
        }

        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'Event judge does not exist', 400);
        }

        return error(res, 'Failed to create submission', 500);
    }
};

const submit = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid submission ID', 400);
        }

        if (req.user.role !== 'judge') {
            return error(res, 'Only judges can submit their scores', 403);
        }

        await Submission.submit(id, req.user.id);

        const updated = await Submission.getById(id);
        await AuditLog.log(req.user.id, 'lock', 'score_submissions', id, 'draft', 'locked');

        return success(res, updated, 'Submission submitted and locked');
    } catch (err) {
        console.error('Submit scores error:', err);

        if (err.code === 'SUBMISSION_NOT_FOUND') {
            return error(res, 'Submission not found', 404);
        }

        if (err.code === 'NOT_OWNER') {
            return error(res, 'You do not own this submission', 403);
        }

        if (err.code === 'ALREADY_SUBMITTED') {
            return error(res, 'Submission is already locked or submitted', 409);
        }

        if (['NO_CRITERIA', 'NO_PARTICIPANTS', 'WEIGHTS_NOT_COMPLETE', 'SCORES_INCOMPLETE'].includes(err.code)) {
            return error(res, err.message, 400);
        }

        return error(res, 'Failed to submit scores', 500);
    }
};

const remove = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid submission ID', 400);
        }

        const submission = await Submission.getById(id);
        if (!submission) return error(res, 'Submission not found', 404);

        await Submission.remove(id);
        await AuditLog.log(req.user.id, 'delete', 'score_submissions', id, submission.status, null);

        return success(res, null, 'Submission deleted');
    } catch (err) {
        console.error('Delete submission error:', err);

        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return error(res, 'Submission cannot be deleted because it is in use', 409);
        }

        return error(res, err.message || 'Failed to delete submission', 500);
    }
};

const judgeSubmissionReport = async (req, res) => {
    try {
        const data = await Submission.getJudgeSubmissionReport();
        return success(res, data, 'Judge submission report retrieved');
    } catch (err) {
        console.error('Judge submission report error:', err);
        return error(res, 'Failed to retrieve report', 500);
    }
};

module.exports = { getAll, getById, create, submit, remove, judgeSubmissionReport };
