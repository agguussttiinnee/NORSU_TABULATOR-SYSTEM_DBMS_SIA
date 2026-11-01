const db = require('../config/db');

exports.assign = async (eventId, userId) => {
  const [result] = await db.query(
    'INSERT INTO event_judges (event_id, user_id) VALUES (?, ?)',
    [eventId, userId]
  );
  return result.insertId;
};

exports.findAll = async () => {
  const [rows] = await db.query(
    'SELECT id, event_id, user_id, assigned_at FROM event_judges ORDER BY id'
  );
  return rows;
};

exports.remove = async (id) => {
  const [result] = await db.query('DELETE FROM event_judges WHERE id = ?', [id]);
  return result.affectedRows;
};

// JOIN REPORT (INNER): judges per event with user and role.
// ASSUMPTION: events has columns id and name. Change e.name if Carl uses another column.
exports.reportJudgesPerEvent = async (eventId = null) => {
  let sql = `
    SELECT ej.id AS assignment_id,
          e.id AS event_id, e.event_name AS event_name,
           u.id AS user_id, u.full_name AS judge_name, u.email,
           r.name AS role,
           ej.assigned_at
    FROM event_judges ej
    INNER JOIN events e ON e.id = ej.event_id
    INNER JOIN users u  ON u.id = ej.user_id
    INNER JOIN roles r  ON r.id = u.role_id
    WHERE u.is_active = 1`;
  const params = [];
  if (eventId) {
    sql += ' AND e.id = ?';
    params.push(eventId);
  }
  sql += ' ORDER BY e.id, u.full_name';
  const [rows] = await db.query(sql, params);
  return rows;
};
