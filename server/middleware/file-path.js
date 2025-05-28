// middleware/filePathResolver.js
const { Node } = require('../models');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE_DIR = path.join(__dirname, '../uploads');

/**
 * Construit le chemin physique pour un fichier à partir du chemin du nœud parent
 * @param {Object} parentNode - Nœud parent
 * @param {string} category - Catégorie du fichier
 * @param {string} subcategory - Sous-catégorie du fichier
 * @returns {string} Chemin physique complet
 */
const buildPhysicalFilePath = (parentNode, category, subcategory) => {
  // Commencer par le répertoire de base
  let physicalPath = UPLOAD_BASE_DIR;
  
  // Construire le chemin à partir du chemin logique du nœud parent
  // Le chemin logique est comme "/Audi/TRQ_20250528" 
  const pathComponents = parentNode.path.split('/').filter(c => c.length > 0);
  
  // Ajouter chaque composant du chemin
  for (const component of pathComponents) {
    physicalPath = path.join(physicalPath, component);
  }
  
  // Déterminer la structure de catégorie appropriée
  let categoryPath = category || 'general';
  let subcategoryPath = subcategory || '';
  
  // Si le parent est un ordre, respecter la structure spécifique
  if (parentNode.type === 'order') {
    categoryPath = 'documents';
    subcategoryPath = 'alldocuments';
  }
  
  // Ajouter la catégorie et sous-catégorie
  if (categoryPath) {
    physicalPath = path.join(physicalPath, categoryPath);
    if (subcategoryPath) {
      physicalPath = path.join(physicalPath, subcategoryPath);
    }
  }
  
  return physicalPath;
};

exports.resolveFilePath = async (req, res, next) => {
  try {
    const { nodeId, category, subcategory } = req.body;
    
    // Si pas de nodeId, c'est un stockage temporaire, on passe au middleware suivant
    if (!nodeId) return next();
    
    // Récupérer les informations du nœud pour construire le chemin
    const node = await Node.findByPk(nodeId);
    
    if (!node) {
      return res.status(404).json({ message: 'Nœud non trouvé' });
    }
    
    // Construire le chemin physique en utilisant la nouvelle fonction
    const physicalPath = buildPhysicalFilePath(node, category, subcategory);
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(physicalPath)) {
      fs.mkdirSync(physicalPath, { recursive: true });
    }
    
    // Ajouter le chemin résolu aux données de la requête
    req.resolvedPath = physicalPath;
    
    next();
  } catch (error) {
    console.error('Erreur lors de la résolution du chemin du fichier:', error);
    res.status(500).json({ message: 'Erreur lors de la résolution du chemin' });
  }
};
