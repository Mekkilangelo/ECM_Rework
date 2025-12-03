/**
 * Routes de gestion des nœuds
 * 
 * Note : Ce module contient uniquement les opérations transversales
 * sur les nœuds. Les opérations CRUD spécifiques sont gérées par
 * les services dédiés (clientService, trialRequestService, etc.)
 */

const express = require('express');
const router = express.Router();
const nodeController = require('../controllers/nodeController');
const { writeAccess } = require('../middleware/access-control');

// Routes transversales pour tous les types de nœuds
router.put('/:nodeId/status', writeAccess, nodeController.updateNodeStatus);
router.delete('/', writeAccess, nodeController.deleteNodes);

module.exports = router;