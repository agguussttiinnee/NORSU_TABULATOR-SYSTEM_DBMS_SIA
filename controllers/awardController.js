const Award = require('../models/awardModel');
const { success, error } = require('../utils/response');

const fkError = (e, res) => {
  if (e.code === 'ER_DUP_ENTRY') { error(res, 'That rank is already taken for this event and category', 409); return true; }
  if (e.code === 'ER_NO_REFERENCED_ROW_2') { error(res, 'Event, participant or award category does not exist', 400); return true; }
  return false;
};

// ----- categories -----
exports.listCategories = async (req, res, next) => {
  try { return success(res, await Award.findCategories(), 'Award categories'); }
  catch (e) { next(e); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return error(res, 'name is required', 400);
    const id = await Award.createCategory(name, description);
    return success(res, { id, name, description: description || null }, 'Category created', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return error(res, 'Category already exists', 409);
    next(e);
  }
};

// ----- awards -----
exports.list = async (req, res, next) => {
  try { return success(res, await Award.findAll(req.query.event_id || null)); }
  catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const award = await Award.findById(req.params.id);
    if (!award) return error(res, 'Award not found', 404);
    return success(res, award);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { event_id, participant_id, award_category_id, rank_no } = req.body;
    if (!event_id || !participant_id || !award_category_id || !rank_no) {
      return error(res, 'event_id, participant_id, award_category_id and rank_no are required', 400);
    }
    if (!Number.isInteger(Number(rank_no)) || Number(rank_no) < 1) {
      return error(res, 'rank_no must be a whole number of 1 or more', 400);
    }
    const id = await Award.create(req.body);
    return success(res, await Award.findById(id), 'Award created', 201);
  } catch (e) {
    if (fkError(e, res)) return;
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!(await Award.findById(req.params.id))) return error(res, 'Award not found', 404);
    const affected = await Award.update(req.params.id, req.body);
    if (!affected) return error(res, 'No valid fields to update', 400);
    return success(res, await Award.findById(req.params.id), 'Award updated');
  } catch (e) {
    if (fkError(e, res)) return;
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const affected = await Award.remove(req.params.id);
    if (!affected) return error(res, 'Award not found', 404);
    return success(res, null, 'Award deleted');
  } catch (e) { next(e); }
};

// GET /api/awards/leaderboard?event_id=1&category_id=1   (both optional)
exports.leaderboard = async (req, res, next) => {
  try {
    const rows = await Award.reportLeaderboard(req.query.event_id || null, req.query.category_id || null);
    return success(res, rows, 'Leaderboard');
  } catch (e) { next(e); }
};
