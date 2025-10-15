'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SingerUser extends Model {
    static associate(models) {
      if (models.SingerFavoriteSong) {
        SingerUser.hasMany(models.SingerFavoriteSong, {
          foreignKey: { name: 'singerId', field: 'singer_id', allowNull: false },
          sourceKey: 'id',
          as: 'favoriteSongs',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }

      if (models.SingerFavoriteVenue) {
        SingerUser.hasMany(models.SingerFavoriteVenue, {
          foreignKey: { name: 'singerId', field: 'singer_id', allowNull: false },
          sourceKey: 'id',
          as: 'favoriteVenues',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }

      if (models.SingerRequestHistory) {
        SingerUser.hasMany(models.SingerRequestHistory, {
          foreignKey: { name: 'singerId', field: 'singer_id', allowNull: false },
          sourceKey: 'id',
          as: 'requestHistory',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }

      if (models.Request) {
        SingerUser.hasMany(models.Request, {
          foreignKey: { name: 'singerId', field: 'singer_id', allowNull: true },
          sourceKey: 'id',
          as: 'requests',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }
    }
  }

  SingerUser.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'passwordhash',
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
      modelName: 'SingerUser',
      tableName: 'singer_users',
      schema: 'public',
      timestamps: true,
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      indexes: [
        { name: 'idx_singer_users_email', fields: ['email'] },
        { name: 'idx_singer_users_name', fields: ['name'] },
      ],
    }
  );

  return SingerUser;
};
