const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');
const { publicAccess, writeAccess } = require('../middleware/access-control');

// Routes pour la gestion de la hiérarchie (lecture uniquement)
router.get('/', publicAccess, nodeController.getNodes);
router.get('/:nodeId/:type', publicAccess, nodeController.getNodeDetails);
router.get('/count', publicAccess, nodeController.getTotalNodes);

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, nodeController.createNode);
router.put('/:nodeId', writeAccess, nodeController.updateNode);
router.delete('/:nodeId', writeAccess, nodeController.deleteNode);
router.delete('/', writeAccess, nodeController.deleteNodes);
router.put('/:nodeId/status', writeAccess, nodeController.updateNodeStatus);

module.exports = router;