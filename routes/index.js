// File: routes/index.js
'use strict';
const express = require('express');
const authRoutes = require('./auth.routes');
const patronAuthRoutes = require('./patron.auth.routes');
const songRoutes = require('./song.routes');
const requestRoutes = require('./request.routes');
const favoriteRoutes = require('./favorite.routes');
const publicVenuesRoutes = require('./public.venues.routes.js');

const router = express.Router();

// --- Public or Specific Auth Routes ---
router.use('/auth', authRoutes);
router.use('/patron/auth', patronAuthRoutes);
router.use('/songs', songRoutes);
router.use('/requests', requestRoutes);

// --- Patron Specific Routes (Patron JWT Auth) ---
const patronRouter = express.Router();
patronRouter.use('/favorites', favoriteRoutes);
router.use('/patron', patronRouter);

// --- Public Venues Route (No authentication required) ---
router.use('/public/venues', publicVenuesRoutes);

// --- Health check route ---
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

module.exports = router;
