// Seeds two repeatable Transactions demo events using the team's master-data names.
// Dates are placeholders for classroom demonstration, not official NORSU schedules.
require('dotenv').config();
const db = require('../config/db');

const demoEvents = [
    {
        name: 'NORSU College Pageant 2026',
        eventType: 'Pageant',
        venue: 'University Gym',
        date: process.env.DEMO_PAGEANT_DATE || '2026-12-01 08:00:00'
    },
    {
        name: 'NORSU Hugyawan 2026',
        eventType: 'Hugyawan',
        venue: 'Covered Court',
        date: process.env.DEMO_HUGYAWAN_DATE || '2026-12-02 08:00:00'
    }
];

(async () => {
    try {
        for (const item of demoEvents) {
            const [types] = await db.query(
                'SELECT id FROM event_types WHERE name = ? LIMIT 1',
                [item.eventType]
            );
            if (!types.length) {
                throw new Error(
                    `Missing event type "${item.eventType}". Run the team's master-data seed first.`
                );
            }

            const [venues] = await db.query(
                'SELECT id FROM venues WHERE name = ? LIMIT 1',
                [item.venue]
            );
            if (!venues.length) {
                throw new Error(
                    `Missing venue "${item.venue}". Run the team's master-data seed first.`
                );
            }

            const [existing] = await db.query(
                'SELECT id FROM events WHERE event_name = ? LIMIT 1',
                [item.name]
            );

            if (existing.length) {
                console.log(`Already exists: ${item.name} (ID ${existing[0].id})`);
                continue;
            }

            const [result] = await db.query(
                `INSERT INTO events
                    (event_name, event_type_id, venue_id, event_date, status)
                 VALUES (?, ?, ?, ?, 'scheduled')`,
                [item.name, types[0].id, venues[0].id, item.date]
            );
            console.log(`Created: ${item.name} (ID ${result.insertId})`);
        }

        console.log('Demo event seeding complete. Review the placeholder dates with your team.');
    } catch (error) {
        console.error('Demo event seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await db.end();
    }
})();
