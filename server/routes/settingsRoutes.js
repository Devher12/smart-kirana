const express = require('express');
const {
  getSettings,
  updateSettings,
  changePassword,
  createUser,
} = require('../controllers/settingsController');
const { authMiddleware, ownerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware, ownerOnly);

router.get('/', getSettings);
router.put('/', updateSettings);
router.put('/password', changePassword);
router.post('/users', createUser);

module.exports = router;
