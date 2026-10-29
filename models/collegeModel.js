const db = require('../config/db');

const getAll = async () => {
  const [rows] = await db.query(
    'SELECT * FROM colleges WHERE is_active = 1 ORDER BY name'
  );
  return rows;
};

const getById = async (id) => {
  const [rows] = await db.query(
    'SELECT * FROM colleges WHERE id = ? AND is_active = 1',
    [id]
  );
  return rows[0];
};

const create = async (name, code) => {
  const [result] = await db.query(
    'INSERT INTO colleges (name, code) VALUES (?, ?)',
    [name, code]
  );
  return result.insertId;
};

const update = async (id, name, code) => {
  const [result] = await db.query(
    'UPDATE colleges SET name = ?, code = ? WHERE id = ? AND is_active = 1',
    [name, code, id]
  );
  return result.affectedRows;
};

// Soft delete: the row stays, it is just hidden
const softDelete = async (id) => {
  const [result] = await db.query(
    'UPDATE colleges SET is_active = 0 WHERE id = ? AND is_active = 1',
    [id]
  );
  return result.affectedRows;
};

// LEFT JOIN report: colleges with no participants in the given event.
// The subquery lists colleges that DO have participants in that event.
// After the LEFT JOIN, colleges with no match have NULL on the right side.
const noParticipants = async (eventId) => {
  const [rows] = await db.query(
    `SELECT c.id, c.name, c.code
     FROM colleges c
     LEFT JOIN (
       SELECT DISTINCT p.college_id
       FROM participants p
       INNER JOIN event_participants ep ON ep.participant_id = p.id
       WHERE ep.event_id = ?
     ) x ON x.college_id = c.id
     WHERE x.college_id IS NULL AND c.is_active = 1
     ORDER BY c.name`,
    [eventId]
  );
  return rows;
};

module.exports = { getAll, getById, create, update, softDelete, noParticipants };