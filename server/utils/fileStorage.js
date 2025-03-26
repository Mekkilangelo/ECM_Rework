// utils/fileStorage.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Configuration des chemins de stockage
const UPLOAD_BASE_DIR = path.join(__dirname, '../uploads');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');

// Assurer que les répertoires existent
if (!fs.existsSync(UPLOAD_BASE_DIR)) {
  fs.mkdirSync(UPLOAD_BASE_DIR, { recursive: true });
}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniquePrefix}${fileExt}`);
  }
});

// Configuration des limites et filtres
const fileFilter = (req, file, cb) => {
  // Accepte tous les types de fichiers pour l'instant
  cb(null, true);
};

// CORRECTION ICI : exportez directement l'instance multer configurée
// Plutôt qu'un objet contenant l'instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 Mo par défaut
    files: 10 // Max 10 fichiers par requête
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

// Exportez l'instance multer et les autres utilitaires
module.exports = {
  upload,
  generateFileChecksum,
  cleanupTempDir,
  UPLOAD_BASE_DIR,
  TEMP_DIR
};
