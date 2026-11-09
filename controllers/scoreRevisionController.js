
const Revision = require('../models/scoreRevisionModel');
const Submission = require('../models/scoreSubmissionModel');
const AuditLog = require('../models/auditLogModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await Revision.getAll();
    return success(res, data, 'Revisions retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const revision = await Revision.getById(req.params.id);
    if (!revision) return error(res, 'Revision not found', 404);
    return success(res, revision, 'Revision retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Request a change to a locked submission
const create = async (req, res) => {
  try {
    const { score_submission_id, reason } = req.body;
    if (!score_submission_id) return error(res, 'score_submission_id is required', 400);
    if (!reason || !reason.trim()) return error(res, 'reason is required', 400);

    const submission = await Submission.getById(score_submission_id);
    if (!submission) return error(res, 'Submission not found', 404);
    if (submission.status !== 'locked') {
      return error(res, 'Only locked submissions need a revision', 409);
    }

    const id = await Revision.create(score_submission_id, req.user.id, reason.trim());
    await AuditLog.log(req.user.id, 'request', 'score_revisions', id, null, reason.trim());
    return success(res, { id }, 'Revision requested', 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

// Approve and reject share one function; the route limits them to admins
const decide = (status) => async (req, res) => {
  try {
    const revision = await Revision.getById(req.params.id);
    if (!revision) return error(res, 'Revision not found', 404);

    const changed = await Revision.updateStatus(req.params.id, status, req.user.id);
    if (!changed) return error(res, 'Revision was already decided', 409);

    const updated = await Revision.getById(req.params.id);
    await AuditLog.log(req.user.id, status, 'score_revisions', req.params.id, revision.status, status);
    return success(res, updated, 'Revision ' + status);
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const approve = decide('approved');
const reject = decide('rejected');

// Only the person who asked can cancel
const cancel = async (req, res) => {
  try {
    const revision = await Revision.getById(req.params.id);
    if (!revision) return error(res, 'Revision not found', 404);
    if (revision.requested_by !== req.user.id) {
      return error(res, 'You can only cancel your own request', 403);
    }

    const changed = await Revision.updateStatus(req.params.id, 'cancelled', null);
    if (!changed) return error(res, 'Revision was already decided', 409);

    const updated = await Revision.getById(req.params.id);
    await AuditLog.log(req.user.id, 'cancel', 'score_revisions', req.params.id, revision.status, 'cancelled');
    return success(res, updated, 'Revision cancelled');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, getById, create, approve, reject, cancel };


const Revision = require('../models/scoreRevisionModel');
const { success, error } = require('../utils/response');

// Get all revision requests
const getAll = async (req, res) => {
    try {
        let data;

        if (req.user.role === 'admin') {
            data = await Revision.getAll();
        } else if (req.user.role === 'judge') {
            data = await Revision.getAllByJudge(req.user.id);
        } else {
            return error(res, 'You do not have permission', 403);
        }

        return success(res, data, 'Revision requests retrieved');
    } catch (err) {
        console.error('Get revisions error:', err);
        return error(res, 'Failed to retrieve revision requests', 500);
    }
};

// Get one revision request
const getById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid revision ID', 400);
        }

        const revision = await Revision.getById(id);

        if (!revision) {
            return error(res, 'Revision request not found', 404);
        }

        if (
            req.user.role !== 'admin' &&
            Number(revision.requested_by) !== Number(req.user.id)
        ) {
            return error(res, 'You do not have permission', 403);
        }

        return success(res, revision, 'Revision request retrieved');
    } catch (err) {
        console.error('Get revision error:', err);
        return error(res, 'Failed to retrieve revision request', 500);
    }
};

// Judge requests permission to revise a locked submission
const create = async (req, res) => {
    try {
        if (req.user.role !== 'judge') {
            return error(res, 'Only judges can request revisions', 403);
        }

        const submissionId = Number(req.body.score_submission_id);
        const reason = req.body.reason;

        if (!Number.isInteger(submissionId) || submissionId <= 0) {
            return error(res, 'Valid score_submission_id is required', 400);
        }

        if (typeof reason !== 'string' || !reason.trim()) {
            return error(res, 'A revision reason is required', 400);
        }

        const id = await Revision.create(
            submissionId,
            req.user.id,
            reason.trim()
        );

        if (!id) {
            return error(
                res,
                'You can only request revisions for your own locked submission',
                403
            );
        }

        return success(
            res,
            { id },
            'Revision request submitted for admin approval',
            201
        );
    } catch (err) {
        console.error('Create revision error:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'A duplicate revision request was detected',
                409
            );
        }

        return error(res, 'Failed to create revision request', 500);
    }
};

// Admin approves or rejects a revision request
const decide = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return error(
                res,
                'Only admins can decide revision requests',
                403
            );
        }

        const id = Number(req.params.id);
        const decision = req.body.decision;

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid revision ID', 400);
        }

        if (!['approved', 'rejected'].includes(decision)) {
            return error(
                res,
                'Decision must be approved or rejected',
                400
            );
        }

        await Revision.decide(id, req.user.id, decision);

        return success(
            res,
            { id, status: decision },
            `Revision request ${decision}`
        );
    } catch (err) {
        console.error('Decide revision error:', err);

        if (err.code === 'REVISION_NOT_FOUND') {
            return error(res, 'Revision request not found', 404);
        }

        if (err.code === 'REVISION_ALREADY_PROCESSED') {
            return error(res, 'Revision request already processed', 409);
        }

        if (err.code === 'SUBMISSION_NOT_LOCKED' ||
            err.code === 'REOPEN_FAILED') {
            return error(res, err.message, 409);
        }

        return error(res, 'Failed to process revision request', 500);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    decide
};

