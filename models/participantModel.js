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

// Assumes Bernadette's table is colleges(id).
exports.collegeExists = async (collegeId) => {
    const [rows] = await db.query(
        'SELECT id FROM colleges WHERE id = ?',
        [collegeId]
    );

    return rows.length > 0;
};