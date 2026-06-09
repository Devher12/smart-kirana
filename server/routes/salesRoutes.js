const express = require('express');
const {
  createSale,
  getSales,
  getSaleById,
  getDailySummary,
  getWeeklySummary,
  getMonthlySummary,
  getTopProducts,
  getCategoryBreakdown,
} = require('../controllers/salesController');
const { generateSalePDF } = require('../controllers/reportsController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', createSale);
router.get('/', getSales);
router.get('/summary/daily', getDailySummary);
router.get('/summary/weekly', getWeeklySummary);
router.get('/summary/monthly', getMonthlySummary);
router.get('/reports/top-products', getTopProducts);
router.get('/reports/category-breakdown', getCategoryBreakdown);
router.get('/:id/pdf', generateSalePDF);
router.get('/:id', getSaleById);

module.exports = router;
