// utils/fileStorage.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const os = require('os');

// Fonction pour résoudre les variables d'environnement Windows
function resolveEnvPath(envPath) {
  if (typeof envPath === 'string') {
    // Remplacer %APPDATA%, %LOCALAPPDATA%, etc.
    return envPath.replace(/%([^%]+)%/g, (_, name) => {
      return process.env[name] || os.homedir();
    });
  }
  return envPath;
}

// Résoudre les chemins avec expansion des variables d'environnement
const uploadPathEnv = resolveEnvPath(process.env.UPLOAD_PATH || 'uploads');
const tempPathEnv = resolveEnvPath(process.env.TEMP_PATH || 'uploads/temp');

// Utiliser des chemins absolus si les variables commencent par un lecteur ou / 
// sinon les traiter comme relatifs
const UPLOAD_BASE_DIR = uploadPathEnv.match(/^([A-Z]:|\/)/) 
  ? uploadPathEnv 
  : path.join(__dirname, '..', uploadPathEnv);

const TEMP_DIR = tempPathEnv.match(/^([A-Z]:|\/)/) 
  ? tempPathEnv 
  : path.join(__dirname, '..', tempPathEnv);

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
    console.log('📂 [multer-destination] Début de la résolution du stockage...');
    console.log('📋 [multer-destination] req.body:', req.body);
    console.log('📋 [multer-destination] req.resolvedPath:', req.resolvedPath);
    
    // Si le chemin a été résolu par le middleware, l'utiliser
    if (req.resolvedPath) {
      console.log('✅ [multer-destination] Utilisation du chemin résolu:', req.resolvedPath);
      cb(null, req.resolvedPath);
    } else {
      // Pas de chemin résolu : stockage temporaire
      console.log('📦 [multer-destination] Stockage temporaire...');
      if (!req.tempId) {
        req.tempId = `temp-${uuidv4()}`;
      }
      const tempUploadDir = path.join(TEMP_DIR, req.tempId);
      if (!fs.existsSync(tempUploadDir)) {
        fs.mkdirSync(tempUploadDir, { recursive: true });
      }
      console.log('📁 [multer-destination] Dossier temporaire créé:', tempUploadDir);
      cb(null, tempUploadDir);
    }
  },
  filename: function (req, file, cb) {
    // Générer un nom unique pour le fichier
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const safeFileName = file.originalname.replace(/\s+/g, '_');
    const finalName = `${uniqueSuffix}-${safeFileName}`;
    console.log('📄 [multer-filename] Nom généré:', finalName);
    cb(null, finalName);
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

// Utilitaire pour nettoyer les dossiers temporaires
const cleanupTempDir = async (olderThan = 24 * 60 * 60 * 1000) => {
  try {
    if (!fs.existsSync(TEMP_DIR)) {
      return;
    }
    
    const entries = fs.readdirSync(TEMP_DIR, { withFileTypes: true });
    const now = Date.now();
    
    for (const entry of entries) {
      const fullPath = path.join(TEMP_DIR, entry.name);
      
      try {
        const stats = fs.statSync(fullPath);
        
        if (now - stats.mtimeMs > olderThan) {
          if (entry.isDirectory()) {
            // Supprimer récursivement le dossier temporaire
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`Dossier temporaire nettoyé: ${entry.name}`);
          } else {
            // Supprimer le fichier isolé
            fs.unlinkSync(fullPath);
            console.log(`Fichier temporaire nettoyé: ${entry.name}`);
          }
        }
      } catch (statError) {
        console.warn(`Erreur lors de l'accès aux stats de ${fullPath}:`, statError.message);
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
