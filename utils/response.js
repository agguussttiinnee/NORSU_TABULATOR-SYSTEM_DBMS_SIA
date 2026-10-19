// Shared response format. Every controller must respond through these helpers.
//
// Success: { "success": true,  "message": "...", "data": ... }
// Error:   { "success": false, "message": "..." }

const success = (res, data = null, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

const error = (res, message = 'Something went wrong', status = 500) =>
  res.status(status).json({ success: false, message });

module.exports = { success, error };
