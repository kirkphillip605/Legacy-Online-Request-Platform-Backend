'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Venue extends Model {
    static associate(models) {
      Venue.belongsTo(models.User, {
        foreignKey: { name: 'userId', field: 'userid', allowNull: false },
        targetKey: 'id',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      Venue.hasMany(models.Request, {
        foreignKey: { name: 'venueId', field: 'venueid', allowNull: false },
        sourceKey: 'id',
        as: 'requests',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      if (models.SingerFavoriteVenue) {
        Venue.hasMany(models.SingerFavoriteVenue, {
          foreignKey: { name: 'venueId', field: 'venue_id', allowNull: false },
          sourceKey: 'id',
          as: 'singerFavoriteVenues',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }

      if (models.SingerRequestHistory) {
        Venue.hasMany(models.SingerRequestHistory, {
          foreignKey: { name: 'venueId', field: 'venue_id', allowNull: false },
          sourceKey: 'id',
          as: 'singerRequestHistory',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }
    }
  }

  Venue.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'userid',
      },
      openKjVenueId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'openkj_venue_id',
        autoIncrement: true,
      },
      urlName: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'urlname',
      },
      acceptingRequests: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'acceptingrequests',
      },
      accepting: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      hereplaceid: {
        type: DataTypes.STRING,
        unique: 'idx_venues_hereplaceid',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: { type: DataTypes.STRING },
      city: { type: DataTypes.STRING },
      state: { type: DataTypes.STRING },
      stateCode: {
        type: DataTypes.STRING(5),
        field: 'statecode',
      },
      postalCode: {
        type: DataTypes.STRING,
        field: 'postalcode',
      },
      country: { type: DataTypes.STRING },
      countryCode: {
        type: DataTypes.STRING(3),
        field: 'countrycode',
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        field: 'phonenumber',
      },
      website: { type: DataTypes.STRING },
      latitude: { type: DataTypes.FLOAT },
      longitude: { type: DataTypes.FLOAT },
      currentSystemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: 'current_system_id',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('now()'),
        field: 'createdat',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('now()'),
        field: 'updatedat',
      },
    },
    {
      sequelize,
      modelName: 'Venue',
      tableName: 'venues',
      schema: 'public',
      timestamps: true,
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      indexes: [
        {
          name: 'venues_userid_name_address_key',
          unique: true,
          fields: [{ name: 'userid' }, { name: 'name' }, { name: 'address' }],
        },
        {
          name: 'venues_userid_urlname_key',
          unique: true,
          fields: [{ name: 'userid' }, { name: 'urlname' }],
        },
        {
          name: 'venues_userid_openkj_venue_id_key',
          unique: true,
          fields: [{ name: 'userid' }, { name: 'openkj_venue_id' }],
        },
        { name: 'idx_venues_hereplaceid', unique: true, fields: ['hereplaceid'] },
        { name: 'idx_venues_userid', fields: ['userid'] },
        { name: 'idx_venues_user_urlname', fields: ['userid', 'urlname'] },
        { name: 'idx_venues_user_openkj_id', fields: ['userid', 'openkj_venue_id'] },
        { name: 'idx_venues_address', fields: ['address'] },
        { name: 'idx_venues_name', fields: ['name'] },
        { name: 'idx_venues_city', fields: ['city'] },
        { name: 'idx_venues_location_brin', fields: ['latitude', 'longitude'], using: 'BRIN' },
        { name: 'idx_venues_region', fields: ['countrycode', 'statecode', 'city'] },
      ],
    }
  );

  return Venue;
};
