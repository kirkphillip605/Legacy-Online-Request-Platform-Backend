// Filepath: controllers/favorite.controller.js
'use strict';
const db = require('../models');
const logger = require('../utils/logger');

const SingerFavoriteSong = db.SingerFavoriteSong;

const favoriteController = {
    listFavorites: async (req, res) => {
        const singerId = req.auth.singerId;

        try {
            const favorites = await SingerFavoriteSong.findAll({
                where: { singerId },
                order: [
                    ['artist', 'ASC'],
                    ['title', 'ASC'],
                ],
            });

            logger.debug(`[Favorites] Singer ${singerId} listed their favorites.`);
            res.status(200).json({ error: false, favorites });
        } catch (error) {
            logger.error(`[Favorites] Error listing favorites for Singer ${singerId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error retrieving favorites.' });
        }
    },

    addFavorite: async (req, res) => {
        const singerId = req.auth.singerId;
        const { artist, title, keyChange = 0 } = req.body;

        if (!artist || !title) {
            return res.status(400).json({ error: true, errorString: 'Artist and title are required.' });
        }

        try {
            const [favorite, created] = await SingerFavoriteSong.findOrCreate({
                where: {
                    singerId,
                    artist: artist.trim(),
                    title: title.trim(),
                    keyChange: parseInt(keyChange, 10) || 0,
                },
                defaults: {
                    singerId,
                    artist: artist.trim(),
                    title: title.trim(),
                    keyChange: parseInt(keyChange, 10) || 0,
                },
            });

            if (created) {
                logger.info(`[Favorites] Singer ${singerId} added favorite ${favorite.id}.`);
                return res.status(201).json({ error: false, message: 'Favorite created.', favorite });
            }

            logger.debug(`[Favorites] Singer ${singerId} attempted to add duplicate favorite.`);
            return res.status(200).json({ error: false, message: 'Favorite already exists.', favorite });
        } catch (error) {
            logger.error(`[Favorites] Error adding favorite for Singer ${singerId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error adding favorite.' });
        }
    },

    removeFavorite: async (req, res) => {
        const singerId = req.auth.singerId;
        const { favoriteId } = req.params;

        if (!favoriteId) {
            return res.status(400).json({ error: true, errorString: 'Favorite ID parameter is required.' });
        }

        try {
            const result = await SingerFavoriteSong.destroy({
                where: {
                    id: favoriteId,
                    singerId,
                },
            });

            if (result > 0) {
                logger.info(`[Favorites] Singer ${singerId} removed favorite ${favoriteId}.`);
                return res.status(204).send();
            }

            logger.warn(`[Favorites] Singer ${singerId} attempted to remove non-existent favorite ${favoriteId}.`);
            return res.status(404).json({ error: true, errorString: 'Favorite not found for this singer.' });
        } catch (error) {
            logger.error(`[Favorites] Error removing favorite ${favoriteId} for Singer ${singerId}:`, error);
            res.status(500).json({ error: true, errorString: 'Error removing favorite.' });
        }
    },
};

module.exports = favoriteController;
