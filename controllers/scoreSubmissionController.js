
const Submission = require('../models/scoreSubmissionModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
    try {
        let data;

        if (req.user.role === 'admin') {
            data = await Submission.getAll();
        } else if (req.user.role === 'judge') {
            data = await Submission.getAllByJudge(req.user.id);
        } else {
            return error(
                res,
                'You do not have permission to view submissions',
                403
            );
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
            return error(
                res,
                'You do not have permission to view this submission',
                403
            );
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
            return error(
                res,
                'Only judges can create their submissions',
                403
            );
        }

        const id = await Submission.create(
            eventJudgeId,
            req.user.id
        );

        if (!id) {
            return error(
                res,
                'You are not assigned to this event',
                403
            );
        }

        return success(res, { id }, 'Submission created', 201);
    } catch (err) {
        console.error('Create submission error:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'This judge already has a submission for this event',
                409
            );
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
            return error(
                res,
                'Only judges can submit their scores',
                403
            );
        }

        await Submission.submit(id, req.user.id);

        const updated = await Submission.getById(id);

        return success(
            res,
            updated,
            'Submission submitted and locked'
        );
    } catch (err) {
        console.error('Submit scores error:', err);

        if (err.code === 'SUBMISSION_NOT_FOUND') {
            return error(res, 'Submission not found', 404);
        }

        if (err.code === 'NOT_OWNER') {
            return error(
                res,
                'You do not own this submission',
                403
            );
        }

        if (err.code === 'ALREADY_SUBMITTED') {
            return error(
                res,
                'Submission is already locked or submitted',
                409
            );
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

        if (!submission) {
            return error(res, 'Submission not found', 404);
        }

        if (submission.status !== 'draft') {
            return error(
                res,
                'Submitted or locked submissions cannot be deleted',
                403
            );
        }

        const affectedRows = await Submission.remove(id);

        if (!affectedRows) {
            return error(
                res,
                'Submission could not be deleted',
                409
            );
        }

        return success(res, null, 'Submission deleted');
    } catch (err) {
        console.error('Delete submission error:', err);
        return error(res, 'Failed to delete submission', 500);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    submit,
    remove
};
