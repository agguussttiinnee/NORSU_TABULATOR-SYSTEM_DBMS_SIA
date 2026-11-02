
const db = require('../config/db');

const getAll = async () => {
    const [rows] = await db.query(
        `SELECT *
         FROM score_submissions
         ORDER BY id`
    );

    return rows;
};

const getAllByJudge = async (judgeId) => {
    const [rows] = await db.query(
        `SELECT ss.*
         FROM score_submissions ss
         JOIN event_judges ej
             ON ss.event_judge_id = ej.id
         WHERE ej.user_id = ?
         ORDER BY ss.id`,
        [judgeId]
    );

    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        `SELECT ss.*
         FROM score_submissions ss
         WHERE ss.id = ?`,
        [id]
    );

    return rows[0] || null;
};

const getByIdWithAssignment = async (id) => {
    const [rows] = await db.query(
        `SELECT ss.*, ej.user_id, ej.event_id
         FROM score_submissions ss
         JOIN event_judges ej
             ON ss.event_judge_id = ej.id
         WHERE ss.id = ?`,
        [id]
    );

    return rows[0] || null;
};

const create = async (eventJudgeId, judgeId) => {
    const [result] = await db.query(
        `INSERT INTO score_submissions (event_judge_id)
         SELECT id
         FROM event_judges
         WHERE id = ? AND user_id = ?`,
        [eventJudgeId, judgeId]
    );

    return result.affectedRows ? result.insertId : null;
};

// Submit and lock only this judge's assignment for this event.
const submit = async (id, judgeId) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [submissions] = await connection.query(
            `SELECT event_judge_id
             FROM score_submissions
             WHERE id = ?`,
            [id]
        );

        if (submissions.length === 0) {
            const err = new Error('Submission not found');
            err.code = 'SUBMISSION_NOT_FOUND';
            throw err;
        }

        const eventJudgeId = submissions[0].event_judge_id;

        const [assignments] = await connection.query(
            `SELECT id
             FROM event_judges
             WHERE id = ? AND user_id = ?
             FOR UPDATE`,
            [eventJudgeId, judgeId]
        );

        if (assignments.length === 0) {
            const err = new Error('You do not own this submission');
            err.code = 'NOT_OWNER';
            throw err;
        }

        const [result] = await connection.query(
            `UPDATE score_submissions
             SET status = 'locked',
                 submitted_at = NOW(),
                 locked_at = NOW()
             WHERE id = ? AND event_judge_id = ?
               AND status = 'draft'`,
            [id, eventJudgeId]
        );

        if (result.affectedRows === 0) {
            const err = new Error('Submission is already locked or submitted');
            err.code = 'ALREADY_SUBMITTED';
            throw err;
        }

        await connection.commit();

        return result.affectedRows;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const remove = async (id) => {
    const [result] = await db.query(
        `DELETE FROM score_submissions
         WHERE id = ? AND status = 'draft'`,
        [id]
    );

    return result.affectedRows;
};

module.exports = {
    getAll,
    getAllByJudge,
    getById,
    getByIdWithAssignment,
    create,
    submit,
    remove
};