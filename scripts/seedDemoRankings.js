// Seeds demo participants, criteria, a judge, scores and a locked submission
// for the demo pageant, so the Final rankings card on the Awards screen has data.
// It does NOT create awards: use "Give award" on the Awards screen to do that.
// Run after: npm run seed:admin, the master-data SQL, and npm run seed:demo.
require('dotenv').config();
const db = require('../config/db');

const EVENT_NAME = 'NORSU College Pageant 2026';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@norsu.edu.ph';

const criteria = [
  { name: 'Talent', weight: 60, maxScore: 10 },
  { name: 'Poise', weight: 40, maxScore: 10 },
];

// Sample names only, not real students.
const participants = [
  { name: 'Maria Santos', college: 'CAS', entry: 'P-01', scores: { Talent: 9, Poise: 8 } },
  { name: 'Ana Reyes',    college: 'CBA', entry: 'P-02', scores: { Talent: 8, Poise: 9 } },
  { name: 'Liza Cruz',    college: 'CEA', entry: 'P-03', scores: { Talent: 7, Poise: 7 } },
];

async function one(sql, params, message) {
  const [rows] = await db.query(sql, params);
  if (!rows.length) throw new Error(message);
  return rows[0];
}

(async () => {
  try {
    const event = await one('SELECT id FROM events WHERE event_name = ? LIMIT 1', [EVENT_NAME],
      `Missing event "${EVENT_NAME}". Run npm run seed:demo first.`);
    const admin = await one('SELECT id FROM users WHERE email = ? LIMIT 1', [ADMIN_EMAIL],
      'Missing admin user. Run npm run seed:admin first.');

    // 1. Criteria (weights total 100)
    for (const c of criteria) {
      await db.query(
        'INSERT IGNORE INTO criteria (event_id, name, weight, max_score) VALUES (?, ?, ?, ?)',
        [event.id, c.name, c.weight, c.maxScore]
      );
    }
    const [criteriaRows] = await db.query('SELECT id, name FROM criteria WHERE event_id = ?', [event.id]);
    const criterionId = {};
    criteriaRows.forEach(r => { criterionId[r.name] = r.id; });

    // 2. Judge assignment (the admin acts as the judge for the demo)
    await db.query('INSERT IGNORE INTO event_judges (event_id, user_id) VALUES (?, ?)', [event.id, admin.id]);
    const judge = await one('SELECT id FROM event_judges WHERE event_id = ? AND user_id = ?',
      [event.id, admin.id], 'Judge assignment failed.');

    // 3. Participants, registration and scores
    for (const p of participants) {
      const college = await one('SELECT id FROM colleges WHERE code = ? LIMIT 1', [p.college],
        `Missing college ${p.college}. Run the master-data seed first.`);

      const [found] = await db.query('SELECT id FROM participants WHERE name = ? LIMIT 1', [p.name]);
      let participantId;
      if (found.length) {
        participantId = found[0].id;
      } else {
        const [res] = await db.query(
          "INSERT INTO participants (name, participant_type, college_id) VALUES (?, 'candidate', ?)",
          [p.name, college.id]
        );
        participantId = res.insertId;
      }

      await db.query(
        'INSERT IGNORE INTO event_participants (event_id, participant_id, entry_number) VALUES (?, ?, ?)',
        [event.id, participantId, p.entry]
      );

      for (const [criterionName, score] of Object.entries(p.scores)) {
        await db.query(
          'INSERT IGNORE INTO scores (judge_id, participant_id, criterion_id, score) VALUES (?, ?, ?, ?)',
          [admin.id, participantId, criterionId[criterionName], score]
        );
      }
      console.log(`Ready: ${p.name} (${p.entry})`);
    }

    // 4. Lock the judge's submission so the rankings become available
    await db.query(
      `INSERT IGNORE INTO score_submissions (event_judge_id, status, submitted_at, locked_at)
       VALUES (?, 'locked', NOW(), NOW())`,
      [judge.id]
    );

    console.log(`Demo rankings data ready for "${EVENT_NAME}" (event ID ${event.id}).`);
    console.log('Open Awards, load rankings for that event ID, then use Give award.');
  } catch (error) {
    console.error('Demo rankings seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();