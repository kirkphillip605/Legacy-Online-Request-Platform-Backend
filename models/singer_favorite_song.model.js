'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SingerFavoriteSong extends Model {
    static associate(models) {
      if (models.SingerUser) {
        SingerFavoriteSong.belongsTo(models.SingerUser, {
          foreignKey: { name: 'singerId', field: 'singer_id', allowNull: false },
          targetKey: 'id',
          as: 'singer',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }
    }
  }

  SingerFavoriteSong.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
      },
      singerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'singer_id',
      },
      artist: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      keyChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'key_change',
      },
    },
    {
      sequelize,
      modelName: 'SingerFavoriteSong',
      tableName: 'singer_favorite_songs',
      schema: 'public',
      timestamps: false,
    }
  );

  return SingerFavoriteSong;
};
