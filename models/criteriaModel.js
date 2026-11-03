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

// Create a criterion only if the event's total weight stays at or below 100%.
exports.createWithWeightLimit = async ({
    event_id,
    name,
    weight,
    max_score
}) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Lock this event row so simultaneous weight changes are checked one at a time.
        const [events] = await connection.query(
            `SELECT id FROM events WHERE id = ? FOR UPDATE`,
            [event_id]
        );

        if (!events.length) {
            const err = new Error('Event not found');
            err.code = 'EVENT_NOT_FOUND';
            throw err;
        }

        const [rows] = await connection.query(
            `SELECT COALESCE(SUM(weight), 0) AS total_weight
             FROM criteria
             WHERE event_id = ?`,
            [event_id]
        );

        const totalWeight = Number(rows[0].total_weight);

        if (totalWeight + weight > 100) {
            const err = new Error('Total criterion weight cannot exceed 100%');
            err.code = 'WEIGHT_LIMIT_EXCEEDED';
            throw err;
        }

        const [result] = await connection.query(
            `INSERT INTO criteria
                (event_id, name, weight, max_score)
             VALUES (?, ?, ?, ?)`,
            [event_id, name, weight, max_score]
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

// Update a criterion only if the event's total weight stays at or below 100%.
exports.updateWithWeightLimit = async (id, eventId, fields) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(
            `SELECT id FROM events WHERE id = ? FOR UPDATE`,
            [eventId]
        );

        const [currentRows] = await connection.query(
            `SELECT weight
             FROM criteria
             WHERE id = ? AND event_id = ?`,
            [id, eventId]
        );

        if (!currentRows.length) {
            const err = new Error('Criterion not found');
            err.code = 'CRITERION_NOT_FOUND';
            throw err;
        }

        const newWeight = fields.weight !== undefined
            ? fields.weight
            : Number(currentRows[0].weight);

        const [rows] = await connection.query(
            `SELECT COALESCE(SUM(weight), 0) AS total_weight
             FROM criteria
             WHERE event_id = ? AND id <> ?`,
            [eventId, id]
        );

        const otherWeights = Number(rows[0].total_weight);

        if (otherWeights + newWeight > 100) {
            const err = new Error('Total criterion weight cannot exceed 100%');
            err.code = 'WEIGHT_LIMIT_EXCEEDED';
            throw err;
        }

        const allowed = ['name', 'weight', 'max_score'];
        const keys = Object.keys(fields).filter(
            key => allowed.includes(key)
        );

        if (!keys.length) {
            await connection.rollback();
            return 0;
        }

        const sets = keys.map(key => `${key} = ?`).join(', ');
        const values = keys.map(key => fields[key]);

        const [result] = await connection.query(
            `UPDATE criteria
             SET ${sets}
             WHERE id = ?`,
            [...values, id]
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

exports.getTotalWeight = async (eventId) => {
    const [rows] = await db.query(
        `SELECT COALESCE(SUM(weight), 0) AS total_weight
         FROM criteria
         WHERE event_id = ?`,
        [eventId]
    );

    return Number(rows[0].total_weight);
};

exports.delete = async (id) => {
    const [result] = await db.query(
        `DELETE FROM criteria
         WHERE id = ?
         AND NOT EXISTS (
             SELECT 1
             FROM scores
             WHERE scores.criterion_id = criteria.id
         )`,
        [id]
    );

    return result.affectedRows;
};