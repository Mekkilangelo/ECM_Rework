// controllers/fileController.js
const { Node, File, sequelize } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getMimeTypeFromExtension } = require('../middleware/mimeTypes');
const { Op } = require('sequelize');
const { UPLOAD_BASE_DIR, TEMP_DIR } = require('../utils/fileStorage');

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
    console.log(`Using tempId: ${tempId}`);
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
      tempId: tempId // Très important!
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
    
    console.log("=== ASSOCIATE FILES ===");
    console.log("Request body:", req.body);
    console.log(`nodeId: ${nodeId}, tempId: ${tempId}, category: ${category}, subcategory: ${subcategory}`);
    console.log("TEMP_DIR:", TEMP_DIR);
    
    if (!nodeId || !tempId) {
      return res.status(400).json({ message: 'nodeId et tempId sont requis' });
    }
    
    // Trouver le nœud parent
    const parentNode = await Node.findByPk(nodeId);
    if (!parentNode) {
      return res.status(404).json({ message: 'Nœud parent introuvable' });
    }
    
    // Vérifier si le dossier temporaire existe directement
    const tempFolderPath = path.join(TEMP_DIR, tempId);
    console.log(`Checking temp folder path: ${tempFolderPath}`);
    console.log(`Temp folder exists: ${fs.existsSync(tempFolderPath)}`);
    
    if (fs.existsSync(tempFolderPath)) {
      // Lister tous les fichiers dans ce dossier
      const filesInFolder = fs.readdirSync(tempFolderPath);
      console.log(`Files in temp folder (${filesInFolder.length}):`, filesInFolder);
    }
    
    // Rechercher les fichiers avec ce tempId dans la base de données
    const fileNodes = await Node.findAll({
      where: {
        path: {
          [Op.like]: `/temp/${tempId}/%`
        },
        type: 'file'
      },
      include: [{ model: File }]
    });
    
    console.log(`Found ${fileNodes.length} files with tempId ${tempId} in database`);
    
    // IMPORTANT: Si aucun fichier trouvé, essayer d'autres méthodes
    if (fileNodes.length === 0) {
      return res.status(404).json({
        message: 'Aucun fichier temporaire trouvé dans la base de données',
        tempId,
        tempFolder: tempFolderPath
      });
    }
    
    // Pour chaque fichier trouvé
    for (const fileNode of fileNodes) {
      try {
        // Construire le nouveau chemin logique
        let newLogicalPath = parentNode.path;
        if (category) newLogicalPath += `/${category}`;
        if (subcategory) newLogicalPath += `/${subcategory}`;
        newLogicalPath += `/${fileNode.name}`;
        
        // CORRECTION IMPORTANTE: Utiliser le chemin physique stocké dans File.file_path
        // au lieu de reconstruire le chemin à partir du chemin logique
        const oldPhysicalPath = fileNode.File?.file_path || path.join(UPLOAD_BASE_DIR, fileNode.path);
        
        // Créer le nouveau chemin physique
        const newPhysicalPath = path.join(UPLOAD_BASE_DIR, newLogicalPath.replace(/^\//, ''));
        const newDir = path.dirname(newPhysicalPath);
        
        console.log(`Moving file:`);
        console.log(`- From: ${oldPhysicalPath}`);
        console.log(`- To: ${newPhysicalPath}`);
        console.log(`- File exists at source: ${fs.existsSync(oldPhysicalPath)}`);
        
        // Vérifier si le fichier source existe
        if (!fs.existsSync(oldPhysicalPath)) {
          // Essayer une seconde méthode: vérifier directement dans le dossier temp
          const alternativePath = path.join(tempFolderPath, path.basename(fileNode.path));
          console.log(`Trying alternative path: ${alternativePath}`);
          
          if (fs.existsSync(alternativePath)) {
            console.log(`File found at alternative path!`);
            // Utiliser ce chemin à la place
            oldPhysicalPath = alternativePath;
          } else {
            console.error(`Source file not found at any location`);
            return res.status(404).json({
              message: 'Fichier source introuvable',
              path: oldPhysicalPath,
              alternativePath: alternativePath
            });
          }
        }
        
        // Créer le répertoire cible s'il n'existe pas
        if (!fs.existsSync(newDir)) {
          fs.mkdirSync(newDir, { recursive: true });
        }
        
        // Déplacer le fichier
        fs.renameSync(oldPhysicalPath, newPhysicalPath);
        console.log(`File successfully moved to ${newPhysicalPath}`);
        
        // Mettre à jour le chemin dans Node
        await fileNode.update({
          path: newLogicalPath,
          parent_id: nodeId
        });
        
        // Mettre à jour les infos dans File si disponible
        if (fileNode.File) {
          await fileNode.File.update({
            file_path: newPhysicalPath,  // IMPORTANT: Mettre à jour aussi le chemin physique
            category: category || fileNode.File.category,
            subcategory: subcategory || fileNode.File.subcategory
          });
        }
      } catch (err) {
        console.error(`Error processing file ${fileNode.id}:`, err);
        return res.status(500).json({
          message: 'Erreur lors du traitement d\'un fichier',
          error: err.message,
          fileId: fileNode.id
        });
      }
    }
    
    return res.status(200).json({
      message: 'Fichiers associés avec succès',
      count: fileNodes.length
    });
  } catch (error) {
    console.error('Erreur lors de l\'association de fichiers:', error);
    return res.status(500).json({
      message: 'Erreur lors de l\'association de fichiers',
      error: error.message,
      stack: error.stack
    });
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

// Ajouter cette méthode à votre fileController.js
exports.getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log(`======= GET FILE BY ID =======`);
    console.log(`Request for file ID: ${fileId}`);
    console.log(`Request URL: ${req.originalUrl}`);
    console.log(`Request headers:`, req.headers);
    
    // Récupérer les données du fichier
    const fileData = await File.findOne({ 
      where: { node_id: fileId }
    });
    
    if (!fileData) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(fileData.file_path)) {
      return res.status(404).json({ 
        message: 'Fichier physique introuvable',
        path: fileData.file_path
      });
    }
    
    // Servir le fichier
    res.setHeader('Content-Type', fileData.mime_type);
    fs.createReadStream(fileData.file_path).pipe(res);
    
  } catch (error) {
    console.error('Erreur lors de la récupération du fichier:', error);
    return res.status(500).json({ 
      message: 'Erreur serveur', 
      erreur: error.message 
    });
  }
};