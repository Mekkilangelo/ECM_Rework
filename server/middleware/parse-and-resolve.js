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
const logger = require('../utils/logger');

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
        logger.error('[parseAndResolvePath] Erreur multer', { error: err.message });
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
        
        logger.debug('[parseAndResolvePath] Création dossier temporaire', {
          tempDir,
          UPLOAD_BASE_DIR,
          fileCount: req.files.length
        });
        
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
          
          // Vérifier que le fichier a bien été écrit
          if (!fs.existsSync(filePath)) {
            logger.error('[parseAndResolvePath] Échec écriture fichier temporaire', {
              filePath,
              originalname: file.originalname
            });
            throw new Error(`Échec écriture fichier temporaire: ${filePath}`);
          }
          
          const stats = fs.statSync(filePath);
          logger.debug('[parseAndResolvePath] Fichier temporaire créé', {
            filePath,
            originalname: file.originalname,
            size: stats.size
          });
          
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
        
        logger.debug('[parseAndResolvePath] Fichiers prêts pour traitement', {
          count: convertedFiles.length,
          tempDir
        });
        
        next();
        
      } catch (error) {
        logger.error('[parseAndResolvePath] Erreur traitement fichiers', { error: error.message });
        next(error);
      }
    });
    
  } catch (error) {
    logger.error('[parseAndResolvePath] Erreur générale', { error: error.message });
    next(error);
  }
};

module.exports = {
  parseAndResolvePath
};
