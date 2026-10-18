const Event = require('../models/eventModel');
const Participant = require('../models/participantModel');
const EventParticipant = require('../models/eventParticipantModel');
const { success, error } = require('../utils/response');

function validId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
}

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

        const name =
            typeof req.body.name === 'string'
                ? req.body.name.trim()
                : '';

        const participant_type = req.body.participant_type;
        const college_id = validId(req.body.college_id);

        const entry_number =
            typeof req.body.entry_number === 'string'
                ? req.body.entry_number.trim()
                : String(req.body.entry_number || '').trim();

        if (!eventId) {
            return error(
                res,
                'Event ID must be a positive integer',
                400
            );
        }

        if (!name || name.length > 120) {
            return error(
                res,
                'Participant name is required and must not exceed 120 characters',
                400
            );
        }

        if (!['candidate', 'college_team'].includes(participant_type)) {
            return error(
                res,
                "participant_type must be 'candidate' or 'college_team'",
                400
            );
        }

        if (!college_id) {
            return error(res, 'A valid college_id is required', 400);
        }

        if (!entry_number || entry_number.length > 30) {
            return error(
                res,
                'entry_number is required and must not exceed 30 characters',
                400
            );
        }

        if (!(await Participant.collegeExists(college_id))) {
            return error(res, 'Invalid college_id', 400);
        }

        const registration = await EventParticipant.register(
            eventId,
            {
                name,
                participant_type,
                college_id
            },
            entry_number
        );

        return success(
            res,
            registration,
            'Participant registered for event',
            201
        );
    } catch (e) {
        if (e.code === 'EVENT_NOT_FOUND') {
            return error(res, 'Event not found or inactive', 404);
        }

        if (e.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'This participant or entry number is already registered for the event',
                409
            );
        }

        if (e.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'The selected event or college does not exist',
                400
            );
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