const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des fichiers
router.get('/', fileController.getFiles);
router.get('/:fileId', fileController.getFileById);
router.get('/:fileId/download', fileController.downloadFile);

// Protected routes
router.post('/', protect, fileController.uploadFile);
router.put('/:fileId', protect, fileController.updateFileInfo);
router.delete('/:fileId', protect, fileController.deleteFile);

module.exports = router;