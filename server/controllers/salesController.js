const { Op, fn, col, literal } = require('sequelize');
const {
  sequelize,
  Sale,
  SaleItem,
  Product,
  Customer,
  User,
} = require('../models');

const generateInvoiceNumber = async (transaction) => {
  const today = new Date();
  const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await Sale.count({
    where: { invoiceNumber: { [Op.like]: `${prefix}%` } },
    transaction,
  });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

const createSale = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, discount = 0, paymentMethod, customerId } = req.body;

    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Sale must have at least one item' });
    }

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, isDeleted: false },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      const qty = parseFloat(item.quantity);
      if (qty <= 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Quantity must be positive' });
      }

      if (parseFloat(product.currentStock) < qty) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}. Available: ${product.currentStock}`,
        });
      }

      const unitPrice = parseFloat(item.unitPrice || product.sellingPrice);
      const itemSubtotal = qty * unitPrice;
      subtotal += itemSubtotal;

      saleItems.push({ product, qty, unitPrice, itemSubtotal });
    }

    const discountAmount = parseFloat(discount) || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);

    if (paymentMethod === 'credit') {
      if (!customerId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Customer required for credit sales' });
      }
      const customer = await Customer.findByPk(customerId, { transaction });
      if (!customer) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Customer not found' });
      }
    }

    const invoiceNumber = await generateInvoiceNumber(transaction);

    const sale = await Sale.create(
      {
        invoiceNumber,
        totalAmount,
        discount: discountAmount,
        paymentMethod: paymentMethod || 'cash',
        customerId: customerId || null,
        cashierId: req.user.id,
      },
      { transaction }
    );

    for (const { product, qty, unitPrice, itemSubtotal } of saleItems) {
      await SaleItem.create(
        {
          saleId: sale.id,
          productId: product.id,
          quantity: qty,
          unitPrice,
          subtotal: itemSubtotal,
        },
        { transaction }
      );

      await product.update(
        { currentStock: parseFloat(product.currentStock) - qty },
        { transaction }
      );
    }

    if (paymentMethod === 'credit' && customerId) {
      const customer = await Customer.findByPk(customerId, { transaction });
      await customer.update(
        { totalCredit: parseFloat(customer.totalCredit) + totalAmount },
        { transaction }
      );
    }

    await transaction.commit();

    const fullSale = await Sale.findByPk(sale.id, {
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Customer, as: 'customer' },
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
      ],
    });

    res.status(201).json(fullSale);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const where = {};

    if (req.query.startDate && req.query.endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(req.query.startDate),
          new Date(req.query.endDate + 'T23:59:59'),
        ],
      };
    }

    const { count, rows } = await Sale.findAndCountAll({
      where,
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }] },
        { model: Customer, as: 'customer', attributes: ['id', 'name'] },
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const totalAmount = await Sale.sum('totalAmount', { where }) || 0;

    res.json({
      sales: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
      summary: { totalAmount, count },
    });
  } catch (error) {
    next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        { model: SaleItem, as: 'items', include: [{ model: Product, as: 'product' }] },
        { model: Customer, as: 'customer' },
        { model: User, as: 'cashier', attributes: ['id', 'name'] },
      ],
    });

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    next(error);
  }
};

const getDailySummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.findAll({
      where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } },
      include: [{ model: SaleItem, as: 'items' }],
    });

    const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0);
    const itemsSold = sales.reduce(
      (sum, s) => sum + s.items.reduce((is, i) => is + parseFloat(i.quantity), 0),
      0
    );

    const topProducts = await SaleItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('quantity')), 'totalQty'],
        [fn('SUM', col('subtotal')), 'revenue'],
      ],
      include: [
        {
          model: Sale,
          as: 'sale',
          attributes: [],
          where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } },
        },
        { model: Product, as: 'product', attributes: ['name'] },
      ],
      group: ['productId', 'product.id', 'product.name'],
      order: [[literal('revenue'), 'DESC']],
      limit: 5,
      raw: false,
    });

    res.json({
      totalSales,
      transactionCount: sales.length,
      itemsSold,
      topProducts: topProducts.map((p) => ({
        name: p.product?.name,
        sold: parseFloat(p.get('totalQty')),
        revenue: parseFloat(p.get('revenue')),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getWeeklySummary = async (req, res, next) => {
  try {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const revenue = await Sale.sum('totalAmount', {
        where: { createdAt: { [Op.gte]: date, [Op.lt]: nextDay } },
      }) || 0;

      days.push({
        day: date.toISOString().split('T')[0],
        revenue: parseFloat(revenue),
      });
    }

    res.json(days);
  } catch (error) {
    next(error);
  }
};

const getMonthlySummary = async (req, res, next) => {
  try {
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const end = new Date();
      end.setDate(end.getDate() - w * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      const revenue = await Sale.sum('totalAmount', {
        where: { createdAt: { [Op.gte]: start, [Op.lte]: end } },
      }) || 0;

      weeks.push({
        week: `Week ${4 - w}`,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        revenue: parseFloat(revenue),
      });
    }

    res.json(weeks);
  } catch (error) {
    next(error);
  }
};

const getTopProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const where = {};
    if (req.query.startDate && req.query.endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(req.query.startDate),
          new Date(req.query.endDate + 'T23:59:59'),
        ],
      };
    }

    const topProducts = await SaleItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('quantity')), 'totalQty'],
        [fn('SUM', col('subtotal')), 'revenue'],
      ],
      include: [
        { model: Sale, as: 'sale', attributes: [], where: Object.keys(where).length ? where : undefined },
        { model: Product, as: 'product', attributes: ['name', 'category'] },
      ],
      group: ['productId', 'product.id', 'product.name', 'product.category'],
      order: [[literal('revenue'), 'DESC']],
      limit,
      raw: false,
    });

    res.json(
      topProducts.map((p) => ({
        name: p.product?.name,
        category: p.product?.category,
        sold: parseFloat(p.get('totalQty')),
        revenue: parseFloat(p.get('revenue')),
      }))
    );
  } catch (error) {
    next(error);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.startDate && req.query.endDate) {
      where.createdAt = {
        [Op.between]: [
          new Date(req.query.startDate),
          new Date(req.query.endDate + 'T23:59:59'),
        ],
      };
    }

    const items = await SaleItem.findAll({
      attributes: [[fn('SUM', col('subtotal')), 'revenue']],
      include: [
        { model: Sale, as: 'sale', attributes: [], where: Object.keys(where).length ? where : undefined },
        { model: Product, as: 'product', attributes: ['category'] },
      ],
      group: ['product.category', 'product.id'],
      raw: false,
    });

    const categoryMap = {};
    items.forEach((item) => {
      const cat = item.product?.category || 'Other';
      const rev = parseFloat(item.get('revenue'));
      categoryMap[cat] = (categoryMap[cat] || 0) + rev;
    });

    res.json(
      Object.entries(categoryMap).map(([category, revenue]) => ({ category, revenue }))
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary,
  getTopProducts,
  getCategoryBreakdown,
};
