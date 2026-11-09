const Submission = require('../models/scoreSubmissionModel');
const AuditLog = require('../models/auditLogModel');
const { success, error } = require('../utils/response');
 
const parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};
 
// Get all submissions (admins see all, judges see their own)
const getAll = async (req, res) => {
    try {
        let data;
 
        if (req.user.role === 'admin') {
            data = await Submission.getAll();
        } else if (req.user.role === 'judge') {
            data = await Submission.getAllByJudge(req.user.id);
        } else {
            return error(res, 'You do not have permission', 403);
        }
 
        return success(res, data, 'Submissions retrieved');
    } catch (err) {
        console.error('Get submissions error:', err);
        return error(res, 'Failed to retrieve submissions', 500);
    }
};
 
// Get one submission (admin or the judge who owns it)
const getById = async (req, res) => {
    try {
        const id = parseId(req.params.id);
 
        if (!id) {
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
            return error(res, 'You do not have permission', 403);
        }
 
        return success(res, submission, 'Submission retrieved');
    } catch (err) {
        console.error('Get submission error:', err);
        return error(res, 'Failed to retrieve submission', 500);
    }
};
 
// Judge opens a submission for one of their event assignments
const create = async (req, res) => {
    try {
        const eventJudgeId = parseId(req.body.event_judge_id);
 
        if (!eventJudgeId) {
            return error(res, 'Valid event_judge_id is required', 400);
        }
 
        const id = await Submission.create(eventJudgeId, req.user.id);
 
        if (!id) {
            return error(
                res,
                'You can only create a submission for your own assignment',
                403
            );
        }
 
        await AuditLog.log(
            req.user.id,
            'create',
            'score_submissions',
            id,
            null,
            JSON.stringify({ event_judge_id: eventJudgeId })
        );
 
        return success(res, { id }, 'Submission created', 201);
    } catch (err) {
        console.error('Create submission error:', err);
 
        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'A submission already exists for this assignment',
                409
            );
        }
 
        return error(res, 'Failed to create submission', 500);
    }
};
 
// Judge submits and locks their scores
const submit = async (req, res) => {
    try {
        const id = parseId(req.params.id);
 
        if (!id) {
            return error(res, 'Invalid submission ID', 400);
        }
 
        await Submission.submit(id, req.user.id);
 
        await AuditLog.log(
            req.user.id,
            'submit',
            'score_submissions',
            id,
            'draft',
            'locked'
        );
 
        return success(res, { id, status: 'locked' }, 'Scores submitted and locked');
    } catch (err) {
        console.error('Submit error:', err);
 
        switch (err.code) {
            case 'SUBMISSION_NOT_FOUND':
                return error(res, err.message, 404);
            case 'NOT_OWNER':
                return error(res, err.message, 403);
            case 'NO_CRITERIA':
            case 'NO_PARTICIPANTS':
            case 'WEIGHTS_NOT_COMPLETE':
            case 'SCORES_INCOMPLETE':
                return error(res, err.message, 400);
            case 'ALREADY_SUBMITTED':
                return error(res, err.message, 409);
            default:
                return error(res, 'Failed to submit scores', 500);
        }
    }
};
 
// Admin deletes a draft submission
const remove = async (req, res) => {
    try {
        const id = parseId(req.params.id);
 
        if (!id) {
            return error(res, 'Invalid submission ID', 400);
        }
 
        const deleted = await Submission.remove(id);
 
        if (!deleted) {
            return error(
                res,
                'Submission not found or is no longer a draft',
                404
            );
        }
 
        await AuditLog.log(
            req.user.id,
            'delete',
            'score_submissions',
            id,
            'draft',
            null
        );
 
        return success(res, { id }, 'Submission deleted');
    } catch (err) {
        console.error('Delete submission error:', err);
        return error(res, 'Failed to delete submission', 500);
    }
};
 
// Admin report: judges vs. submissions (FULL OUTER JOIN)
const judgeSubmissionReport = async (req, res) => {
    try {
        const data = await Submission.getJudgeSubmissionReport();
        return success(res, data, 'Judge submission report retrieved');
    } catch (err) {
        console.error('Judge submission report error:', err);
        return error(res, 'Failed to retrieve report', 500);
    }
};
 
module.exports = {
    getAll,
    getById,
    create,
    submit,
    remove,
    judgeSubmissionReport
};
 