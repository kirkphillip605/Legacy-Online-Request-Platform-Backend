'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SongDb extends Model {
    static associate(models) {
      SongDb.belongsTo(models.User, {
        foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
        targetKey: 'id',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  SongDb.init(
    {
      songId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        field: 'song_id',
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      openKjSystemId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'openkj_system_id',
      },
      artist: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      combined: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      normalizedCombined: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'normalized_combined',
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
      modelName: 'SongDb',
      tableName: 'songdb',
      schema: 'public',
      timestamps: true,
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      indexes: [
        {
          name: 'songdb_user_id_system_id_combined_key',
          unique: true,
          fields: [{ name: 'user_id' }, { name: 'openkj_system_id' }, { name: 'combined' }],
        },
        {
          name: 'songdb_user_id_system_id_normalized_combined_key',
          unique: true,
          fields: [
            { name: 'user_id' },
            { name: 'openkj_system_id' },
            { name: 'normalized_combined' },
          ],
        },
        {
          name: 'idx_songdb_user_system_artist',
          fields: [{ name: 'user_id' }, { name: 'openkj_system_id' }, { name: 'artist' }],
        },
        {
          name: 'idx_songdb_user_system_title',
          fields: [{ name: 'user_id' }, { name: 'openkj_system_id' }, { name: 'title' }],
        },
        {
          name: 'idx_songdb_user_system_normcombined',
          fields: [
            { name: 'user_id' },
            { name: 'openkj_system_id' },
            { name: 'normalized_combined' },
          ],
        },
      ],
    }
  );

  return SongDb;
};
