// middleware/filePathResolver.js
const { Node } = require('../models');
const path = require('path');
const fs = require('fs');

const UPLOAD_BASE_DIR = path.join(__dirname, '../uploads');

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
    
    // Analyser le chemin du nœud pour construire la structure de répertoires
    // Le chemin est dans le format '/client/order/part' dans la base
    const nodePath = node.path;
    const nodeType = node.type;
    
    // Construire le chemin physique en fonction du type de nœud et de la catégorie
    let physicalPath = UPLOAD_BASE_DIR;
    
    // Séparer les composants du chemin
    const pathComponents = nodePath.split('/').filter(c => c.length > 0);
    
    // Construire le chemin physique en fonction du chemin du nœud
    for (const component of pathComponents) {
      physicalPath = path.join(physicalPath, component);
      if (!fs.existsSync(physicalPath)) {
        fs.mkdirSync(physicalPath, { recursive: true });
      }
    }
    
    // Ajouter les sous-dossiers selon la catégorie et sous-catégorie
    if (category) {
      physicalPath = path.join(physicalPath, category);
      if (!fs.existsSync(physicalPath)) {
        fs.mkdirSync(physicalPath, { recursive: true });
      }
      
      if (subcategory) {
        physicalPath = path.join(physicalPath, subcategory);
        if (!fs.existsSync(physicalPath)) {
          fs.mkdirSync(physicalPath, { recursive: true });
        }
      }
    }
    
    // Ajouter le chemin résolu aux données de la requête
    req.resolvedPath = physicalPath;
    
    next();
  } catch (error) {
    console.error('Erreur lors de la résolution du chemin du fichier:', error);
    res.status(500).json({ message: 'Erreur lors de la résolution du chemin' });
  }
};
