// utils/fileStorage.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Utilisez les variables d'environnement pour les chemins
const UPLOAD_BASE_DIR = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
const TEMP_DIR = path.join(__dirname, '..', process.env.TEMP_PATH || 'uploads/temp');

console.log('UPLOAD_BASE_DIR:', UPLOAD_BASE_DIR);
console.log('TEMP_DIR:', TEMP_DIR);

// Assurer que les répertoires existent
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  console.log('Creating upload directory:', UPLOAD_BASE_DIR);
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}

if (!fs.existsSync(TEMP_DIR)) {
  console.log('Creating temp directory:', TEMP_DIR);
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Si un nodeId est fourni et que le chemin est résolu, utiliser ce chemin
    if (req.body.nodeId && req.resolvedPath) {
      cb(null, req.resolvedPath);
    } else {
      // Sinon, stocker dans le dossier temporaire
      const tempId = `temp-${uuidv4()}`;
      req.tempId = tempId;
      
      const tempUploadDir = path.join(TEMP_DIR, tempId);
      if (!fs.existsSync(tempUploadDir)) {
        fs.mkdirSync(tempUploadDir, { recursive: true });
      }
      
      cb(null, tempUploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const safeFileName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${uniqueSuffix}-${safeFileName}`);
  }
});

// Configuration des limites et filtres
const fileFilter = (req, file, cb) => {
  // Accepter tous les fichiers pour l'instant
  cb(null, true);
};

// Créer l'instance multer configurée
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10
  }
});

// Fonction pour générer un checksum de fichier
const generateFileChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

// Utilitaire pour nettoyer le dossier temporaire
const cleanupTempDir = async (olderThan = 24 * 60 * 60 * 1000) => {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > olderThan) {
        fs.unlinkSync(filePath);
        console.log(`Fichier temporaire nettoyé: ${file}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des fichiers temporaires:', error);
  }
};

// Exportez l'instance multer et les autres utilitaires UNE SEULE FOIS
module.exports = {
  upload,
  generateFileChecksum,
  cleanupTempDir,
  UPLOAD_BASE_DIR,
  TEMP_DIR
};
