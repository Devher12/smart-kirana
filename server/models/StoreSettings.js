const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StoreSettings = sequelize.define('StoreSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  storeName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    defaultValue: 'Smart Kirana',
  },
  ownerName: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  ownerEmail: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
}, {
  tableName: 'store_settings',
  timestamps: true,
});

module.exports = StoreSettings;
