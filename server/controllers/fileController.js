// controllers/fileController.js
const { Node, File } = require('../models');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

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
      const fileRecord = await File.create({
        node_id: nodeId ? parseInt(nodeId) : null,
        original_name: file.originalname,
        file_path: file.path,
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
        id: fileRecord.node_id,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        tempId: !nodeId ? tempId : null
      });
    }
    
    return res.status(201).json({
      message: 'Fichiers téléchargés avec succès',
      files: fileRecords,
      tempId: !nodeId ? tempId : null
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'upload' });
  }
};

// Nouvelle méthode pour associer des fichiers temporaires à un node
exports.associateFiles = async (req, res) => {
  try {
    const { nodeId, tempId } = req.body;
    
    if (!nodeId || !tempId) {
      return res.status(400).json({ message: 'nodeId et tempId sont requis' });
    }
    
    // Rechercher tous les fichiers temporaires avec ce tempId
    const filesToUpdate = await File.findAll({
      where: {
        node_id: null,
        additional_info: {
          temp_id: tempId
        }
      }
    });
    
    if (filesToUpdate.length === 0) {
      return res.status(404).json({ message: 'Aucun fichier temporaire trouvé' });
    }
    
    // Mettre à jour chaque fichier avec le nodeId réel
    for (const file of filesToUpdate) {
      const additionalInfo = file.additional_info;
      delete additionalInfo.temp_id;
      
      await file.update({
        node_id: parseInt(nodeId),
        additional_info: additionalInfo
      });
      
      // Déplacer le fichier vers son emplacement définitif
      const oldPath = file.file_path;
      const newDir = path.join(path.dirname(oldPath), '..', nodeId.toString());
      
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }
      
      const newPath = path.join(newDir, path.basename(oldPath));
      fs.renameSync(oldPath, newPath);
      
      // Mettre à jour le chemin du fichier dans la base de données
      await file.update({ file_path: newPath });
    }
    
    return res.status(200).json({
      message: `${filesToUpdate.length} fichiers associés au node ${nodeId}`,
      updatedCount: filesToUpdate.length
    });
  } catch (error) {
    console.error('Erreur lors de l\'association des fichiers:', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Autres méthodes existantes...