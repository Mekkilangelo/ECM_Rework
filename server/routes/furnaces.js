const express = require('express');
const router = express.Router();
const furnaceController = require('../controllers/furnaceController');
const { protect, editRightsOnly } = require('../middleware/auth');

// Routes pour la gestion des fours
router.get('/', furnaceController.getFurnaces);
router.get('/:furnaceId', furnaceController.getFurnaceById);

// Protected routes
router.post('/', protect, editRightsOnly, furnaceController.createFurnace);
router.put('/:furnaceId', protect, editRightsOnly, furnaceController.updateFurnace);
router.delete('/:furnaceId', protect, editRightsOnly, furnaceController.deleteFurnace);

module.exports = router;