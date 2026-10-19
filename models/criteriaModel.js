const db = require('../config/db');

exports.findAllByEvent = async (eventId) => {
    const [rows] = await db.query(
        `SELECT id, event_id, name, weight, max_score,
                created_at, updated_at
         FROM criteria
         WHERE event_id = ?
         ORDER BY id`,
        [eventId]
    );

    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        `SELECT id, event_id, name, weight, max_score,
                created_at, updated_at
         FROM criteria
         WHERE id = ?`,
        [id]
    );

    return rows[0] || null;
};

exports.create = async ({
    event_id,
    name,
    weight,
    max_score
}) => {
    const [result] = await db.query(
        `INSERT INTO criteria
            (event_id, name, weight, max_score)
         VALUES (?, ?, ?, ?)`,
        [event_id, name, weight, max_score]
    );

    return result.insertId;
};

exports.update = async (id, fields) => {
    const allowed = ['name', 'weight', 'max_score'];

    const keys = Object.keys(fields).filter(
        key => allowed.includes(key)
    );

    if (!keys.length) {
        return 0;
    }

    const sets = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);

    const [result] = await db.query(
        `UPDATE criteria
         SET ${sets}
         WHERE id = ?`,
        [...values, id]
    );

    return result.affectedRows;
};

exports.getTotalWeight = async (eventId) => {
    const [rows] = await db.query(
        `SELECT COALESCE(SUM(weight), 0) AS total_weight
         FROM criteria
         WHERE event_id = ?`,
        [eventId]
    );

    return Number(rows[0].total_weight);
};