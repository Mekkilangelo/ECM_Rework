const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { readAccess, writeAccess } = require('../middleware/accessControl');

// Routes pour la gestion des commandes (lecture seulement)
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, orderController.createOrder);
router.put('/:orderId', writeAccess, orderController.updateOrder);
router.delete('/:orderId', writeAccess, orderController.deleteOrder);

module.exports = router;