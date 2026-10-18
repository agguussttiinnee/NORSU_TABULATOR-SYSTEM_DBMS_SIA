const db = require('../config/db');

exports.createWithConnection = async (
    connection,
    { name, participant_type, college_id }
) => {
    const [result] = await connection.query(
        `INSERT INTO participants
            (name, participant_type, college_id)
         VALUES (?, ?, ?)`,
        [name, participant_type, college_id]
    );

    return result.insertId;
};

// Returns active participants for the registration form's reuse selector.
exports.findActive = async ({ collegeId, participantType } = {}) => {
    let sql = `SELECT p.id, p.name, p.participant_type, p.college_id,
                      c.name AS college_name
               FROM participants p
               INNER JOIN colleges c ON c.id = p.college_id
               WHERE p.is_active = 1 AND c.is_active = 1`;
    const values = [];

    if (collegeId) {
        sql += ' AND p.college_id = ?';
        values.push(collegeId);
    }

    if (participantType) {
        sql += ' AND p.participant_type = ?';
        values.push(participantType);
    }

    sql += ' ORDER BY c.name, p.participant_type, p.name, p.id';

    const [rows] = await db.query(sql, values);
    return rows;
};

// Assumes Bernadette's table is colleges(id).
exports.collegeExists = async (collegeId) => {
    const [rows] = await db.query(
        'SELECT id FROM colleges WHERE id = ? AND is_active = 1',
        [collegeId]
    );

    return rows.length > 0;
};
