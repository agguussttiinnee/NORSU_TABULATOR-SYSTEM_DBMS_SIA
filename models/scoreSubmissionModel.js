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

// FULL OUTER JOIN (MySQL has none): LEFT JOIN UNION RIGHT JOIN
const getJudgeSubmissionReport = async () => {
  const [rows] = await db.query(
    `SELECT ej.id AS event_judge_id, u.full_name AS judge_name, e.event_name,
            ss.id AS submission_id, ss.status AS submission_status, ss.submitted_at
     FROM event_judges ej
     LEFT JOIN score_submissions ss ON ss.event_judge_id = ej.id
     LEFT JOIN users u ON u.id = ej.user_id
     LEFT JOIN events e ON e.id = ej.event_id
     UNION
     SELECT ej.id AS event_judge_id, u.full_name AS judge_name, e.event_name,
            ss.id AS submission_id, ss.status AS submission_status, ss.submitted_at
     FROM event_judges ej
     RIGHT JOIN score_submissions ss ON ss.event_judge_id = ej.id
     LEFT JOIN users u ON u.id = ej.user_id
     LEFT JOIN events e ON e.id = ej.event_id`
  );
  return rows;
};

module.exports = { getAll, getById, create, submit, remove, getJudgeSubmissionReport };
