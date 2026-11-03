<<<<<<< HEAD
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

module.exports = {getAll, getById, create, updateStatus};
=======

const db = require('../config/db');

// Create a revision request
const create = async (submissionId, requestedBy, reason) => {
    const [result] = await db.query(
        `INSERT INTO score_revisions
            (score_submission_id, requested_by, reason)
         SELECT ss.id, ej.user_id, ?
         FROM score_submissions ss
         JOIN event_judges ej
             ON ej.id = ss.event_judge_id
         WHERE ss.id = ?
           AND ej.user_id = ?
           AND ss.status = 'locked'`,
        [reason, submissionId, requestedBy]
    );

    return result.affectedRows ? result.insertId : null;
};

// Retrieve all revision requests
const getAll = async () => {
    const [rows] = await db.query(
        `SELECT sr.*,
                ss.event_judge_id,
                ej.event_id,
                ej.user_id AS judge_id
         FROM score_revisions sr
         JOIN score_submissions ss
             ON ss.id = sr.score_submission_id
         JOIN event_judges ej
             ON ej.id = ss.event_judge_id
         ORDER BY sr.created_at DESC`
    );

    return rows;
};

// Retrieve revision requests made by a judge
const getAllByJudge = async (judgeId) => {
    const [rows] = await db.query(
        `SELECT sr.*,
                ss.event_judge_id,
                ej.event_id
         FROM score_revisions sr
         JOIN score_submissions ss
             ON ss.id = sr.score_submission_id
         JOIN event_judges ej
             ON ej.id = ss.event_judge_id
         WHERE sr.requested_by = ?
         ORDER BY sr.created_at DESC`,
        [judgeId]
    );

    return rows;
};

// Retrieve one revision request
const getById = async (id) => {
    const [rows] = await db.query(
        `SELECT sr.*,
                ss.event_judge_id,
                ss.status AS submission_status,
                ej.event_id,
                ej.user_id AS judge_id
         FROM score_revisions sr
         JOIN score_submissions ss
             ON ss.id = sr.score_submission_id
         JOIN event_judges ej
             ON ej.id = ss.event_judge_id
         WHERE sr.id = ?`,
        [id]
    );

    return rows[0] || null;
};

// Approve or reject a revision request
const decide = async (id, adminId, decision) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [requests] = await connection.query(
            `SELECT sr.id,
                    sr.score_submission_id,
                    sr.status,
                    ss.event_judge_id,
                    ss.status AS submission_status
             FROM score_revisions sr
             JOIN score_submissions ss
                 ON ss.id = sr.score_submission_id
             WHERE sr.id = ?
             FOR UPDATE`,
            [id]
        );

        if (requests.length === 0) {
            const err = new Error('Revision request not found');
            err.code = 'REVISION_NOT_FOUND';
            throw err;
        }

        const request = requests[0];

        if (request.status !== 'pending') {
            const err = new Error(
                'This revision request has already been processed'
            );
            err.code = 'REVISION_ALREADY_PROCESSED';
            throw err;
        }

        if (decision === 'approved') {
            if (request.submission_status !== 'locked') {
                const err = new Error(
                    'Only locked submissions can be reopened'
                );
                err.code = 'SUBMISSION_NOT_LOCKED';
                throw err;
            }

            // Reopen only the submission associated with this request.
            const [result] = await connection.query(
                `UPDATE score_submissions
                 SET status = 'draft',
                     submitted_at = NULL,
                     locked_at = NULL
                 WHERE id = ?
                   AND status = 'locked'`,
                [request.score_submission_id]
            );

            if (result.affectedRows === 0) {
                const err = new Error(
                    'Submission could not be reopened'
                );
                err.code = 'REOPEN_FAILED';
                throw err;
            }
        }

        await connection.query(
            `UPDATE score_revisions
             SET status = ?,
                 decided_by = ?
             WHERE id = ?
               AND status = 'pending'`,
            [decision, adminId, id]
        );

        await connection.commit();

        return true;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

module.exports = {
    create,
    getAll,
    getAllByJudge,
    getById,
    decide
};
>>>>>>> origin/main
