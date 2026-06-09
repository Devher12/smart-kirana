const express = require('express');
const {
  getSuppliers,
  createSupplier,
  updateSupplier,
  getSupplierById,
  createPurchaseOrder,
  getPurchaseOrders,
} = require('../controllers/supplierController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/purchase-orders', getPurchaseOrders);
router.post('/purchase-orders', createPurchaseOrder);
router.get('/:id', getSupplierById);
router.put('/:id', updateSupplier);

module.exports = router;
