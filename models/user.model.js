'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Venue, {
        foreignKey: { name: 'userId', field: 'userid', allowNull: false },
        sourceKey: 'id',
        as: 'venues',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });

      if (models.SongDb) {
        User.hasMany(models.SongDb, {
          foreignKey: { name: 'userId', field: 'user_id', allowNull: false },
          sourceKey: 'id',
          as: 'songs',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        });
      }
    }
  }

  User.init(
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
      modelName: 'User',
      tableName: 'users',
      schema: 'public',
      timestamps: true,
      createdAt: 'createdat',
      updatedAt: 'updatedat',
      indexes: [
        { name: 'idx_users_email', fields: ['email'] },
        { name: 'idx_users_name', fields: ['name'] },
      ],
    }
  );

  return User;
};
