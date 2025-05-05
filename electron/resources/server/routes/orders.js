const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des commandes
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);

// Protected routes
router.post('/', protect, orderController.createOrder);
router.put('/:orderId', protect, orderController.updateOrder);
router.delete('/:orderId', protect, orderController.deleteOrder);

module.exports = router;