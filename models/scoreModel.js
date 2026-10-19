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