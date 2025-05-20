const express = require('express');
const router = express.Router();
const steelController = require('../controllers/steelController');
const { protect, editRightsOnly } = require('../middleware/auth');

// Routes pour la gestion des aciers
router.get('/', steelController.getSteels);
router.get('/grades', steelController.getSteelsGrades);
router.get('/:steelId', steelController.getSteelById);

// Protected routes
router.post('/', protect, editRightsOnly, steelController.createSteel);
router.put('/:steelId', protect, editRightsOnly, steelController.updateSteel);
router.delete('/:steelId', protect, editRightsOnly, steelController.deleteSteel);

module.exports = router;