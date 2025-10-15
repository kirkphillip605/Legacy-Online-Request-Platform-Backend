// Filepath: routes/favorite.routes.js
'use strict';
const express = require('express');
const favoriteController = require('../controllers/favorite.controller');
const { verifySingerToken } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(verifySingerToken);

router.get('/', favoriteController.listFavorites);
router.post('/', favoriteController.addFavorite);
router.delete('/:favoriteId', favoriteController.removeFavorite);

module.exports = router;
