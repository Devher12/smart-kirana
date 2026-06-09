const express = require('express');
const {
  getCustomers,
  createCustomer,
  getCustomerById,
  recordPayment,
} = require('../controllers/customerController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomerById);
router.post('/:id/pay', recordPayment);

module.exports = router;
