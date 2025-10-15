// Filepath: controllers/song.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');

const SongDb = db.SongDb;
const Venue = db.Venue;
const { Op } = db.Sequelize;

const getPagination = (page, size) => {
    const limit = size ? +size : 20;
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
};

const normalizeInput = str => {
    if (!str) return '';
    return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
};

const resolveVenueContext = async venueId => {
    const venue = await Venue.findByPk(venueId);
    if (!venue) {
        return null;
    }
    return {
        venue,
        userId: venue.userId,
        openKjSystemId: venue.currentSystemId,
    };
};

const songController = {
    searchSongs: async (req, res) => {
        const { q, artist, title, page = 1, size = 20 } = req.query;
        const venueId = req.query.venueId || req.query.venue_id;

        if (!venueId) {
            return res.status(400).json({ error: true, errorString: 'venueId is required.' });
        }

        const venueContext = await resolveVenueContext(venueId);
        if (!venueContext) {
            return res.status(404).json({ error: true, errorString: `Venue with ID ${venueId} not found.` });
        }

        const { limit, offset } = getPagination(page, size);
        const { userId, openKjSystemId } = venueContext;

        try {
            if (q) {
                const normalizedQ = normalizeInput(q);
                let baseQuery = `
                    SELECT *
                    FROM songdb
                    WHERE user_id = :userId
                      AND openkj_system_id = :openKjSystemId
                      AND normalized_combined % :normalizedQ
                `;
                const replacements = { normalizedQ, userId, openKjSystemId };

                if (artist) {
                    const normArtist = normalizeInput(artist);
                    baseQuery += ' AND lower(artist) LIKE :artistPattern';
                    replacements.artistPattern = `%${normArtist}%`;
                }
                if (title) {
                    const normTitle = normalizeInput(title);
                    baseQuery += ' AND lower(title) LIKE :titlePattern';
                    replacements.titlePattern = `%${normTitle}%`;
                }

                baseQuery += `
                    ORDER BY similarity(normalized_combined, :normalizedQ) DESC
                    LIMIT :limit OFFSET :offset
                `;
                replacements.limit = limit;
                replacements.offset = offset;

                const songs = await SongDb.sequelize.query(baseQuery, {
                    replacements,
                    type: SongDb.sequelize.QueryTypes.SELECT,
                });

                let countQuery = `
                    SELECT count(*) as count
                    FROM songdb
                    WHERE user_id = :userId
                      AND openkj_system_id = :openKjSystemId
                      AND normalized_combined % :normalizedQ
                `;
                if (artist) {
                    countQuery += ' AND lower(artist) LIKE :artistPattern';
                }
                if (title) {
                    countQuery += ' AND lower(title) LIKE :titlePattern';
                }

                const countResult = await SongDb.sequelize.query(countQuery, {
                    replacements,
                    type: SongDb.sequelize.QueryTypes.SELECT,
                });
                const count = parseInt(countResult[0].count, 10);
                const currentPage = page ? +page : 1;
                const totalPages = Math.ceil(count / limit);

                logger.debug(
                    `[Songs] Fuzzy search performed for venue ${venueId}. Query: ${JSON.stringify(req.query)}, Found: ${count}`
                );
                return res.status(200).json({
                    error: false,
                    totalItems: count,
                    songs,
                    totalPages,
                    currentPage,
                });
            }

            const whereClause = {
                userId,
                openKjSystemId,
            };
            const searchClauses = [];
            if (artist) {
                searchClauses.push({ artist: { [Op.iLike]: `%${artist}%` } });
            }
            if (title) {
                searchClauses.push({ title: { [Op.iLike]: `%${title}%` } });
            }
            if (searchClauses.length > 0) {
                whereClause[Op.and] = searchClauses;
            }

            const { count, rows } = await SongDb.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [
                    ['artist', 'ASC'],
                    ['title', 'ASC'],
                ],
            });
            const currentPage = page ? +page : 1;
            const totalPages = Math.ceil(count / limit);

            logger.debug(
                `[Songs] Standard search performed for venue ${venueId}. Query: ${JSON.stringify(req.query)}, Found: ${count}`
            );
            return res.status(200).json({
                error: false,
                totalItems: count,
                songs: rows,
                totalPages,
                currentPage,
            });
        } catch (error) {
            logger.error('[Songs] Error searching songs:', error);
            return res.status(500).json({ error: true, errorString: 'Error searching songs.' });
        }
    },

    getSongById: async (req, res) => {
        const { songId } = req.params;
        const venueId = req.query.venueId || req.query.venue_id;

        if (!venueId) {
            return res.status(400).json({ error: true, errorString: 'venueId is required.' });
        }

        const venueContext = await resolveVenueContext(venueId);
        if (!venueContext) {
            return res.status(404).json({ error: true, errorString: `Venue with ID ${venueId} not found.` });
        }

        try {
            const song = await SongDb.findOne({
                where: {
                    songId,
                    userId: venueContext.userId,
                    openKjSystemId: venueContext.openKjSystemId,
                },
            });
            if (!song) {
                return res.status(404).json({ error: true, errorString: 'Song not found.' });
            }
            logger.debug(`[Songs] Retrieved song ID: ${songId} for venue ${venueId}`);
            return res.status(200).json({ error: false, song });
        } catch (error) {
            logger.error(`[Songs] Error getting song ${songId}:`, error);
            return res.status(500).json({ error: true, errorString: 'Error retrieving song.' });
        }
    },

    listArtists: async (req, res) => {
        const { page = 1, size = 100 } = req.query;
        const venueId = req.query.venueId || req.query.venue_id;

        if (!venueId) {
            return res.status(400).json({ error: true, errorString: 'venueId is required.' });
        }

        const venueContext = await resolveVenueContext(venueId);
        if (!venueContext) {
            return res.status(404).json({ error: true, errorString: `Venue with ID ${venueId} not found.` });
        }

        const { limit, offset } = getPagination(page, size);

        try {
            const { count, rows } = await SongDb.findAndCountAll({
                attributes: ['artist'],
                where: {
                    userId: venueContext.userId,
                    openKjSystemId: venueContext.openKjSystemId,
                },
                group: ['artist'],
                order: [['artist', 'ASC']],
                limit,
                offset,
                raw: true,
            });
            const totalItems = await SongDb.count({
                distinct: true,
                col: 'artist',
                where: {
                    userId: venueContext.userId,
                    openKjSystemId: venueContext.openKjSystemId,
                },
            });
            const totalPages = Math.ceil(totalItems / limit);
            const currentPage = page ? +page : 1;

            logger.debug(`[Songs] Listed distinct artists for venue ${venueId}. Page: ${currentPage}, Found: ${totalItems}`);
            return res.status(200).json({
                error: false,
                totalItems,
                artists: rows.map(r => r.artist),
                totalPages,
                currentPage,
            });
        } catch (error) {
            logger.error('[Songs] Error listing artists:', error);
            return res.status(500).json({ error: true, errorString: 'Error retrieving artists.' });
        }
    },
};

module.exports = songController;
