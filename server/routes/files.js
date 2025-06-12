// routes/files.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { readAccess, writeAccess, publicAccess } = require('../middleware/access-control');
const { parseAndResolvePath } = require('../middleware/parse-and-resolve');

// Ordre correct des routes
// Routes d'écriture (nécessitent des droits d'édition)
router.post('/upload', writeAccess, parseAndResolvePath, fileController.uploadFiles);
router.put('/:fileId', writeAccess, fileController.updateFile);
router.delete('/:fileId', writeAccess, fileController.deleteFile);
router.post('/associate', writeAccess, fileController.associateFiles);

// Routes de lecture (nécessitent uniquement une authentification)
router.get('/node/:nodeId', readAccess, fileController.getFilesByNode);
router.get('/stats/:nodeId', readAccess, fileController.getFileStats);

// Routes publiques (accessibles sans authentification)
router.get('/download/:fileId', publicAccess, fileController.downloadFile);

// Cette route doit être la dernière car c'est la plus générique
router.get('/:fileId', publicAccess, fileController.getFileById);

module.exports = router;
