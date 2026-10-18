const Event = require('../models/eventModel');
const Participant = require('../models/participantModel');
const EventParticipant = require('../models/eventParticipantModel');
const { success, error } = require('../utils/response');

function validId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
}

exports.listParticipants = async (req, res, next) => {
    try {
        const collegeId = req.query.college_id === undefined
            ? null
            : validId(req.query.college_id);
        const participantType = req.query.participant_type || null;

        if (req.query.college_id !== undefined && !collegeId) {
            return error(res, 'college_id must be a positive integer', 400);
        }

        if (participantType && !['candidate', 'college_team'].includes(participantType)) {
            return error(res, "participant_type must be 'candidate' or 'college_team'", 400);
        }

        return success(
            res,
            await Participant.findActive({ collegeId, participantType })
        );
    } catch (e) {
        next(e);
    }
};

exports.listForEvent = async (req, res, next) => {
    try {
        const eventId = validId(req.params.id);

        if (!eventId) {
            return error(
                res,
                'Event ID must be a positive integer',
                400
            );
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return error(res, 'Event not found', 404);
        }

        return success(
            res,
            await EventParticipant.findRosterByEvent(eventId)
        );
    } catch (e) {
        next(e);
    }
};

exports.registerForEvent = async (req, res, next) => {
    try {
        const eventId = validId(req.params.id);
        const hasParticipantId = req.body.participant_id !== undefined && req.body.participant_id !== null && req.body.participant_id !== '';
        const participantId = hasParticipantId ? validId(req.body.participant_id) : null;
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const participant_type = req.body.participant_type;
        const college_id = validId(req.body.college_id);
        const entry_number = typeof req.body.entry_number === 'string'
            ? req.body.entry_number.trim()
            : String(req.body.entry_number || '').trim();

        if (!eventId) {
            return error(res, 'Event ID must be a positive integer', 400);
        }

        if (hasParticipantId && !participantId) {
            return error(res, 'participant_id must be a positive integer', 400);
        }

        if (!entry_number || entry_number.length > 30) {
            return error(res, 'entry_number is required and must not exceed 30 characters', 400);
        }

        let participantFields = null;

        if (!participantId) {
            if (!name || name.length > 120) {
                return error(res, 'Participant name is required and must not exceed 120 characters', 400);
            }

            if (!['candidate', 'college_team'].includes(participant_type)) {
                return error(res, "participant_type must be 'candidate' or 'college_team'", 400);
            }

            if (!college_id) {
                return error(res, 'A valid college_id is required', 400);
            }

            if (!(await Participant.collegeExists(college_id))) {
                return error(res, 'Invalid or inactive college_id', 400);
            }

            participantFields = { name, participant_type, college_id };
        }

        const registration = await EventParticipant.register(
            eventId,
            participantFields,
            entry_number,
            participantId
        );

        return success(
            res,
            registration,
            registration.participant_reused
                ? 'Existing participant registered for event'
                : 'New participant created and registered for event',
            201
        );
    } catch (e) {
        if (e.code === 'EVENT_NOT_FOUND') {
            return error(res, 'Event not found or inactive', 404);
        }

        if (e.code === 'PARTICIPANT_NOT_FOUND') {
            return error(res, 'Participant not found or inactive', 404);
        }

        if (e.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'This participant or entry number is already registered for the event',
                409
            );
        }

        if (e.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(res, 'The selected event or college does not exist', 400);
        }

        next(e);
    }
};

exports.removeRegistration = async (req, res, next) => {
    try {
        const eventId = validId(req.params.id);
        const registrationId = validId(req.params.registrationId);

        if (!eventId || !registrationId) {
            return error(
                res,
                'Event and registration IDs must be positive integers',
                400
            );
        }

        const affected = await EventParticipant.removeRegistration(
            eventId,
            registrationId
        );

        if (!affected) {
            return error(res, 'Registration not found', 404);
        }

        return success(res, null, 'Registration removed');
    } catch (e) {
        next(e);
    }
};