const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');
const { protect } = require('../middleware/auth');


// Routes pour la gestion de la hiérarchie
router.get('/nodes', nodeController.getTable);
router.get('/nodes/:nodeId/path', nodeController.getNodePath);
router.get('/', nodeController.getAllNodes);
router.get('/tree', nodeController.getNodeTree);
router.get('/:id', nodeController.getNodeById);
router.get('/children/:id', nodeController.getNodeChildren);
router.get('/parent/:id', nodeController.getNodeParent);
router.get('/ancestors/:id', nodeController.getNodeAncestors);
router.get('/descendants/:id', nodeController.getNodeDescendants);

//Protected routes
router.post('/', protect, nodeController.createNode);
router.put('/:id', protect, nodeController.updateNode);
router.delete('/:id', protect, nodeController.deleteNode);

module.exports = router;