const AuditLog = require('../models/auditLogModel');
const { success, error } = require('../utils/response');

const getAll = async (req, res) => {
  try {
    const data = await AuditLog.getAll();
    return success(res, data, 'Audit logs retrieved');
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = { getAll };
