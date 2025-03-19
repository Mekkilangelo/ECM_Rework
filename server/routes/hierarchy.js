const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');
const { protect } = require('../middleware/auth');


// Routes pour la gestion de la hiérarchie

//router.get('/', nodeController.getAllNodes);
//router.get('/:id', nodeController.getNodeById);
router.get('/', nodeController.getNodes);
router.get('/:nodeId/:type', nodeController.getNodeDetails);
router.get('/count', nodeController.getTotalNodes);

//Protected routes
router.post('/', protect, nodeController.createNode);
router.put('/:nodeId', protect, nodeController.updateNode);
router.delete('/:nodeId', protect, nodeController.deleteNode);

router.put('/:nodeId/status', protect, nodeController.updateNodeStatus);

module.exports = router;