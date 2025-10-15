// Filepath: controllers/request.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');

const Request = db.Request;
const Venue = db.Venue;
const SingerUser = db.SingerUser;

const updateSerial = async () => {
    try {
        const state = await db.State.findOne();
        if (!state) {
            await db.ensureStateRow();
            const newState = await db.State.findOne();
            if (newState) {
                await newState.increment('serial', { by: 1 });
                const updated = await db.State.findOne();
                return updated ? updated.serial : 1;
            }
            return 0;
        }
        await state.increment('serial', { by: 1 });
        const updatedState = await db.State.findOne();
        return updatedState ? updatedState.serial : state.serial + 1;
    } catch (error) {
        logger.error('Failed to update serial:', error);
        const currentState = await db.State.findOne();
        return currentState ? currentState.serial + 1 : 0;
    }
};

const requestController = {
    submitRequest: async (req, res) => {
        const venueId = req.body.venueId || req.body.venue_id;
        const artist = req.body.artist;
        const title = req.body.title;
        const singerName = req.body.singerName || req.body.singer_name;
        const keyChange = req.body.keyChange ?? req.body.key_change ?? 0;
        const singerId = req.body.singerId || req.body.singer_id || null;

        if (!venueId || !artist || !title || !singerName) {
            return res.status(400).json({
                error: true,
                errorString: 'Venue ID, artist, title, and singer name are required.',
            });
        }

        try {
            const venue = await Venue.findByPk(venueId);
            if (!venue) {
                return res.status(404).json({ error: true, errorString: `Venue with ID ${venueId} not found.` });
            }
            if (!venue.accepting) {
                logger.warn(`[Requests] Request submitted to non-accepting venue: ${venueId} by ${singerName}`);
                return res.status(403).json({
                    error: true,
                    errorString: `Venue "${venue.name}" is not currently accepting requests.`,
                });
            }

            let resolvedSingerId = singerId;
            if (resolvedSingerId) {
                const singer = await SingerUser.findByPk(resolvedSingerId);
                if (!singer) {
                    return res.status(400).json({ error: true, errorString: 'Invalid singerId provided.' });
                }
            }

            const newRequest = await Request.create({
                venueId,
                artist: artist.trim(),
                title: title.trim(),
                singer: singerName.trim(),
                keyChange: parseInt(keyChange, 10) || 0,
                singerId: resolvedSingerId,
            });

            await updateSerial();

            logger.info(
                `[Requests] New request submitted by ${singerName} at venue ${venueId}. Request ID: ${newRequest.requestId}`
            );
            res.status(201).json({ error: false, message: 'Request submitted successfully!', request: newRequest });
        } catch (error) {
            if (error instanceof db.Sequelize.ValidationError) {
                logger.warn('[Requests] Validation error submitting request:', error.errors);
                return res.status(400).json({
                    error: true,
                    errorString: 'Validation failed',
                    details: error.errors.map(e => e.message),
                });
            }
            logger.error('[Requests] Error submitting request:', error);
            res.status(500).json({ error: true, errorString: 'Error submitting request.' });
        }
    },
};

module.exports = requestController;
