const express = require('express');
const router = express.Router();
const furnaceController = require('../controllers/furnaceController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des fours
router.get('/', furnaceController.getFurnaces);
router.get('/:furnaceId', furnaceController.getFurnaceById);

// Protected routes
router.post('/', protect, furnaceController.createFurnace);
router.put('/:furnaceId', protect, furnaceController.updateFurnace);
router.delete('/:furnaceId', protect, furnaceController.deleteFurnace);

module.exports = router;