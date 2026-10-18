const Event = require('../models/eventModel');
const { success, error } = require('../utils/response');

const ALLOWED_STATUSES = [
    'scheduled',
    'ongoing',
    'completed',
    'cancelled'
];

function validId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeDateTime(value) {
    if (
        typeof value !== 'string' ||
        !value.trim() ||
        Number.isNaN(Date.parse(value))
    ) {
        return null;
    }

    let normalized = value.trim().replace('T', ' ');

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
        normalized += ':00';
    }

    return normalized.slice(0, 19);
}

async function validReferences(eventTypeId, venueId) {
    const eventTypeValid =
        await Event.eventTypeExists(eventTypeId);

    if (!eventTypeValid) {
        return {
            valid: false,
            message: 'Invalid event_type_id'
        };
    }

    const venueValid = await Event.venueExists(venueId);

    if (!venueValid) {
        return {
            valid: false,
            message: 'Invalid venue_id'
        };
    }

    return { valid: true };
}

exports.list = async (req, res, next) => {
    try {
        return success(res, await Event.findAll());
    } catch (e) {
        next(e);
    }
};

exports.get = async (req, res, next) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return error(
                res,
                'Event ID must be a positive integer',
                400
            );
        }

        const event = await Event.findById(id);

        if (!event) {
            return error(res, 'Event not found', 404);
        }

        return success(res, event);
    } catch (e) {
        next(e);
    }
};

exports.create = async (req, res, next) => {
    try {
        const event_name =
            typeof req.body.event_name === 'string'
                ? req.body.event_name.trim()
                : '';

        const event_type_id = validId(req.body.event_type_id);
        const venue_id = validId(req.body.venue_id);
        const event_date = normalizeDateTime(req.body.event_date);
        const status = req.body.status || 'scheduled';

        if (
            !event_name ||
            event_name.length > 100 ||
            !event_type_id ||
            !venue_id ||
            !event_date
        ) {
            return error(
                res,
                'event_name (max 100 characters), valid event_type_id, venue_id, and event_date are required',
                400
            );
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return error(
                res,
                `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
                400
            );
        }

        const references = await validReferences(
            event_type_id,
            venue_id
        );

        if (!references.valid) {
            return error(res, references.message, 400);
        }

        const id = await Event.create({
            event_name,
            event_type_id,
            venue_id,
            event_date,
            status
        });

        return success(
            res,
            await Event.findById(id),
            'Event created',
            201
        );
    } catch (e) {
        if (e.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'The selected event type or venue does not exist',
                400
            );
        }

        if (e.code === 'ER_DUP_ENTRY') {
            return error(
                res,
                'An event with conflicting unique data already exists',
                409
            );
        }

        next(e);
    }
};

exports.update = async (req, res, next) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return error(
                res,
                'Event ID must be a positive integer',
                400
            );
        }

        const current = await Event.findById(id);

        if (!current) {
            return error(res, 'Event not found', 404);
        }

        const fields = {};

        if (req.body.event_name !== undefined) {
            if (
                typeof req.body.event_name !== 'string' ||
                !req.body.event_name.trim() ||
                req.body.event_name.trim().length > 100
            ) {
                return error(
                    res,
                    'event_name must contain 1 to 100 characters',
                    400
                );
            }

            fields.event_name = req.body.event_name.trim();
        }

        if (req.body.event_type_id !== undefined) {
            fields.event_type_id =
                validId(req.body.event_type_id);

            if (!fields.event_type_id) {
                return error(
                    res,
                    'event_type_id must be a positive integer',
                    400
                );
            }
        }

        if (req.body.venue_id !== undefined) {
            fields.venue_id = validId(req.body.venue_id);

            if (!fields.venue_id) {
                return error(
                    res,
                    'venue_id must be a positive integer',
                    400
                );
            }
        }

        if (req.body.event_date !== undefined) {
            fields.event_date =
                normalizeDateTime(req.body.event_date);

            if (!fields.event_date) {
                return error(
                    res,
                    'event_date must be a valid date and time',
                    400
                );
            }
        }

        if (req.body.status !== undefined) {
            if (!ALLOWED_STATUSES.includes(req.body.status)) {
                return error(
                    res,
                    `status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
                    400
                );
            }

            fields.status = req.body.status;
        }

        if (!Object.keys(fields).length) {
            return error(res, 'Nothing to update', 400);
        }

        const eventTypeId =
            fields.event_type_id !== undefined
                ? fields.event_type_id
                : current.event_type_id;

        const venueId =
            fields.venue_id !== undefined
                ? fields.venue_id
                : current.venue_id;

        const references = await validReferences(
            eventTypeId,
            venueId
        );

        if (!references.valid) {
            return error(res, references.message, 400);
        }

        await Event.update(id, fields);

        return success(
            res,
            await Event.findById(id),
            'Event updated'
        );
    } catch (e) {
        if (e.code === 'ER_NO_REFERENCED_ROW_2') {
            return error(
                res,
                'The selected event type or venue does not exist',
                400
            );
        }

        next(e);
    }
};

exports.remove = async (req, res, next) => {
    try {
        const id = validId(req.params.id);

        if (!id) {
            return error(
                res,
                'Event ID must be a positive integer',
                400
            );
        }

        const affected = await Event.softDelete(id);

        if (!affected) {
            return error(res, 'Event not found', 404);
        }

        return success(res, null, 'Event deactivated');
    } catch (e) {
        next(e);
    }
};