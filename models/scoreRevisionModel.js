const db = require('../config/db');

const getAll = async () => {
  const [rows] = await db.query(
    'SELECT * FROM score_revisions ORDER BY id'
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM score_revisions WHERE id = ?',
    [id]
  );
  return rows[0];
};

const create = async (scoreSubmissionId, requestedBy, reason) => {
  const [result] = await db.query(
    'INSERT INTO score_revisions (score_submission_id, requested_by, reason) VALUES (?, ?, ?)',
    [scoreSubmissionId, requestedBy, reason]
  );
  return result.insertId;
};

// Only a pending request can be decided or cancelled
const updateStatus = async (id, status, decidedBy) => {
  const [result] = await db.query(
    "UPDATE score_revisions SET status = ?, decided_by = ? WHERE id = ? AND status = 'pending'",
    [status, decidedBy, id]
  );
  return result.affectedRows;
};

module.exports = {getAll, getByld, create, updateStatus};