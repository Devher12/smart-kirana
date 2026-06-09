const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
  },
  unit: {
    type: DataTypes.ENUM('kg', 'pcs', 'ltr'),
    allowNull: false,
    defaultValue: 'pcs',
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  currentStock: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  minStockThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 5,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'suppliers', key: 'id' },
  },
  reorderAlert: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'products',
  timestamps: true,
  updatedAt: false,
});

module.exports = Product;
