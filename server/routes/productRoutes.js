const express = require('express');
const {
  getProducts,
  getLowStock,
  getExpiring,
  getByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/low-stock', getLowStock);
router.get('/expiring', getExpiring);
router.get('/barcode/:code', getByBarcode);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
