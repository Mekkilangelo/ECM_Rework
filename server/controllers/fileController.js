// controllers/fileController.js
const { Node, File, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getMimeTypeFromExtension } = require('../middleware/mimeTypes');
const { Op } = require('sequelize');

const UPLOAD_BASE_DIR = path.join(__dirname, '../uploads');
const TEMP_DIR = path.join(UPLOAD_BASE_DIR, 'temp');

exports.uploadFiles = async (req, res) => {
  try {
    const { nodeId, category, subcategory } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }
    
    // Si nodeId n'est pas fourni, nous stockons temporairement
    // Les fichiers seront associés plus tard via l'API associateFiles
    const tempId = nodeId || `temp-${uuidv4()}`;
    const fileRecords = [];
    
    for (const file of files) {
      // Déterminer le chemin final du fichier
      let finalPath;
      
      if (nodeId && req.resolvedPath) {
        // Déplacer le fichier de temp vers le chemin final
        finalPath = path.join(req.resolvedPath, file.filename);
        fs.renameSync(file.path, finalPath);
      } else {
        // Garder le fichier dans temp pour l'instant
        finalPath = file.path;
      }
      
      // Créer l'enregistrement du fichier
      const fileNode = await Node.create({
        name: file.originalname,
        path: nodeId ? await buildNodePath(nodeId, category, subcategory, file.originalname) : `/temp/${tempId}/${file.filename}`,
        type: 'file',
        parent_id: nodeId ? parseInt(nodeId) : null,
        created_at: new Date(),
        data_status: 'new',
        description: `File uploaded as ${category || 'general'}${subcategory ? `/${subcategory}` : ''}`
      });
      
      const fileRecord = await File.create({
        node_id: fileNode.id,
        original_name: file.originalname,
        file_path: finalPath,
        size: file.size,
        mime_type: file.mimetype,
        category: category || 'general',
        subcategory: subcategory || null,
        additional_info: {
          temp_id: !nodeId ? tempId : null,
          upload_date: new Date().toISOString()
        }
      });
      
      fileRecords.push({
        id: fileNode.id,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        tempId: !nodeId ? tempId : null,
        category,
        subcategory
      });
    }
    
    return res.status(201).json({
      message: 'Fichiers téléchargés avec succès',
      files: fileRecords,
      tempId: !nodeId ? tempId : null
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'upload', error: error.message });
  }
};

// Fonction utilitaire pour construire le chemin du nœud
async function buildNodePath(nodeId, category, subcategory, filename) {
  const parentNode = await Node.findByPk(nodeId);
  if (!parentNode) throw new Error('Nœud parent introuvable');
  
  let nodePath = parentNode.path;
  // Ajouter la catégorie et sous-catégorie au chemin
  if (category) {
    nodePath += `/${category}`;
    if (subcategory) {
      nodePath += `/${subcategory}`;
    }
  }
  nodePath += `/${filename}`;
  
  return nodePath;
}

// Associer des fichiers temporaires à un node
exports.associateFiles = async (req, res) => {
  try {
    const { nodeId, tempId, category, subcategory } = req.body;
    
    if (!nodeId || !tempId) {
      return res.status(400).json({ message: 'nodeId et tempId sont requis' });
    }
    
    // Trouver le nœud parent
    const parentNode = await Node.findByPk(nodeId);
    if (!parentNode) {
      return res.status(404).json({ message: 'Nœud parent introuvable' });
    }
    
    // Récupérer tous les fichiers avec ce tempId
    const fileNodes = await Node.findAll({
      where: {
        path: {
          [Op.like]: `/temp/${tempId}/%`
        },
        type: 'file'
      }
    });
    
    if (fileNodes.length === 0) {
      return res.status(404).json({ message: 'Aucun fichier temporaire trouvé' });
    }
    
    // Déterminer le chemin physique du nœud parent
    const parentPath = buildPhysicalPath(parentNode.path);
    
    // Créer les dossiers de catégorie et sous-catégorie si nécessaire
    let targetDir = parentPath;
    
    if (category) {
      targetDir = path.join(targetDir, category);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      if (subcategory) {
        targetDir = path.join(targetDir, subcategory);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }
    }
    
    // Mettre à jour chaque fichier et le déplacer
    const updatedFiles = [];
    
    for (const fileNode of fileNodes) {
      // Récupérer les données du fichier
      const fileData = await File.findOne({ where: { node_id: fileNode.id } });
      
      if (!fileData) continue;
      
      // Construire le nouveau chemin du nœud
      const newNodePath = await buildNodePath(nodeId, category, subcategory, fileNode.name);
      
      // Mettre à jour le nœud du fichier
      await fileNode.update({
        path: newNodePath,
        parent_id: parseInt(nodeId)
      });
      
      // Déplacer le fichier physique
      const oldPath = fileData.file_path;
      const newPath = path.join(targetDir, path.basename(oldPath));
      
      fs.renameSync(oldPath, newPath);
      
      // Mettre à jour l'enregistrement du fichier
      const additionalInfo = fileData.additional_info || {};
      delete additionalInfo.temp_id;
      
      await fileData.update({
        file_path: newPath,
        category: category || fileData.category,
        subcategory: subcategory || fileData.subcategory,
        additional_info: additionalInfo
      });
      
      updatedFiles.push({
        id: fileNode.id,
        name: fileNode.name,
        path: newPath
      });
    }
    
    return res.status(200).json({
      message: `${updatedFiles.length} fichiers associés au node ${nodeId}`,
      files: updatedFiles
    });
  } catch (error) {
    console.error('Erreur lors de l\'association des fichiers:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

function buildPhysicalPath(nodePath) {
  const pathComponents = nodePath.split('/').filter(c => c.length > 0);
  let physicalPath = UPLOAD_BASE_DIR;
  
  for (const component of pathComponents) {
    physicalPath = path.join(physicalPath, component);
    if (!fs.existsSync(physicalPath)) {
      fs.mkdirSync(physicalPath, { recursive: true });
    }
  }
  
  return physicalPath;
}

// Récupérer tous les fichiers d'un nœud
exports.getFilesByNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { category, subcategory } = req.query;
    
    // Construire les conditions de recherche
    const conditions = {
      type: 'file',
      parent_id: nodeId
    };
    
    // Filtrer par catégorie et sous-catégorie si fournis
    const fileConditions = {};
    if (category) fileConditions.category = category;
    if (subcategory) fileConditions.subcategory = subcategory;
    
    // Récupérer les nœuds de fichiers
    const fileNodes = await Node.findAll({
      where: conditions,
      include: [
        {
          model: File,
          where: Object.keys(fileConditions).length > 0 ? fileConditions : undefined,
          required: true // Changé à true car nous voulons seulement les nœuds qui ont des fichiers associés
        }
      ]
    });
    
    // Formater la réponse
    const files = fileNodes.map(node => ({
      id: node.id,
      name: node.name,
      path: node.path,
      createdAt: node.created_at,
      size: node.File ? node.File.size : null,
      mimeType: node.File ? node.File.mime_type : null,
      category: node.File ? node.File.category : null,
      subcategory: node.File ? node.File.subcategory : null,
      type: node.File ? node.File.mime_type : 'application/octet-stream' // Ajout du type pour l'affichage des icônes
    }));
    
    return res.status(200).json({ files });
  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};


// Supprimer un fichier
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Récupérer le nœud du fichier et ses données
    const fileNode = await Node.findByPk(fileId);
    
    if (!fileNode || fileNode.type !== 'file') {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    const fileData = await File.findOne({ where: { node_id: fileId } });
    
    if (fileData) {
      // Supprimer le fichier physique
      if (fs.existsSync(fileData.file_path)) {
        fs.unlinkSync(fileData.file_path);
      }
      
      // Supprimer l'enregistrement dans la base de données
      await fileData.destroy();
    }
    
    // Supprimer le nœud
    await fileNode.destroy();
    
    return res.status(200).json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du fichier:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

//Telecharger un fichier
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Récupérer les données du fichier
    const fileData = await File.findOne({ 
      where: { node_id: fileId }
    });
    
    const nodeData = await Node.findOne({ 
      where: { id: fileId } 
    });
    
    if (!fileData || !nodeData) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Extraire juste le chemin du dossier parent, sans le nom du fichier
    const nodePath = path.dirname(nodeData.path);
    const relativePath = nodePath.replace(/^\//, '');
    
    // Construire le chemin du dossier parent
    const directoryPath = path.resolve(UPLOAD_BASE_DIR, relativePath);
    
    // Construire le chemin complet du fichier
    const finalFilePath = path.join(directoryPath, path.basename(fileData.file_path));
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(finalFilePath)) {
      return res.status(404).json({ 
        message: 'Fichier physique introuvable'
      });
    }
    
    // Téléchargement du fichier
    return res.download(finalFilePath, fileData.original_name);
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur', 
      erreur: error.message 
    });
  }
};

exports.getFileStats = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    // Vérifier si le nœud existe
    const node = await Node.findByPk(nodeId);
    if (!node) {
      return res.status(404).json({ message: 'Nœud non trouvé' });
    }
    
    // Compter par catégories
    const categories = await File.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('node_id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
      ],
      include: [{
        model: Node,
        where: {
          parent_id: nodeId
        }
      }],
      group: ['category']
    });
    
    // Compter par sous-catégories
    const subcategories = await File.findAll({
      attributes: [
        'category',
        'subcategory',
        [sequelize.fn('COUNT', sequelize.col('node_id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('size')), 'totalSize']
      ],
      include: [{
        model: Node,
        where: {
          parent_id: nodeId
        }
      }],
      group: ['category', 'subcategory']
    });
    
    // Retourner les statistiques
    return res.status(200).json({
      fileCount: categories.reduce((acc, cat) => acc + parseInt(cat.dataValues.count), 0),
      totalSize: categories.reduce((acc, cat) => acc + parseInt(cat.dataValues.totalSize), 0),
      byCategory: categories.map(cat => ({
        category: cat.category,
        count: parseInt(cat.dataValues.count),
        totalSize: parseInt(cat.dataValues.totalSize)
      })),
      bySubcategory: subcategories.map(subcat => ({
        category: subcat.category,
        subcategory: subcat.subcategory,
        count: parseInt(subcat.dataValues.count),
        totalSize: parseInt(subcat.dataValues.totalSize)
      }))
    });
  } catch (error) {
    console.error('Erreur lors de l\'obtention des statistiques de fichiers:', error);
    return res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};