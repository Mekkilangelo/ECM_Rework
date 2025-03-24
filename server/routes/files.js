// routes/files.js
const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const upload = require('../utils/fileStorage');

// Route pour uploader un ou plusieurs fichiers
router.post('/upload', protect, upload.array('files', 5), fileController.uploadFiles);

// Route pour récupérer tous les fichiers liés à un node
router.get('/node/:nodeId', protect, fileController.getFilesByNode);

// Route pour supprimer un fichier
router.delete('/:fileId', protect, fileController.deleteFile);

// Route pour télécharger un fichier
router.get('/download/:fileId', protect, fileController.downloadFile);

router.post('/associate', protect, fileController.associateFiles);

module.exports = router;