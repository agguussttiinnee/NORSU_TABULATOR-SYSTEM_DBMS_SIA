const db = require('../config/db');
 
// Create a revision request and record it in the audit log.
const create = async (submissionId, requestedBy, reason) => {
    const connection = await db.getConnection();
 
    try {
        await connection.beginTransaction();
 
        const [result] = await connection.query(
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
 
        if (result.affectedRows === 0) {
            await connection.rollback();
            return null;
        }
 
        await connection.query(
            `INSERT INTO audit_logs
                (user_id, action, table_name, record_id,
                 old_value, new_value)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                requestedBy,
                'REVISION_REQUESTED',
                'score_revisions',
                result.insertId,
                null,
                JSON.stringify({
                    score_submission_id: submissionId,
                    status: 'pending',
                    reason: reason
                })
            ]
        );
 
        await connection.commit();
        return result.insertId;
 
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};
 
// Retrieve all revision requests.
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
 
// Retrieve revision requests made by a judge.
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
 
// Retrieve one revision request.
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
 
// Approve or reject a revision request and record the decision.
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
 
        const oldValue = {
            revision_status: request.status,
            submission_status: request.submission_status
        };
 
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
 
        const newValue = {
            revision_status: decision,
            submission_status:
                decision === 'approved' ? 'draft' : 'locked',
            score_submission_id: request.score_submission_id
        };
 
        await connection.query(
            `INSERT INTO audit_logs
                (user_id, action, table_name, record_id,
                 old_value, new_value)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                adminId,
                decision === 'approved'
                    ? 'REVISION_APPROVED'
                    : 'REVISION_REJECTED',
                'score_revisions',
                id,
                JSON.stringify(oldValue),
                JSON.stringify(newValue)
            ]
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
 