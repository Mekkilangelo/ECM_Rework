/**
 * Middleware pour pré-parser les données de formulaire multipart
 * et résoudre le chemin de fichier avant le stockage par multer
 */

const multer = require('multer');
const { node } = require('../models');
const { buildPhysicalFilePath } = require('./file-path');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Middleware pour résoudre le chemin basé sur les données de la requête
 * Cette approche alternative utilise directement multer avec une logique conditionnelle
 */
const parseAndResolvePath = async (req, res, next) => {
  try {
    console.log('🔍 [parseAndResolvePath] Début du parsing...');
    
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
        const { nodeId, category, subcategory } = req.body;
      console.log('📋 [parseAndResolvePath] Données parsées:', { nodeId, category, subcategory });
      console.log('📄 [parseAndResolvePath] Fichiers détectés:', req.files ? req.files.length : 0);

      // Si pas de nodeId, passer au middleware suivant sans traitement
      if (!nodeId) {
        console.log('📂 [parseAndResolvePath] Pas de nodeId -> passage au middleware suivant');
        return next();
      }
      
      try {
        // Récupérer les informations du nœud
        const parentNode = await node.findByPk(nodeId);
        console.log('🔍 [parseAndResolvePath] Nœud trouvé:', parentNode ? `${parentNode.id} - ${parentNode.name}` : 'null');
        
        if (!parentNode) {
          return res.status(404).json({ message: 'Nœud non trouvé' });
        }
        
        // Construire le chemin physique
        const physicalPath = buildPhysicalFilePath(parentNode, category, subcategory);
        console.log('📁 [parseAndResolvePath] Chemin physique résolu:', physicalPath);
        
        // Créer le répertoire s'il n'existe pas
        if (!fs.existsSync(physicalPath)) {
          fs.mkdirSync(physicalPath, { recursive: true });
          console.log('📁 [parseAndResolvePath] Répertoire créé:', physicalPath);
        }
        
        // Stocker le chemin résolu
        req.resolvedPath = physicalPath;
        
        // Convertir les fichiers en mémoire vers des fichiers sur disque
        if (req.files && req.files.length > 0) {
          const convertedFiles = [];
          
          for (const file of req.files) {
            // Générer un nom unique
            const crypto = require('crypto');
            const uniqueSuffix = crypto.randomBytes(8).toString('hex');
            const safeFileName = file.originalname.replace(/\s+/g, '_');
            const fileName = `${uniqueSuffix}-${safeFileName}`;
            const filePath = path.join(physicalPath, fileName);
            
            // Écrire le fichier sur disque
            fs.writeFileSync(filePath, file.buffer);
            
            // Créer un objet file compatible avec multer
            convertedFiles.push({
              fieldname: file.fieldname,
              originalname: file.originalname,
              encoding: file.encoding,
              mimetype: file.mimetype,
              size: file.size,
              destination: physicalPath,
              filename: fileName,
              path: filePath,
              buffer: undefined // Libérer la mémoire
            });
            
            console.log('💾 [parseAndResolvePath] Fichier sauvé:', filePath);
          }
          
          // Remplacer req.files par les fichiers convertis
          req.files = convertedFiles;
        }
        
        console.log('✅ [parseAndResolvePath] Chemin résolu et fichiers traités');
        next();
        
      } catch (dbError) {
        console.error('❌ [parseAndResolvePath] Erreur base de données:', dbError);
        next(dbError);
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
