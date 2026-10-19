const EventJudge = require('../models/eventJudgeModel');
const User = require('../models/userModel');
const { success, error } = require('../utils/response');

exports.list = async (req, res, next) => {
  try {
    return success(res, await EventJudge.findAll());
  } catch (e) { next(e); }
};

exports.assign = async (req, res, next) => {
  try {
    const { event_id, user_id } = req.body;
    if (!event_id || !user_id) return error(res, 'event_id and user_id are required', 400);

    const user = await User.findById(user_id);
    if (!user) return error(res, 'User not found', 404);
    if (user.role !== 'judge') return error(res, 'Only users with the judge role can be assigned', 400);

    const id = await EventJudge.assign(event_id, user_id);
    return success(res, { id, event_id, user_id }, 'Judge assigned to event', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return error(res, 'Judge is already assigned to this event', 409);
    if (e.code === 'ER_NO_REFERENCED_ROW_2') return error(res, 'Event does not exist', 400);
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const affected = await EventJudge.remove(req.params.id);
    if (!affected) return error(res, 'Assignment not found', 404);
    return success(res, null, 'Judge removed from event');
  } catch (e) { next(e); }
};

// GET /api/event-judges/report?event_id=1   (event_id is optional)
exports.report = async (req, res, next) => {
  try {
    const rows = await EventJudge.reportJudgesPerEvent(req.query.event_id || null);
    return success(res, rows, 'Judges per event');
  } catch (e) { next(e); }
};
