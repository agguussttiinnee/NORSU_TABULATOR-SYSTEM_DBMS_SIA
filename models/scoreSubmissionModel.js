const db = require('../config/db');

const getAll = async () => {
  const [rows] = await db.query(
    'SELECT * FROM score_submissions ORDER BY id'
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM score_submissions WHERE id = ?',
    [id]
  );
  return rows[0];
};

const create = async (eventJudgeId) => {
  const [result] = await db.query(
    'INSERT INTO score_submissions (event_judge_id) VALUES (?)',
    [eventJudgeId]
  );
  return result.insertId;
};

// Submitting locks the judge's scores in the same step
const submit = async (id) => {
  const [result] = await db.query(
    `UPDATE score_submissions
     SET status = 'locked', submitted_at = NOW(), locked_at = NOW()
     WHERE id = ? AND status = 'draft'`,
    [id]
  );
  return result.affectedRows;
};

// Only drafts can be deleted
const remove = async (id) => {
  const [result] = await db.query(
    "DELETE FROM score_submissions WHERE id = ? AND status = 'draft'",
    [id]
  );
  return result.affectedRows;
};

module.exports = { getAll, getById, create, submit, remove };
