
const criteria = require('../models/criteriaModel');
const { success, error } = require('../utils/response');

exports.list = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return error(res, 'Invalid event ID', 400);
        }

        const rows = await criteria.findAllByEvent(eventId);

        return success(res, rows, 'Criteria retrieved successfully');
    } catch (err) {
        console.error('List criteria error:', err);
        return error(res, 'Failed to retrieve criteria');
    }
};

exports.get = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid criterion ID', 400);
        }

        const row = await criteria.findById(id);

        if (!row) {
            return error(res, 'Criterion not found', 404);
        }

        return success(res, row, 'Criterion retrieved successfully');
    } catch (err) {
        console.error('Get criterion error:', err);
        return error(res, 'Failed to retrieve criterion');
    }
};

exports.create = async (req, res) => {
    try {
        const event_id = Number(req.body.event_id);
        const { name } = req.body;
        const weight = Number(req.body.weight);
        const max_score = Number(req.body.max_score);

        if (!Number.isInteger(event_id) || event_id <= 0) {
            return error(res, 'Invalid event ID', 400);
        }

        if (typeof name !== 'string' || !name.trim()) {
            return error(res, 'Criterion name is required', 400);
        }

        if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
            return error(res, 'Weight must be greater than 0 and at most 100', 400);
        }

        if (!Number.isFinite(max_score) || max_score <= 0) {
            return error(res, 'Maximum score must be greater than 0', 400);
        }

        const id = await criteria.create({
            event_id,
            name: name.trim(),
            weight,
            max_score
        });

        return success(
            res,
            { id },
            'Criterion created successfully',
            201
        );
    } catch (err) {
        console.error('Create criterion error:', err);
        return error(res, 'Failed to create criterion');
    }
};

exports.update = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return error(res, 'Invalid criterion ID', 400);
        }

        const existing = await criteria.findById(id);

        if (!existing) {
            return error(res, 'Criterion not found', 404);
        }

        const fields = {};

        if (req.body.name !== undefined) {
            if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
                return error(res, 'Criterion name cannot be empty', 400);
            }
            fields.name = req.body.name.trim();
        }

        if (req.body.weight !== undefined) {
            const weight = Number(req.body.weight);

            if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
                return error(res, 'Weight must be greater than 0 and at most 100', 400);
            }

            fields.weight = weight;
        }

        if (req.body.max_score !== undefined) {
            const max_score = Number(req.body.max_score);

            if (!Number.isFinite(max_score) || max_score <= 0) {
                return error(res, 'Maximum score must be greater than 0', 400);
            }

            fields.max_score = max_score;
        }

        if (!Object.keys(fields).length) {
            return error(res, 'No valid fields provided for update', 400);
        }

        const affectedRows = await criteria.update(id, fields);

        if (!affectedRows) {
            return error(res, 'No changes were made', 400);
        }

        return success(res, null, 'Criterion updated successfully');
    } catch (err) {
        console.error('Update criterion error:', err);
        return error(res, 'Failed to update criterion');
    }
};

exports.totalWeight = async (req, res) => {
    try {
        const eventId = Number(req.params.eventId);

        if (!Number.isInteger(eventId) || eventId <= 0) {
            return error(res, 'Invalid event ID', 400);
        }

        const total = await criteria.getTotalWeight(eventId);

        return success(
            res,
            {
                event_id: eventId,
                total_weight: total,
                is_valid: Math.abs(total - 100) < 0.000001
            },
            'Criteria weight total retrieved successfully'
        );
    } catch (err) {
        console.error('Total criteria weight error:', err);
        return error(res, 'Failed to calculate criteria weight');
    }
};