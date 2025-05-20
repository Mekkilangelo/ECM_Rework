const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { publicAccess, writeAccess } = require('../middleware/access-control');

// Routes pour la gestion des clients (lecture seulement)
router.get('/', publicAccess, clientController.getClients);
router.get('/:clientId', publicAccess, clientController.getClientById);

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, clientController.createClient);
router.put('/:clientId', writeAccess, clientController.updateClient);
router.delete('/:clientId', writeAccess, clientController.deleteClient);

module.exports = router;