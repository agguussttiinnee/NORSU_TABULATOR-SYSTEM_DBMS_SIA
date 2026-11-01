const db = require('../config/db');

const BASE = `
    SELECT e.id, e.event_name, e.event_type_id, e.venue_id,
           e.event_date, e.status, e.is_active,
           e.created_at, e.updated_at
    FROM events e
`;

exports.findAll = async () => {
    const [rows] = await db.query(
        `${BASE}
         WHERE e.is_active = 1
         ORDER BY e.event_date, e.id`
    );

    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        `${BASE}
         WHERE e.id = ? AND e.is_active = 1`,
        [id]
    );

    return rows[0] || null;
};

// Assumes the master table is event_types(id).
exports.eventTypeExists = async (eventTypeId) => {
    const [rows] = await db.query(
        'SELECT id FROM event_types WHERE id = ?',
        [eventTypeId]
    );

    return rows.length > 0;
};

// Assumes the master table is venues(id).
exports.venueExists = async (venueId) => {
    const [rows] = await db.query(
        'SELECT id FROM venues WHERE id = ?',
        [venueId]
    );

    return rows.length > 0;
};

exports.create = async ({
    event_name,
    event_type_id,
    venue_id,
    event_date,
    status
}) => {
    const [result] = await db.query(
        `INSERT INTO events
            (event_name, event_type_id, venue_id, event_date, status)
         VALUES (?, ?, ?, ?, ?)`,
        [
            event_name,
            event_type_id,
            venue_id,
            event_date,
            status
        ]
    );

    return result.insertId;
};

exports.update = async (id, fields) => {
    const allowed = [
        'event_name',
        'event_type_id',
        'venue_id',
        'event_date',
        'status'
    ];

    const keys = Object.keys(fields).filter(
        key => allowed.includes(key)
    );

    if (!keys.length) {
        return 0;
    }

    const sets = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => fields[key]);

    const [result] = await db.query(
        `UPDATE events
         SET ${sets}
         WHERE id = ? AND is_active = 1`,
        [...values, id]
    );

    return result.affectedRows;
};

// Soft delete preserves records used by registrations and judging.
exports.softDelete = async (id) => {
    const [result] = await db.query(
        `UPDATE events
         SET is_active = 0
         WHERE id = ? AND is_active = 1`,
        [id]
    );

    return result.affectedRows;
};

// Lookup data used by the event form dropdowns.
exports.findLookups = async () => {
    const [eventTypes] = await db.query(
        'SELECT id, name FROM event_types ORDER BY name'
    );
    const [venues] = await db.query(
        'SELECT id, name, location FROM venues ORDER BY name'
    );
    const [colleges] = await db.query(
        'SELECT id, name, code FROM colleges WHERE is_active = 1 ORDER BY name'
    );

    return { eventTypes, venues, colleges };
};
