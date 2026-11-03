const Submission = require('../models/scoreSubmissionModel');
const AuditLog = require('../models/auditLogModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await Submission.getAll();
    return success(res, data, 'Submissions retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const submission = await Submission.getById(req.params.id);
    if (!submission) return error(res, 'Submission not found', 404);
    return success(res, submission, 'Submission retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const { event_judge_id } = req.body;
    if (!event_judge_id) return error(res, 'event_judge_id is required', 400);
    const id = await Submission.create(event_judge_id);
    await AuditLog.log(req.user.id,'create','score_submissions',id,null,'draft');
    return success(res, { id }, 'Submission created', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return error(res, 'This judge already has a submission for this event', 409);
    }
    if (e.code === 'ER_NO_REFERENCED_ROW_2') {
      return error(res, 'Event judge does not exist', 400);
    }
    return error(res, e.message, 500);
  }
};

// Submit = lock the judge's scores
const submit = async (req, res) => {
  try {
    const submission = await Submission.getById(req.params.id);
    if (!submission) return error(res, 'Submission not found', 404);
    if (submission.status === 'locked') {
      return error(res, 'Submission is already locked', 409);
    }
    await Submission.submit(req.params.id);
    const updated = await Submission.getById(req.params.id);
    await AuditLog.log(req.user.id, 'lock', 'score_submissions', req.params.id, submission.status, 'locked');
    return success(res, updated, 'Submission submitted and locked');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    const submission = await Submission.getById(req.params.id);
    if (!submission) return error(res, 'Submission not found', 404);
    if (submission.status !== 'draft') {
      return error(res, 'Submitted or locked submissions cannot be deleted', 403);
    }
    await Submission.remove(req.params.id);
    
    return success(res, null, 'Submission deleted');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const judgeSubmissionReport = async (req, res) => {
  try {
    const data = await Submission.getJudgeSubmissionReport();
    return success(res, data, 'Judge submission report retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, getById, create, submit, remove, judgeSubmissionReport};

