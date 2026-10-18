const db = require('../config/db');
const Participant = require('./participantModel');

exports.register = async (
    eventId,
    participantFields,
    entryNumber
) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [eventRows] = await connection.query(
            `SELECT id FROM events
             WHERE id = ? AND is_active = 1
             FOR UPDATE`,
            [eventId]
        );

        if (!eventRows.length) {
            const error = new Error('Event not found');
            error.code = 'EVENT_NOT_FOUND';
            throw error;
        }

        const participantId =
            await Participant.createWithConnection(
                connection,
                participantFields
            );

        const [registration] = await connection.query(
            `INSERT INTO event_participants
                (event_id, participant_id, entry_number)
             VALUES (?, ?, ?)`,
            [eventId, participantId, entryNumber]
        );

        await connection.commit();

        return {
            registration_id: registration.insertId,
            event_id: Number(eventId),
            participant_id: participantId,
            entry_number: entryNumber
        };
    } catch (e) {
        try {
            await connection.rollback();
        } catch (_) {
            // Preserve the original error.
        }

        throw e;
    } finally {
        connection.release();
    }
};

// INNER JOIN report: roster, participant, college, and event.
exports.findRosterByEvent = async (eventId) => {
    const [rows] = await db.query(
        `SELECT
            e.id AS event_id,
            e.event_name,
            e.event_date,
            e.status AS event_status,
            ep.id AS registration_id,
            ep.entry_number,
            ep.registered_at,
            p.id AS participant_id,
            p.name AS participant_name,
            p.participant_type,
            c.id AS college_id,
            c.name AS college_name
         FROM event_participants ep
         INNER JOIN events e
            ON e.id = ep.event_id
         INNER JOIN participants p
            ON p.id = ep.participant_id
         INNER JOIN colleges c
            ON c.id = p.college_id
         WHERE ep.event_id = ?
           AND e.is_active = 1
           AND p.is_active = 1
         ORDER BY ep.entry_number, p.name`,
        [eventId]
    );

    return rows;
};

exports.removeRegistration = async (
    eventId,
    registrationId
) => {
    const [result] = await db.query(
        `DELETE FROM event_participants
         WHERE event_id = ? AND id = ?`,
        [eventId, registrationId]
    );

    return result.affectedRows;
};