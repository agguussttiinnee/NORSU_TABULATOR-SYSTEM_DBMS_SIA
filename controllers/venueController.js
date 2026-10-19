const Venue = require('../models/venueModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await Venue.getAll();
    return success(res, data, 'Venues retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll };