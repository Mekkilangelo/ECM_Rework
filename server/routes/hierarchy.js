const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');
const { protect, editRightsOnly } = require('../middleware/auth');


// Routes pour la gestion de la hiérarchie

router.get('/', nodeController.getNodes);
router.get('/:nodeId/:type', nodeController.getNodeDetails);
router.get('/count', nodeController.getTotalNodes);

//Protected routes
router.post('/', protect, editRightsOnly, nodeController.createNode);
router.put('/:nodeId', protect, editRightsOnly, nodeController.updateNode);
router.delete('/:nodeId', protect, editRightsOnly, nodeController.deleteNode);
router.delete('/', protect, editRightsOnly, nodeController.deleteNodes);

router.put('/:nodeId/status', protect, editRightsOnly, nodeController.updateNodeStatus);

module.exports = router;