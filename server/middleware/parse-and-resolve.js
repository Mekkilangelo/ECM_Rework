/**
 * Middleware pour pré-parser les données de formulaire multipart
 * et résoudre le chemin de fichier avant le stockage
 * 
 * VERSION REFACTORISÉE : Utilise un dossier temporaire unique par upload
 * Les fichiers seront déplacés vers leur storage_key final par fileService
 */

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_BASE_DIR } = require('../utils/fileStorage');

/**
 * Middleware pour gérer l'upload multipart
 * Stocke temporairement tous les fichiers dans un dossier temp unique
 */
const parseAndResolvePath = async (req, res, next) => {
  try {
    // Créer un middleware multer temporaire qui accepte tout et parse les champs
    const tempStorage = multer.memoryStorage();
    const tempUpload = multer({ 
      storage: tempStorage,
      fileFilter: (req, file, cb) => {
        // Stocker temporairement les fichiers en mémoire pour l'instant
        cb(null, true);
      }
    }).any(); // Accepter tous les fichiers et champs
    
    // Parser la requête
    tempUpload(req, res, async (err) => {
      if (err) {
        console.error('❌ [parseAndResolvePath] Erreur multer temp:', err);
        return next(err);
      }

      // Si pas de fichiers, passer au middleware suivant
      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        // Créer un dossier temporaire unique pour cet upload
        const tempUploadId = uuidv4();
        const tempDir = path.join(UPLOAD_BASE_DIR, 'temp_uploads', tempUploadId);
        
        // Créer le répertoire temporaire
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Convertir les fichiers en mémoire vers des fichiers temporaires sur disque
        const convertedFiles = [];
        
        for (const file of req.files) {
          // Générer un nom sûr et unique
          const uniqueSuffix = uuidv4().split('-')[0];
          const safeFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${uniqueSuffix}-${safeFileName}`;
          const filePath = path.join(tempDir, fileName);
          
          // Écrire le fichier temporaire sur disque
          fs.writeFileSync(filePath, file.buffer);
          
          // Créer un objet file compatible avec multer
          convertedFiles.push({
            fieldname: file.fieldname,
            originalname: file.originalname,
            encoding: file.encoding,
            mimetype: file.mimetype,
            size: file.size,
            destination: tempDir,
            filename: fileName,
            path: filePath,
            buffer: undefined // Libérer la mémoire
          });
        }
        
        // Remplacer req.files par les fichiers convertis
        req.files = convertedFiles;
        
        next();
        
      } catch (error) {
        console.error('❌ [parseAndResolvePath] Erreur traitement fichiers:', error);
        next(error);
      }
    });
    
  } catch (error) {
    console.error('❌ [parseAndResolvePath] Erreur générale:', error);
    next(error);
  }
};

module.exports = {
  parseAndResolvePath
};
