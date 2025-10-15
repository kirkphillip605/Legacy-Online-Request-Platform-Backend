'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    static associate(models) {
      Request.belongsTo(models.Venue, {
        foreignKey: { name: 'venueId', field: 'venueid', allowNull: false },
        targetKey: 'id',
        as: 'venue',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      if (models.SingerUser) {
        Request.belongsTo(models.SingerUser, {
          foreignKey: { name: 'singerId', field: 'singer_id', allowNull: true },
          targetKey: 'id',
          as: 'singerUser',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }
    }
  }

  Request.init(
    {
      requestId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        field: 'request_id',
      },
      venueId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'venueid',
      },
      artist: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      singer: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      keyChange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'key_change',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('now()'),
        field: 'createdat',
      },
      processed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      singerId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'singer_id',
      },
      requestTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('now()'),
        field: 'request_time',
      },
    },
    {
      sequelize,
      modelName: 'Request',
      tableName: 'requests',
      schema: 'public',
      timestamps: false,
      indexes: [],
    }
  );

  return Request;
};
