const cron = require('node-cron');
const { Op } = require('sequelize');
const { Product, SaleItem, Sale } = require('../models');

const runReorderCheck = async () => {
  try {
    console.log('[Reorder Engine] Running daily check...');
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const products = await Product.findAll({ where: { isDeleted: false } });

    for (const product of products) {
      const saleItems = await SaleItem.findAll({
        where: { productId: product.id },
        include: [{
          model: Sale,
          as: 'sale',
          where: { createdAt: { [Op.gte]: fourteenDaysAgo } },
          attributes: [],
        }],
      });

      const totalSold = saleItems.reduce((sum, item) => sum + parseFloat(item.quantity), 0);
      const avgDailySales = totalSold / 14;
      const currentStock = parseFloat(product.currentStock);
      const minThreshold = parseFloat(product.minStockThreshold);

      let reorderAlert = false;
      if (avgDailySales > 0) {
        const daysOfStockLeft = currentStock / avgDailySales;
        if (daysOfStockLeft <= 2 && currentStock <= minThreshold) {
          reorderAlert = true;
        }
      } else if (currentStock <= minThreshold) {
        reorderAlert = true;
      }

      if (product.reorderAlert !== reorderAlert) {
        await product.update({ reorderAlert });
      }
    }

    console.log('[Reorder Engine] Check completed.');
  } catch (error) {
    console.error('[Reorder Engine] Error:', error.message);
  }
};

const startReorderCron = () => {
  cron.schedule('0 8 * * *', runReorderCheck);
  console.log('[Reorder Engine] Cron scheduled for 8:00 AM daily');
};

module.exports = { startReorderCron, runReorderCheck };
