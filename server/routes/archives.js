const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archiveController');
const { readAccess, writeAccess } = require('../middleware/access-control');
const validators = require('../middleware/validators');

// Routes de lecture (nécessitent une authentification)
router.get('/directory', readAccess, validators.validatePath, archiveController.getDirectoryContents);
router.get('/download', readAccess, validators.validatePath, archiveController.downloadArchive);
router.get('/preview', readAccess, validators.validatePath, archiveController.getArchivePreview);

// Routes d'écriture (nécessitent des droits d'édition)
router.post('/directory', writeAccess, validators.validatePath, archiveController.createDirectory);

module.exports = router;