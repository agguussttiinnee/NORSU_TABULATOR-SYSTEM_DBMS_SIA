
const db = require('../config/db');

exports.findAllByJudgeAndCriterion = async (judgeId, criterionId) => {
    const [rows] = await db.query(
        `SELECT id, judge_id, participant_id, criterion_id, score,
                created_at, updated_at
         FROM scores
         WHERE judge_id = ? AND criterion_id = ?
         ORDER BY participant_id`,
        [judgeId, criterionId]
    );

    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        `SELECT id, judge_id, participant_id, criterion_id, score,
                created_at, updated_at
         FROM scores
         WHERE id = ?`,
        [id]
    );

    return rows[0] || null;
};

exports.create = async ({
    judge_id,
    participant_id,
    criterion_id,
    score
}) => {
    const [result] = await db.query(
        `INSERT INTO scores
            (judge_id, participant_id, criterion_id, score)
         VALUES (?, ?, ?, ?)`,
        [judge_id, participant_id, criterion_id, score]
    );

    return result.insertId;
};

exports.update = async (id, score) => {
    const [result] = await db.query(
        `UPDATE scores
         SET score = ?
         WHERE id = ?`,
        [score, id]
    );

    return result.affectedRows;
};

exports.isJudgeAssignedToEvent = async (judgeId, eventId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM event_judges
         WHERE user_id = ? AND event_id = ?`,
        [judgeId, eventId]
    );

    return rows.length > 0;
};

exports.isParticipantRegisteredForEvent = async (participantId, eventId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM event_participants
         WHERE participant_id = ? AND event_id = ?`,
        [participantId, eventId]
    );

    return rows.length > 0;
};

exports.findEventJudgeId = async (judgeId, eventId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM event_judges
         WHERE user_id = ? AND event_id = ?`,
        [judgeId, eventId]
    );

    return rows[0]?.id || null;
};

exports.isSubmissionLocked = async (eventJudgeId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM score_submissions
         WHERE event_judge_id = ? AND status = 'locked'`,
        [eventJudgeId]
    );

    return rows.length > 0;
};

// Transaction-safe score creation
exports.createWithLock = async ({
    judge_id,
    participant_id,
    criterion_id,
    score,
    event_id
}) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [assignments] = await connection.query(
            `SELECT id
             FROM event_judges
             WHERE user_id = ? AND event_id = ?
             FOR UPDATE`,
            [judge_id, event_id]
        );

        if (assignments.length === 0) {
            const err = new Error('You are not assigned to this event');
            err.code = 'NOT_ASSIGNED';
            throw err;
        }

        const [submissions] = await connection.query(
            `SELECT id
             FROM score_submissions
             WHERE event_judge_id = ? AND status = 'locked'`,
            [assignments[0].id]
        );

        if (submissions.length > 0) {
            const err = new Error('Your scores for this event are already locked');
            err.code = 'SCORE_LOCKED';
            throw err;
        }

        const [result] = await connection.query(
            `INSERT INTO scores
                (judge_id, participant_id, criterion_id, score)
             VALUES (?, ?, ?, ?)`,
            [judge_id, participant_id, criterion_id, score]
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

// Transaction-safe score updating
exports.updateWithLock = async ({
    id,
    judge_id,
    event_id,
    score
}) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [assignments] = await connection.query(
            `SELECT id
             FROM event_judges
             WHERE user_id = ? AND event_id = ?
             FOR UPDATE`,
            [judge_id, event_id]
        );

        if (assignments.length === 0) {
            const err = new Error('You are not assigned to this event');
            err.code = 'NOT_ASSIGNED';
            throw err;
        }

        const [submissions] = await connection.query(
            `SELECT id
             FROM score_submissions
             WHERE event_judge_id = ? AND status = 'locked'`,
            [assignments[0].id]
        );

        if (submissions.length > 0) {
            const err = new Error('Your scores for this event are already locked');
            err.code = 'SCORE_LOCKED';
            throw err;
        }

        const [existing] = await connection.query(
            `SELECT id
             FROM scores
             WHERE id = ? AND judge_id = ?`,
            [id, judge_id]
        );

        if (existing.length === 0) {
            const err = new Error('Score not found');
            err.code = 'SCORE_NOT_FOUND';
            throw err;
        }

        const [result] = await connection.query(
            `UPDATE scores
             SET score = ?
             WHERE id = ? AND judge_id = ?`,
            [score, id, judge_id]
        );

        await connection.commit();

        return result.affectedRows;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};