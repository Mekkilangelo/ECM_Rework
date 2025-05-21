/**
 * Service de gestion des fichiers
 * Contient la logique métier liée aux opérations sur les fichiers
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { Node, File, sequelize } = require('../models');
const { UPLOAD_BASE_DIR, TEMP_DIR } = require('../utils/fileStorage');
const { NotFoundError } = require('../utils/errors');

/**
 * Construit le chemin du nœud pour un fichier
 * @param {number} nodeId - ID du nœud parent
 * @param {string} category - Catégorie du fichier
 * @param {string} subcategory - Sous-catégorie du fichier
 * @param {string} filename - Nom du fichier
 * @returns {Promise<string>} Chemin du nœud
 */
const buildNodePath = async (nodeId, category, subcategory, filename) => {
  const parentNode = await Node.findByPk(nodeId);
  if (!parentNode) {
    throw new NotFoundError('Nœud parent introuvable');
  }
  
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
};

/**
 * Enregistre des fichiers téléchargés
 * @param {Array} files - Fichiers téléchargés
 * @param {Object} data - Données supplémentaires (nodeId, category, subcategory)
 * @returns {Promise<Object>} Résultat de l'opération
 */
const saveUploadedFiles = async (files, data) => {
  const { nodeId, category, subcategory } = data;
  
  // Si nodeId n'est pas fourni, nous stockons temporairement
  const tempId = nodeId || `temp-${uuidv4()}`;
  const fileRecords = [];
  
  // Utiliser une transaction pour garantir la cohérence des données
  const transaction = await sequelize.transaction();
  
  try {
    for (const file of files) {
      // Déterminer le chemin final du fichier
      let finalPath;
      
      if (nodeId) {
        // Créer le chemin du répertoire si nécessaire
        const dirPath = path.join(UPLOAD_BASE_DIR, nodeId.toString(), category || 'general', subcategory || '');
        fs.mkdirSync(dirPath, { recursive: true });
        
        // Déplacer le fichier de temp vers le chemin final
        finalPath = path.join(dirPath, file.filename);
        fs.renameSync(file.path, finalPath);
      } else {
        // Garder le fichier dans temp pour l'instant
        finalPath = file.path;
      }
      
      // Créer l'enregistrement du nœud
      const fileNode = await Node.create({
        name: file.originalname,
        path: nodeId ? await buildNodePath(nodeId, category, subcategory, file.originalname) : `/temp/${tempId}/${file.filename}`,
        type: 'file',
        parent_id: nodeId ? parseInt(nodeId) : null,
        created_at: new Date(),
        data_status: 'new',
        description: `File uploaded as ${category || 'general'}${subcategory ? `/${subcategory}` : ''}`
      }, { transaction });
      
      // Créer l'enregistrement du fichier
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
      }, { transaction });
      
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
    
    // Valider la transaction
    await transaction.commit();
    
    return {
      success: true,
      files: fileRecords,
      tempId
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Associe des fichiers temporaires à un nœud
 * @param {string} tempId - ID temporaire des fichiers
 * @param {number} nodeId - ID du nœud parent
 * @param {Object} options - Options supplémentaires (category, subcategory)
 * @returns {Promise<Object>} Résultat de l'opération
 */
const associateFilesToNode = async (tempId, nodeId, options = {}) => {
  const { category, subcategory } = options;
  
  // Utiliser une transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer les fichiers temporaires
    const tempFiles = await File.findAll({
      include: [{
        model: Node,
        where: {
          path: { [sequelize.Op.like]: `/temp/${tempId}/%` }
        }
      }]
    });
    
    if (!tempFiles.length) {
      throw new NotFoundError('Aucun fichier temporaire trouvé avec cet ID');
    }
    
    // Vérifier que le nœud parent existe
    const parentNode = await Node.findByPk(nodeId);
    if (!parentNode) {
      throw new NotFoundError('Nœud parent non trouvé');
    }
    
    // Créer le répertoire de destination si nécessaire
    const destDir = path.join(UPLOAD_BASE_DIR, nodeId.toString(), category || 'general', subcategory || '');
    fs.mkdirSync(destDir, { recursive: true });
    
    // Mettre à jour chaque fichier et le déplacer vers le répertoire final
    for (const file of tempFiles) {
      // Déplacer le fichier physique
      const fileName = path.basename(file.file_path);
      const destPath = path.join(destDir, fileName);
      fs.renameSync(file.file_path, destPath);
      
      // Mettre à jour les enregistrements
      await Node.update({
        parent_id: nodeId,
        path: await buildNodePath(nodeId, category, subcategory, file.Node.name),
        data_status: 'updated',
        modified_at: new Date()
      }, { 
        where: { id: file.node_id },
        transaction 
      });
      
      await File.update({
        file_path: destPath,
        category: category || file.category,
        subcategory: subcategory || file.subcategory,
        additional_info: {
          ...file.additional_info,
          associated_at: new Date().toISOString(),
          temp_id: null
        }
      }, { 
        where: { node_id: file.node_id },
        transaction 
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    return {
      success: true,
      count: tempFiles.length,
      nodeId
    };
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Récupère les détails d'un fichier
 * @param {number} fileId - ID du fichier à récupérer
 * @returns {Promise<Object>} Détails du fichier
 */
const getFileDetails = async (fileId) => {
  const file = await Node.findOne({
    where: { id: fileId, type: 'file' },
    include: [{
      model: File,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!file) {
    throw new NotFoundError('Fichier non trouvé');
  }
  
  return file;
};

/**
 * Supprime un fichier
 * @param {number} fileId - ID du fichier à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteFile = async (fileId) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Récupérer les détails du fichier
    const file = await File.findOne({
      include: [{
        model: Node,
        where: { id: fileId, type: 'file' }
      }]
    });
    
    if (!file) {
      throw new NotFoundError('Fichier non trouvé');
    }
    
    // Supprimer le fichier physique
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
    
    // Supprimer les enregistrements en base
    await File.destroy({
      where: { node_id: fileId },
      transaction
    });
    
    await Node.destroy({
      where: { id: fileId },
      transaction
    });
    
    // Valider la transaction
    await transaction.commit();
    
    return true;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  buildNodePath,
  saveUploadedFiles,
  associateFilesToNode,
  getFileDetails,
  deleteFile
};
