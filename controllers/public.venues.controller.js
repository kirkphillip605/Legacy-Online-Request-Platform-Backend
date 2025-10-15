// File: controllers/public.venues.controller.js

const db = require('../models');
const { literal, where: sequelizeWhere } = require('sequelize');
const logger = require('../utils/logger');
const Venue = db.Venue;

const publicVenueController = {
  listVenues: async (req, res) => {
    try {
      const queryOptions = {
        where: {},
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['name', 'ASC']],
      };

      if (req.query.id) {
        queryOptions.where.id = req.query.id;
      }

      if (req.query.url_name || req.query.urlName) {
        queryOptions.where.urlName = req.query.url_name || req.query.urlName;
      }

      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      const distance = parseFloat(req.query.distance);

      if (!isNaN(lat) && !isNaN(lon) && !isNaN(distance)) {
        const distanceFormula = literal(
          `(6371 * acos( cos( radians(${lat}) ) * cos( radians(Venue.latitude) ) * cos( radians(Venue.longitude) - radians(${lon}) ) + sin( radians(${lat}) ) * sin( radians(Venue.latitude) ) ))`
        );
        queryOptions.attributes.include = [[distanceFormula, 'distance']];
        queryOptions.having = sequelizeWhere(distanceFormula, '<=', distance);
        queryOptions.order = [literal('distance ASC')];
      }

      const venues = await Venue.findAll(queryOptions);
      logger.debug('Public venue listing succeeded.', { query: req.query });
      return res.status(200).json({ error: false, venues });
    } catch (error) {
      logger.error('Error retrieving public venues.', {
        message: error.message,
        stack: error.stack,
        query: req.query,
      });
      return res.status(500).json({ error: true, errorString: 'Error retrieving venues.' });
    }
  }
};

module.exports = publicVenueController;
