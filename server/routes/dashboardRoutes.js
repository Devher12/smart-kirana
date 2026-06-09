const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { authMiddleware, ownerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, ownerOnly);

router.get('/', getDashboard);

module.exports = router;
