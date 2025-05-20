const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');
const { protect, editRightsOnly } = require('../middleware/auth');

// Routes pour la gestion des pièces
router.get('/', partController.getParts);
router.get('/:partId', partController.getPartById);

// Protected routes
router.post('/', protect, editRightsOnly, partController.createPart);
router.put('/:partId', protect, editRightsOnly, partController.updatePart);
router.delete('/:partId', protect, editRightsOnly, partController.deletePart);

module.exports = router;