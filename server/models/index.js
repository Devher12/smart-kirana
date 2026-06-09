const sequelize = require('../config/database');
const User = require('./User');
const Supplier = require('./Supplier');
const Product = require('./Product');
const Customer = require('./Customer');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const CreditPayment = require('./CreditPayment');
const PurchaseOrder = require('./PurchaseOrder');
const StoreSettings = require('./StoreSettings');

// User associations
User.hasMany(Sale, { foreignKey: 'cashierId', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'cashierId', as: 'cashier' });

// Supplier associations
Supplier.hasMany(Product, { foreignKey: 'supplierId', as: 'products' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId', as: 'supplier' });

// Product associations
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(PurchaseOrder, { foreignKey: 'productId', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Customer associations
Customer.hasMany(Sale, { foreignKey: 'customerId', as: 'sales' });
Sale.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(CreditPayment, { foreignKey: 'customerId', as: 'payments' });
CreditPayment.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Sale associations
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
Sale.hasMany(CreditPayment, { foreignKey: 'saleId', as: 'creditPayments' });
CreditPayment.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });

module.exports = {
  sequelize,
  User,
  Supplier,
  Product,
  Customer,
  Sale,
  SaleItem,
  CreditPayment,
  PurchaseOrder,
  StoreSettings,
};
