// utils/fileStorage.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Création du dossier de base pour les uploads si n'existe pas
const createBaseUploadDir = () => {
  const baseDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return baseDir;
};

// Configuration du stockage selon le type d'entité
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const baseDir = createBaseUploadDir();
    const nodeId = req.params.nodeId || req.body.nodeId;
    const entityType = req.params.entityType || req.body.entityType; // 'orders', 'clients', etc.
    
    // Création d'un chemin hiérarchique: uploads/entityType/nodeId/
    const uploadPath = path.join(baseDir, entityType, nodeId.toString());
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nom unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Validation des types de fichiers autorisés
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/png', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // limite à 10MB
  },
  fileFilter: fileFilter
});

module.exports = upload;