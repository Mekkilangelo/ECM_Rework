const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { protect, superUserOnly } = require('../middleware/auth');

// Routes pour la gestion des paramètres système
router.get('/settings', protect, systemController.getSystemSettings);
router.get('/security', protect, systemController.getSecurityInfo);

// Routes protégées pour superutilisateurs uniquement
router.put('/settings/readonly', protect, superUserOnly, systemController.updateReadOnlyMode);

module.exports = router;
