const express = require('express');
const router = express.Router();
const steelController = require('../controllers/steelController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des aciers
router.get('/', steelController.getSteels);
router.get('/:steelId', steelController.getSteelById);

// Protected routes
router.post('/', protect, steelController.createSteel);
router.put('/:steelId', protect, steelController.updateSteel);
router.delete('/:steelId', protect, steelController.deleteSteel);

module.exports = router;