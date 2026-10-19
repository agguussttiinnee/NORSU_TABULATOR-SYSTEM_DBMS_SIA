const College = require('../models/collegeModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await College.getAll();
    return success(res, data, 'Colleges retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const college = await College.getById(req.params.id);
    if (!college) return error(res, 'College not found', 404);
    return success(res, college, 'College retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return error(res, 'Name and code are required', 400);
    const id = await College.create(name.trim(), code.trim());
    return success(res, { id }, 'College created', 201);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return error(res, 'College name or code already exists', 409);
    }
    return error(res, e.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return error(res, 'Name and code are required', 400);
    const affected = await College.update(req.params.id, name.trim(), code.trim());
    if (!affected) return error(res, 'College not found', 404);
    const updated = await College.getById(req.params.id);
      return success(res, updated, 'College updated');
      } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return error(res, 'College name or code already exists', 409);
    }
    return error(res, e.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    const affected = await College.softDelete(req.params.id);
    if (!affected) return error(res, 'College not found', 404);
    return success(res, null, 'College deleted');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

const noParticipants = async (req, res) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return error(res, 'eventId is required', 400);
    const data = await College.noParticipants(eventId);
    return success(res, data, 'Colleges with no participants retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll, getById, create, update, remove, noParticipants };