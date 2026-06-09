const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreditPayment = sequelize.define('CreditPayment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'customers', key: 'id' },
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'sales', key: 'id' },
  },
  amountPaid: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'credit_payments',
  timestamps: false,
});

module.exports = CreditPayment;
