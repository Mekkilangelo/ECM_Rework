const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const { protect } = require('../middleware/auth');
const validators = require('../middleware/validators');

// Route pour récupérer le contenu d'un répertoire
router.get('/directory', protect, validators.validatePath, archiveController.getDirectoryContents);

// Route pour télécharger un fichier
router.get('/download', protect, validators.validatePath, archiveController.downloadArchive);

// Route pour obtenir un aperçu de fichier
router.get('/preview', protect, validators.validatePath, archiveController.getArchivePreview);

// Route pour créer un nouveau dossier
router.post('/directory', protect, validators.validatePath, archiveController.createDirectory);

module.exports = router;