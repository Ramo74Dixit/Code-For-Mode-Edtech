const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const { createOrder, verifyPayment } = require('../controllers/paymentController');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

module.exports = router;
