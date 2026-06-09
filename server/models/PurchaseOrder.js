const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'suppliers', key: 'id' },
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'products', key: 'id' },
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  costPerUnit: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  orderedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'purchase_orders',
  timestamps: false,
});

module.exports = PurchaseOrder;
