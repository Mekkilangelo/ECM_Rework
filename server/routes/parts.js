const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');
const { readAccess, writeAccess, publicAccess } = require('../middleware/access-control');

// Routes pour la gestion des pièces (lecture uniquement)
router.get('/', publicAccess, partController.getParts);
router.get('/:partId', publicAccess, partController.getPartById);

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, partController.createPart);
router.put('/:partId', writeAccess, partController.updatePart);
router.delete('/:partId', writeAccess, partController.deletePart);

module.exports = router;