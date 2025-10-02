// Filepath: controllers/song.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');
const SongDB = db.SongDB;
const { Op } = db.Sequelize;

// Helper for pagination
const getPagination = (page, size) => {
    const limit = size ? +size : 20; // Default limit 20
    const offset = page ? (page - 1) * limit : 0;
    return { limit, offset };
};

// Simple normalization helper for query inputs.
const normalizeInput = (str) => {
    if (!str) return '';
    // Convert to lowercase and remove punctuation
    return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
};

const songController = {
    searchSongs: async (req, res) => {
        const { q, artist, title, page = 1, size = 20 } = req.query;
        const { limit, offset } = getPagination(page, size);

        try {
            // If a general query term is provided, use fuzzy search via pg_trgm.
            if (q) {
                const normalizedQ = normalizeInput(q);
                // Build the base query using pg_trgm fuzzy matching on normalized_combined.
                let baseQuery = `
                    SELECT *
                    FROM songdb
                    WHERE normalized_combined % :normalizedQ
                `;
                const replacements = { normalizedQ };

                // Optionally add more conditions if specific artist and title filters are provided.
                if (artist) {
                    const normArtist = normalizeInput(artist);
                    baseQuery += ` AND lower(artist) LIKE :artistPattern`;
                    replacements.artistPattern = `%${normArtist}%`;
                }
                if (title) {
                    const normTitle = normalizeInput(title);
                    baseQuery += ` AND lower(title) LIKE :titlePattern`;
                    replacements.titlePattern = `%${normTitle}%`;
                }

                // Order by fuzzy similarity; pg_trgm’s similarity() function returns a value in [0,1].
                baseQuery += `
                    ORDER BY similarity(normalized_combined, :normalizedQ) DESC
                    LIMIT :limit OFFSET :offset
                `;
                replacements.limit = limit;
                replacements.offset = offset;

                const songs = await SongDB.sequelize.query(baseQuery, {
                    replacements,
                    type: SongDB.sequelize.QueryTypes.SELECT
                });

                // We need a separate count query for pagination metadata.
                let countQuery = `
                    SELECT count(*) as count
                    FROM songdb
                    WHERE normalized_combined % :normalizedQ
                `;
                if (artist) {
                    countQuery += ` AND lower(artist) LIKE :artistPattern`;
                }
                if (title) {
                    countQuery += ` AND lower(title) LIKE :titlePattern`;
                }
                const countResult = await SongDB.sequelize.query(countQuery, {
                    replacements,
                    type: SongDB.sequelize.QueryTypes.SELECT
                });
                const count = parseInt(countResult[0].count, 10);
                const currentPage = page ? +page : 1;
                const totalPages = Math.ceil(count / limit);

                logger.debug(`[Songs] Fuzzy search performed. Query: ${JSON.stringify(req.query)}, Found: ${count}`);
                return res.status(200).json({
                    error: false,
                    totalItems: count,
                    songs,
                    totalPages,
                    currentPage
                });
            } else {
                // If no general query is provided, fallback to standard filtering (for artist and/or title) using ILIKE.
                const whereClause = {};
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
                const { count, rows } = await SongDB.findAndCountAll({
                    where: whereClause,
                    limit,
                    offset,
                    order: [['artist', 'ASC'], ['title', 'ASC']],
                });
                const currentPage = page ? +page : 1;
                const totalPages = Math.ceil(count / limit);

                logger.debug(`[Songs] Standard search performed. Query: ${JSON.stringify(req.query)}, Found: ${count}`);
                return res.status(200).json({
                    error: false,
                    totalItems: count,
                    songs: rows,
                    totalPages,
                    currentPage
                });
            }
        } catch (error) {
            logger.error(`[Songs] Error searching songs:`, error);
            return res.status(500).json({ error: true, errorString: 'Error searching songs.' });
        }
    },

    getSongById: async (req, res) => {
        const { songId } = req.params;
        try {
            const song = await SongDB.findByPk(songId);
            if (!song) {
                return res.status(404).json({ error: true, errorString: 'Song not found.' });
            }
            logger.debug(`[Songs] Retrieved song ID: ${songId}`);
            return res.status(200).json({ error: false, song });
        } catch (error) {
            logger.error(`[Songs] Error getting song ${songId}:`, error);
            return res.status(500).json({ error: true, errorString: 'Error retrieving song.' });
        }
    },

    listArtists: async (req, res) => {
        const { page = 1, size = 100 } = req.query;
        const { limit, offset } = getPagination(page, size);
        try {
            const { count, rows } = await SongDB.findAndCountAll({
                attributes: ['artist'],
                group: ['artist'],
                order: [['artist', 'ASC']],
                limit,
                offset,
                raw: true
            });
            const totalItems = await SongDB.count({ distinct: true, col: 'artist' });
            const totalPages = Math.ceil(totalItems / limit);
            const currentPage = page ? +page : 1;

            logger.debug(`[Songs] Listed distinct artists. Page: ${currentPage}, Found: ${totalItems}`);
            return res.status(200).json({
                error: false,
                totalItems,
                artists: rows.map(r => r.artist),
                totalPages,
                currentPage
            });
        } catch (error) {
            logger.error(`[Songs] Error listing artists:`, error);
            return res.status(500).json({ error: true, errorString: 'Error retrieving artists.' });
        }
    }
};

module.exports = songController;