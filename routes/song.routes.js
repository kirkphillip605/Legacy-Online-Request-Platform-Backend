// Filepath: routes/song.routes.js
'use strict';
const express = require('express');
const songController = require('../controllers/song.controller');

const router = express.Router();

// GET /api/songs/search?venueId=...&q=...&artist=...&title=...&page=...&size=...
router.get('/search', songController.searchSongs);

// GET /api/songs/artists?venueId=...&page=...&size=...
router.get('/artists', songController.listArtists);

// GET /api/songs/:songId?venueId=...
router.get('/:songId', songController.getSongById);

module.exports = router;
