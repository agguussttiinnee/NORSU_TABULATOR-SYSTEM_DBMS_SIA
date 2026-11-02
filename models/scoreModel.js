
const db = require('../config/db');

exports.findAllByJudgeAndCriterion = async (judgeId, criterionId) => {
    const [rows] = await db.query(
        `SELECT id, judge_id, participant_id, criterion_id, score,
                created_at, updated_at
         FROM scores
         WHERE judge_id = ? AND criterion_id = ?
         ORDER BY participant_id`,
        [judgeId, criterionId]
    );

    return rows;
};

exports.findById = async (id) => {
    const [rows] = await db.query(
        `SELECT id, judge_id, participant_id, criterion_id, score,
                created_at, updated_at
         FROM scores
         WHERE id = ?`,
        [id]
    );

    return rows[0] || null;
};

exports.create = async ({
    judge_id,
    participant_id,
    criterion_id,
    score
}) => {
    const [result] = await db.query(
        `INSERT INTO scores
            (judge_id, participant_id, criterion_id, score)
         VALUES (?, ?, ?, ?)`,
        [judge_id, participant_id, criterion_id, score]
    );

    return result.insertId;
};

exports.update = async (id, score) => {
    const [result] = await db.query(
        `UPDATE scores
         SET score = ?
         WHERE id = ?`,
        [score, id]
    );

    return result.affectedRows;
};

exports.isJudgeAssignedToEvent = async (judgeId, eventId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM event_judges
         WHERE user_id = ? AND event_id = ?`,
        [judgeId, eventId]
    );

    return rows.length > 0;
};

exports.isParticipantRegisteredForEvent = async (participantId, eventId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM event_participants
         WHERE participant_id = ? AND event_id = ?`,
        [participantId, eventId]
    );

    return rows.length > 0;
};

exports.findEventJudgeId = async (judgeId, eventId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM event_judges
         WHERE user_id = ? AND event_id = ?`,
        [judgeId, eventId]
    );

    return rows[0]?.id || null;
};

exports.isSubmissionLocked = async (eventJudgeId) => {
    const [rows] = await db.query(
        `SELECT id
         FROM score_submissions
         WHERE event_judge_id = ? AND status = 'locked'`,
        [eventJudgeId]
    );

    return rows.length > 0;
};

exports.createWithLock = async ({
    judge_id,
    participant_id,
    criterion_id,
    score,
    event_id
}) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [assignments] = await connection.query(
            `SELECT id
             FROM event_judges
             WHERE user_id = ? AND event_id = ?
             FOR UPDATE`,
            [judge_id, event_id]
        );

        if (assignments.length === 0) {
            const err = new Error('You are not assigned to this event');
            err.code = 'NOT_ASSIGNED';
            throw err;
        }

        const [submissions] = await connection.query(
            `SELECT id
             FROM score_submissions
             WHERE event_judge_id = ? AND status = 'locked'`,
            [assignments[0].id]
        );

        if (submissions.length > 0) {
            const err = new Error('Your scores for this event are already locked');
            err.code = 'SCORE_LOCKED';
            throw err;
        }

        const [result] = await connection.query(
            `INSERT INTO scores
                (judge_id, participant_id, criterion_id, score)
             VALUES (?, ?, ?, ?)`,
            [judge_id, participant_id, criterion_id, score]
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

exports.updateWithLock = async ({
    id,
    judge_id,
    event_id,
    score
}) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [assignments] = await connection.query(
            `SELECT id
             FROM event_judges
             WHERE user_id = ? AND event_id = ?
             FOR UPDATE`,
            [judge_id, event_id]
        );

        if (assignments.length === 0) {
            const err = new Error('You are not assigned to this event');
            err.code = 'NOT_ASSIGNED';
            throw err;
        }

        const [submissions] = await connection.query(
            `SELECT id
             FROM score_submissions
             WHERE event_judge_id = ? AND status = 'locked'`,
            [assignments[0].id]
        );

        if (submissions.length > 0) {
            const err = new Error('Your scores for this event are already locked');
            err.code = 'SCORE_LOCKED';
            throw err;
        }

        const [existing] = await connection.query(
            `SELECT id
             FROM scores
             WHERE id = ? AND judge_id = ?`,
            [id, judge_id]
        );

        if (existing.length === 0) {
            const err = new Error('Score not found');
            err.code = 'SCORE_NOT_FOUND';
            throw err;
        }

        const [result] = await connection.query(
            `UPDATE scores
             SET score = ?
             WHERE id = ? AND judge_id = ?`,
            [score, id, judge_id]
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

// Get final event rankings
exports.getEventRankings = async (eventId) => {
    const connection = await db.getConnection();
    let transactionStarted = false;

    try {
        await connection.beginTransaction();
        transactionStarted = true;

        const [events] = await connection.query(
            `SELECT id
             FROM events
             WHERE id = ?`,
            [eventId]
        );

        if (events.length === 0) {
            const err = new Error('Event not found');
            err.code = 'EVENT_NOT_FOUND';
            throw err;
        }

        const [criteria] = await connection.query(
            `SELECT id, name, weight, max_score
             FROM criteria
             WHERE event_id = ?
             ORDER BY weight DESC, id ASC`,
            [eventId]
        );

        if (criteria.length === 0) {
            const err = new Error('No criteria found for this event');
            err.code = 'NO_CRITERIA';
            throw err;
        }

        const totalWeight = criteria.reduce(
            (total, criterion) => total + Number(criterion.weight),
            0
        );

        if (Math.abs(totalWeight - 100) > 0.0001) {
            const err = new Error(
                'Criteria weights must total exactly 100%'
            );
            err.code = 'WEIGHTS_NOT_COMPLETE';
            throw err;
        }

        if (criteria.some(c => Number(c.max_score) <= 0)) {
            const err = new Error(
                'Every criterion must have a maximum score greater than zero'
            );
            err.code = 'INVALID_MAX_SCORE';
            throw err;
        }

        const [participants] = await connection.query(
            `SELECT participant_id, entry_number
             FROM event_participants
             WHERE event_id = ?
             ORDER BY participant_id`,
            [eventId]
        );

        if (participants.length === 0) {
            const err = new Error('No participants registered for this event');
            err.code = 'NO_PARTICIPANTS';
            throw err;
        }

        const [judges] = await connection.query(
            `SELECT ej.id AS event_judge_id,
                    ej.user_id AS judge_id,
                    ss.status
             FROM event_judges ej
             LEFT JOIN score_submissions ss
                ON ss.event_judge_id = ej.id
             WHERE ej.event_id = ?
             ORDER BY ej.id`,
            [eventId]
        );

        if (judges.length === 0) {
            const err = new Error('No judges assigned to this event');
            err.code = 'NO_JUDGES';
            throw err;
        }

        const incompleteJudges = judges.filter(
            judge => judge.status !== 'locked'
        );

        if (incompleteJudges.length > 0) {
            const err = new Error(
                'Final rankings are unavailable until all assigned judges lock their submissions'
            );
            err.code = 'JUDGES_NOT_FINISHED';
            throw err;
        }

        const [missingScores] = await connection.query(
            `SELECT ej.user_id AS judge_id,
                    ep.participant_id,
                    c.id AS criterion_id
             FROM event_judges ej
             CROSS JOIN event_participants ep
             CROSS JOIN criteria c
             LEFT JOIN scores s
                ON s.judge_id = ej.user_id
                AND s.participant_id = ep.participant_id
                AND s.criterion_id = c.id
             WHERE ej.event_id = ?
                AND ep.event_id = ?
                AND c.event_id = ?
                AND s.id IS NULL
             LIMIT 20`,
            [eventId, eventId, eventId]
        );

        if (missingScores.length > 0) {
            const err = new Error(
                'Some participants still have missing scores'
            );
            err.code = 'SCORES_INCOMPLETE';
            err.details = missingScores;
            throw err;
        }

        const [scoreRows] = await connection.query(
            `SELECT s.judge_id,
                    s.participant_id,
                    s.criterion_id,
                    s.score
             FROM scores s
             INNER JOIN criteria c
                ON c.id = s.criterion_id
             INNER JOIN event_participants ep
                ON ep.participant_id = s.participant_id
                AND ep.event_id = c.event_id
             INNER JOIN event_judges ej
                ON ej.user_id = s.judge_id
                AND ej.event_id = c.event_id
             WHERE c.event_id = ?
             ORDER BY s.participant_id, s.criterion_id`,
            [eventId]
        );

        const roundScore = value =>
            Number(Number(value).toFixed(4));

        const rankings = participants.map(participant => {
            const criterionScores = criteria.map(criterion => {
                const scoresForCriterion = scoreRows
                    .filter(score =>
                        Number(score.participant_id) ===
                            Number(participant.participant_id) &&
                        Number(score.criterion_id) ===
                            Number(criterion.id)
                    )
                    .map(score => Number(score.score));

                const average = scoresForCriterion.reduce(
                    (sum, score) => sum + score,
                    0
                ) / judges.length;

                const weightedScore =
                    (average / Number(criterion.max_score)) *
                    Number(criterion.weight);

                return {
                    criterion_id: criterion.id,
                    criterion_name: criterion.name,
                    average_score: Number(average.toFixed(2)),
                    max_score: Number(criterion.max_score),
                    weight: Number(criterion.weight),
                    weighted_score: roundScore(weightedScore)
                };
            });

            const totalScore = roundScore(
                criterionScores.reduce(
                    (total, criterion) =>
                        total + criterion.weighted_score,
                    0
                )
            );

            return {
                participant_id: participant.participant_id,
                entry_number: participant.entry_number,
                total_score: totalScore,
                criterion_scores: criterionScores,
                rank: null,
                tie_break_status: 'Clear'
            };
        });

        rankings.sort(
            (a, b) => b.total_score - a.total_score
        );

        // Resolve ties using criteria in descending weight order
        const nearlyEqual = (a, b) =>
            Math.abs(a - b) < 0.0001;

        let index = 0;

        while (index < rankings.length) {
            const tiedGroup = [rankings[index]];
            const groupTotal = rankings[index].total_score;

            let nextIndex = index + 1;

            while (
                nextIndex < rankings.length &&
                nearlyEqual(
                    rankings[nextIndex].total_score,
                    groupTotal
                )
            ) {
                tiedGroup.push(rankings[nextIndex]);
                nextIndex++;
            }

            if (tiedGroup.length === 1) {
                tiedGroup[0].rank = index + 1;
                index = nextIndex;
                continue;
            }

            tiedGroup.sort((a, b) => {
                for (let i = 0; i < criteria.length; i++) {
                    const scoreA =
                        a.criterion_scores[i].weighted_score;

                    const scoreB =
                        b.criterion_scores[i].weighted_score;

                    if (!nearlyEqual(scoreA, scoreB)) {
                        return scoreB - scoreA;
                    }
                }

                return 0;
            });

            let tieIndex = 0;

            while (tieIndex < tiedGroup.length) {
                const sameTie = [tiedGroup[tieIndex]];
                const current = tiedGroup[tieIndex];

                let nextTieIndex = tieIndex + 1;

                while (nextTieIndex < tiedGroup.length) {
                    const next = tiedGroup[nextTieIndex];

                    const allCriteriaEqual = criteria.every(
                        (criterion, criterionIndex) =>
                            nearlyEqual(
                                current.criterion_scores[criterionIndex].weighted_score,
                                next.criterion_scores[criterionIndex].weighted_score
                            )
                    );

                    if (!allCriteriaEqual) {
                        break;
                    }

                    sameTie.push(next);
                    nextTieIndex++;
                }

                const rank =
                    index + tieIndex + 1;

                sameTie.forEach(participant => {
                    participant.rank = rank;

                    participant.tie_break_status =
                        sameTie.length > 1
                            ? 'Tie - Admin Decides'
                            : 'Resolved by higher-weight criterion';
                });

                tieIndex = nextTieIndex;
            }

            index = nextIndex;
        }

        await connection.commit();
        transactionStarted = false;

        return rankings;

    } catch (err) {
        if (transactionStarted) {
            await connection.rollback();
        }

        throw err;

    } finally {
        connection.release();
    }
};