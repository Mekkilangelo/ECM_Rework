// routes/files.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect, editRightsOnly } = require('../middleware/auth');
const { upload } = require('../utils/fileStorage');
const { resolveFilePath } = require('../middleware/filePathResolver');

// Ordre correct des routes
router.post('/upload', protect, editRightsOnly, upload.array('files', 10), resolveFilePath, fileController.uploadFiles);
router.get('/node/:nodeId', protect, fileController.getFilesByNode);
router.delete('/:fileId', protect, editRightsOnly, fileController.deleteFile);
router.get('/download/:fileId', fileController.downloadFile);
router.post('/associate', protect, editRightsOnly, fileController.associateFiles);
router.get('/stats/:nodeId', protect, fileController.getFileStats);

// Cette route doit être la dernière car c'est la plus générique
router.get('/:fileId', fileController.getFileById);

module.exports = router;
