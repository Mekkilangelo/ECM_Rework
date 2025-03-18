const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des pièces
router.get('/', partController.getParts);
router.get('/:partId', partController.getPartById);

// Protected routes
router.post('/', protect, partController.createPart);
router.put('/:partId', protect, partController.updatePart);
router.delete('/:partId', protect, partController.deletePart);

module.exports = router;