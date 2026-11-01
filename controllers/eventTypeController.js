const EventType = require('../models/eventTypeModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await EventType.getAll();
    return success(res, data, 'Event types retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll };