const express = require('express');
const { generateDailyPDF } = require('../controllers/reportsController');
const { authMiddleware, ownerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, ownerOnly);

router.get('/pdf/daily', generateDailyPDF);

module.exports = router;
