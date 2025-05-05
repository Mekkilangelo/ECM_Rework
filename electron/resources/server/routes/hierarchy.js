const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');
const { protect } = require('../middleware/auth');


// Routes pour la gestion de la hiérarchie

router.get('/', nodeController.getNodes);
router.get('/:nodeId/:type', nodeController.getNodeDetails);
router.get('/count', nodeController.getTotalNodes);

//Protected routes
router.post('/', protect, nodeController.createNode);
router.put('/:nodeId', protect, nodeController.updateNode);
router.delete('/:nodeId', protect, nodeController.deleteNode);
router.delete('/', protect, nodeController.deleteNodes);

router.put('/:nodeId/status', protect, nodeController.updateNodeStatus);

module.exports = router;