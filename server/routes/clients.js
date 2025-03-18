const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des clients
router.get('/', clientController.getClients);
router.get('/:clientId', clientController.getClientById);

//Protected routes
router.post('/', protect, clientController.createClient);
router.put('/:clientId', protect, clientController.updateClient);
router.delete('/:clientId', protect, clientController.deleteClient);

module.exports = router;