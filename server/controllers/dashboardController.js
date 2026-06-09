const { Op, fn, col, literal } = require('sequelize');
const {
  Sale,
  SaleItem,
  Product,
  Customer,
  User,
} = require('../models');

const getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = await Sale.sum('totalAmount', {
      where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } },
    }) || 0;

    const todayTransactions = await Sale.count({
      where: { createdAt: { [Op.gte]: today, [Op.lt]: tomorrow } },
    });

    const products = await Product.findAll({ where: { isDeleted: false } });
    const lowStockCount = products.filter(
      (p) => parseFloat(p.currentStock) <= parseFloat(p.minStockThreshold) || p.reorderAlert
    ).length;

    const customers = await Customer.findAll();
    const pendingCreditTotal = customers.reduce(
      (sum, c) => sum + Math.max(0, parseFloat(c.totalCredit) - parseFloat(c.totalPaid)),
      0
    );

    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const expiringProductsCount = products.filter(
      (p) => p.expiryDate && p.expiryDate <= sevenDays.toISOString().split('T')[0] && p.expiryDate >= todayStr
    ).length;

    const weeklyRevenueChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const revenue = await Sale.sum('totalAmount', {
        where: { createdAt: { [Op.gte]: date, [Op.lt]: nextDay } },
      }) || 0;

      weeklyRevenueChart.push({
        day: date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        revenue: parseFloat(revenue),
      });
    }

    const topProductsRaw = await SaleItem.findAll({
      attributes: [
        'productId',
        [fn('SUM', col('quantity')), 'sold'],
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

    const topProducts = topProductsRaw.map((p) => ({
      name: p.product?.name || 'Unknown',
      sold: parseFloat(p.get('sold')),
      revenue: parseFloat(p.get('revenue')),
    }));

    const lowStockProducts = products
      .filter((p) => parseFloat(p.currentStock) <= parseFloat(p.minStockThreshold) || p.reorderAlert)
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        currentStock: parseFloat(p.currentStock),
        minStockThreshold: parseFloat(p.minStockThreshold),
        reorderAlert: p.reorderAlert,
      }));

    const expiringProducts = products
      .filter((p) => p.expiryDate && p.expiryDate <= sevenDays.toISOString().split('T')[0] && p.expiryDate >= todayStr)
      .slice(0, 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        expiryDate: p.expiryDate,
        currentStock: parseFloat(p.currentStock),
      }));

    res.json({
      todaySales: parseFloat(todaySales),
      todayTransactions,
      lowStockCount,
      pendingCreditTotal,
      expiringProductsCount,
      weeklyRevenueChart,
      topProducts,
      lowStockProducts,
      expiringProducts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
