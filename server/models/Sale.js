const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'credit'),
    allowNull: false,
    defaultValue: 'cash',
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'customers', key: 'id' },
  },
  cashierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'sales',
  timestamps: true,
  updatedAt: false,
});

module.exports = Sale;
