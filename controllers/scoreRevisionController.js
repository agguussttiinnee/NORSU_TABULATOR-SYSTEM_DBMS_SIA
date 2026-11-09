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
