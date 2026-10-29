const db = require('../config/db');

// ---------- award_categories ----------
exports.findCategories = async () => {
  const [rows] = await db.query('SELECT id, name, description FROM award_categories ORDER BY id');
  return rows;
};

exports.createCategory = async (name, description = null) => {
  const [result] = await db.query(
    'INSERT INTO award_categories (name, description) VALUES (?, ?)',
    [name, description]
  );
  return result.insertId;
};

// ---------- awards (complete resource) ----------
exports.findAll = async (eventId = null) => {
  let sql = `SELECT id, event_id, participant_id, award_category_id, rank_no,
                    total_score, remarks, created_at, updated_at
             FROM awards WHERE is_active = 1`;
  const params = [];
  if (eventId) { sql += ' AND event_id = ?'; params.push(eventId); }
  sql += ' ORDER BY event_id, award_category_id, rank_no';
  const [rows] = await db.query(sql, params);
  return rows;
};

exports.findById = async (id) => {
  const [rows] = await db.query(
    `SELECT id, event_id, participant_id, award_category_id, rank_no,
            total_score, remarks, created_at, updated_at
     FROM awards WHERE id = ? AND is_active = 1`,
    [id]
  );
  return rows[0] || null;
};

exports.create = async ({ event_id, participant_id, award_category_id, rank_no, total_score = 0, remarks = null }) => {
  const [result] = await db.query(
    `INSERT INTO awards (event_id, participant_id, award_category_id, rank_no, total_score, remarks)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [event_id, participant_id, award_category_id, rank_no, total_score, remarks]
  );
  return result.insertId;
};

// Only updates the fields that were sent (PATCH-style).
exports.update = async (id, fields) => {
  const allowed = ['participant_id', 'award_category_id', 'rank_no', 'total_score', 'remarks'];
  const sets = [];
  const params = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { sets.push(`${key} = ?`); params.push(fields[key]); }
  }
  if (!sets.length) return 0;
  params.push(id);
  const [result] = await db.query(
    `UPDATE awards SET ${sets.join(', ')} WHERE id = ? AND is_active = 1`,
    params
  );
  return result.affectedRows;
};

// Soft delete
exports.remove = async (id) => {
  const [result] = await db.query('UPDATE awards SET is_active = 0 WHERE id = ? AND is_active = 1', [id]);
  return result.affectedRows;
};

// ---------- JOIN REPORT (INNER) ----------
// Leaderboard rows with participant, college and event.
// ASSUMPTIONS (change if teammates use other column names):
//   events(id, name)  participants(id, full_name, college_id)  colleges(id, name)
exports.reportLeaderboard = async (eventId = null, categoryId = null) => {
  let sql = `
    SELECT a.id AS award_id,
           ev.id AS event_id, ev.name AS event_name,
           ac.name AS award_category,
           a.rank_no,
           p.id AS participant_id, p.full_name AS participant_name,
           c.id AS college_id, c.name AS college_name,
           a.total_score, a.remarks
    FROM awards a
    INNER JOIN award_categories ac ON ac.id = a.award_category_id
    INNER JOIN events ev           ON ev.id = a.event_id
    INNER JOIN participants p      ON p.id  = a.participant_id
    INNER JOIN colleges c          ON c.id  = p.college_id
    WHERE a.is_active = 1`;
  const params = [];
  if (eventId)    { sql += ' AND ev.id = ?'; params.push(eventId); }
  if (categoryId) { sql += ' AND ac.id = ?'; params.push(categoryId); }
  sql += ' ORDER BY ev.id, ac.id, a.rank_no';
  const [rows] = await db.query(sql, params);
  return rows;
};
