const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const fs_sync = require('fs');
const readArchive = promisify(fs_sync.readFile);
const iconv = require('iconv-lite');

// Définir le répertoire racine pour l'explorateur de fichiers
// IMPORTANT: Ajustez ceci selon votre configuration
const ROOT_DIR = process.env.FILES_ROOT_DIR //|| path.join(__dirname, '..', 'uploads');

/**
 * Valide et résout le chemin complet
 * @param {string} requestPath - Chemin demandé
 * @returns {string} - Chemin absolu valide
 * @throws {Error} - Erreur si le chemin n'est pas valide
 */
const resolveAndValidatePath = async (requestPath = '/') => {
    console.log('ROOT_DIR:', ROOT_DIR);
    console.log('requestPath reçu:', requestPath);
    
    // Gérer le cas où requestPath est undefined ou null
    requestPath = requestPath || '/';
    
    // Normaliser le chemin demandé
    const normalizedPath = path.normalize(requestPath).replace(/^(\.\.(\/|\\|$))+/, '');
    console.log('normalizedPath après normalisation:', normalizedPath);
    
    // Construire le chemin absolu
    const absolutePath = path.resolve(path.join(ROOT_DIR, normalizedPath));
    console.log('absolutePath construit:', absolutePath);
    console.log('ROOT_DIR résolu:', path.resolve(ROOT_DIR));
    
    // Vérifier que le chemin est bien dans le répertoire racine
    if (!absolutePath.startsWith(path.resolve(ROOT_DIR))) {
      console.error(`Tentative d'accès non autorisé: ${absolutePath} n'est pas dans ${ROOT_DIR}`);
      throw new Error('Accès refusé: chemin non autorisé');
    }
    
    // Si le chemin est la racine ou un chemin vide, on retourne directement sans vérification d'existence
    if (normalizedPath === '/' || normalizedPath === '' || normalizedPath === '.') {
      console.log('Chemin racine détecté, retour direct sans vérification d\'existence');
      return absolutePath;
    }
    
    // Pour les autres chemins, on vérifie l'existence
    try {
      await fs.access(absolutePath);
      console.log('Chemin existe:', absolutePath);
      return absolutePath;
    } catch (error) {
      console.error('Erreur d\'accès au chemin:', error.message);
      if (error.code === 'ENOENT') {
        throw new Error(`Le chemin ${requestPath} n'existe pas`);
      }
      throw error;
    }
  };
  

/**
 * Obtient l'icône pour un type de fichier
 * @param {string} archiveName - Nom du fichier
 * @returns {string} - Nom de l'icône correspondante
 */
const getArchiveType = (archiveName) => {
  const extension = path.extname(archiveName).toLowerCase();
  
  switch (extension) {
    case '.pdf': return 'pdf';
    case '.doc':
    case '.docx': return 'word';
    case '.xls':
    case '.xlsx': return 'excel';
    case '.jpg':
    case '.jpeg':
    case '.png':
    case '.gif': return 'image';
    case '.txt': return 'text';
    default: return 'archive';
  }
};

/**
 * Récupère le contenu d'un répertoire
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getDirectoryContents = async (req, res) => {
  try {
    const requestPath = req.query.path || '/';
    const absolutePath = await resolveAndValidatePath(requestPath);
    
    // Vérifier que c'est bien un dossier
    const stats = await fs.stat(absolutePath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ message: 'Le chemin spécifié n\'est pas un dossier' });
    }
    
    // Lire le contenu du répertoire
    const items = await fs.readdir(absolutePath);
    
    const folders = [];
    const archives = [];
    
    // Parcourir chaque élément et le classer
    for (const item of items) {
      const itemPath = path.join(absolutePath, item);
      const itemStat = await fs.stat(itemPath);
      
      if (itemStat.isDirectory()) {
        folders.push({
          name: item,
          path: path.join(requestPath, item),
          modifiedAt: itemStat.mtime
        });
      } else {
        archives.push({
          name: item,
          path: path.join(requestPath, item),
          size: itemStat.size,
          modifiedAt: itemStat.mtime,
          type: getArchiveType(item)
        });
      }
    }
    
    // Trier par nom
    folders.sort((a, b) => a.name.localeCompare(b.name));
    archives.sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({
      path: requestPath,
      folders,
      archives
    });
  } catch (error) {
    console.error('Error in getDirectoryContents:', error);
    res.status(error.message === 'Accès refusé: chemin non autorisé' ? 403 : 500)
       .json({ message: error.message || 'Erreur lors de la récupération du contenu du répertoire' });
  }
};

/**
 * Télécharger un fichier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.downloadArchive = async (req, res) => {
  try {
    const requestPath = req.query.path;
    const absolutePath = await resolveAndValidatePath(requestPath);
    
    // Vérifier que c'est bien un fichier
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      return res.status(400).json({ message: 'Le chemin spécifié n\'est pas un fichier' });
    }
    
    // Envoyer le fichier
    res.download(absolutePath);
  } catch (error) {
    console.error('Error in downloadArchive:', error);
    res.status(error.message === 'Accès refusé: chemin non autorisé' ? 403 : 500)
       .json({ message: error.message || 'Erreur lors du téléchargement du fichier' });
  }
};

/**
 * Obtenir un aperçu du fichier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getArchivePreview = async (req, res) => {
  try {
    const requestPath = req.query.path;
    const absolutePath = await resolveAndValidatePath(requestPath);
    
    // Vérifier que c'est bien un fichier
    const stats = await fs.stat(absolutePath);
    if (!stats.isFile()) {
      return res.status(400).json({ message: 'Le chemin spécifié n\'est pas un fichier' });
    }
    
    const extension = path.extname(absolutePath).toLowerCase();
    
    // Gérer différents types de fichiers
    switch (extension) {
      case '.txt':
        try {
          // Lire le contenu du fichier texte
          const buffer = await readArchive(absolutePath);
          // Essayer de détecter l'encodage et convertir si nécessaire
          const content = iconv.decode(buffer, 'utf-8');
          res.json({ data: content, type: 'txt' });
        } catch (err) {
          res.status(500).json({ message: 'Erreur lors de la lecture du fichier texte' });
        }
        break;
        
      case '.pdf':
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
        // Lire et encoder en base64 pour les images et PDF
        try {
          const data = await readArchive(absolutePath);
          const base64Data = data.toString('base64');
          res.json({ 
            data: base64Data, 
            type: extension.substring(1) // Remove the dot
          });
        } catch (err) {
          res.status(500).json({ message: `Erreur lors de la lecture du fichier ${extension}` });
        }
        break;

        case '.pdf':
        case '.jpg':
        case '.jpeg':
        case '.png':
        case '.gif':
        try {
            const data = await readArchive(absolutePath);
            const base64Data = data.toString('base64');
            
            // Log de vérification
            console.log('Type de base64Data:', typeof base64Data);
            console.log('Premiers 50 caractères:', base64Data.substring(0, 50) + '...');
            
            res.json({ 
            data: base64Data, 
            type: extension.substring(1) // Remove the dot
            });
        } catch (err) {
            console.error('Erreur de lecture du fichier image/pdf:', err);
            res.status(500).json({ message: `Erreur lors de la lecture du fichier ${extension}` });
        }
        break;        
        
      default:
        // Pour les autres types de fichiers, renvoyer juste les métadonnées
        res.json({
          name: path.basename(absolutePath),
          size: stats.size,
          modifiedAt: stats.mtime,
          type: extension.substring(1),
          message: 'Aperçu non disponible pour ce type de fichier'
        });
    }
  } catch (error) {
    console.error('Error in getArchivePreview:', error);
    res.status(error.message === 'Accès refusé: chemin non autorisé' ? 403 : 500)
       .json({ message: error.message || 'Erreur lors de la récupération de l\'aperçu du fichier' });
  }
};

/**
 * Créer un nouveau dossier
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.createDirectory = async (req, res) => {
  try {
    const { path: requestPath, folderName } = req.body;
    
    if (!folderName || folderName.includes('/') || folderName.includes('\\')) {
      return res.status(400).json({ message: 'Nom de dossier invalide' });
    }
    
    const parentPath = await resolveAndValidatePath(requestPath);
    
    // Vérifier que le parent est bien un dossier
    const stats = await fs.stat(parentPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ message: 'Le chemin parent n\'est pas un dossier' });
    }
    
    const newDirPath = path.join(parentPath, folderName);
    
    // Vérifier si le dossier existe déjà
    try {
      await fs.access(newDirPath);
      return res.status(409).json({ message: 'Un dossier avec ce nom existe déjà' });
    } catch (err) {
      // Le dossier n'existe pas, c'est ce qu'on veut
    }
    
    // Créer le dossier
    await fs.mkdir(newDirPath);
    
    res.status(201).json({ 
      message: 'Dossier créé avec succès',
      path: path.join(requestPath, folderName)
    });
  } catch (error) {
    console.error('Error in createDirectory:', error);
    res.status(error.message === 'Accès refusé: chemin non autorisé' ? 403 : 500)
       .json({ message: error.message || 'Erreur lors de la création du dossier' });
  }
};