/**
 * Contrôleur de gestion des fichiers
 * Gère les opérations CRUD sur les fichiers ainsi que leur stockage physique
 */

const fs = require('fs');
const { fileService } = require('../services');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');
const { ValidationError } = require('../utils/errors');

/**
 * Télécharge des fichiers vers le serveur
 * @route POST /api/files/upload
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Information sur les fichiers téléchargés
 */
const uploadFiles = async (req, res) => {
  try {
  const { nodeId, category, subcategory } = req.body;
  
    const files = req.files;
    
    if (!files || files.length === 0) {
      return apiResponse.error(res, 'Aucun fichier fourni', 400);
    }
    
    logger.info(`Téléchargement de fichiers`, { 
      nodeId, 
      category, 
      subcategory, 
      fileCount: files.length 
    });
      // Déléguer au service
    const result = await fileService.saveUploadedFiles(files, {
      nodeId,
      category,
      subcategory
    }, req);
    
    return apiResponse.success(
      res, 
      {
        files: result.files,
        tempId: result.tempId
      }, 
      'Fichiers téléchargés avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de l'upload des fichiers: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Associe des fichiers temporaires à un nœud existant
 * @route POST /api/files/associate
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Confirmation de l'association
 */
const associateFiles = async (req, res) => {
  try {
    const { nodeId, tempId, category, subcategory } = req.body;
    
    logger.info(`Association de fichiers temporaires`, { 
      nodeId, 
      tempId, 
      category, 
      subcategory 
    });
    
    if (!nodeId || !tempId) {
      return apiResponse.error(res, 'nodeId et tempId sont requis', 400);
    }
    
    // Déléguer au service
    const result = await fileService.associateFilesToNode(tempId, nodeId, { 
      category, 
      subcategory 
    });
    
    return apiResponse.success(
      res, 
      { count: result.count }, 
      'Fichiers associés avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de l'association de fichiers: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Récupère tous les fichiers associés à un nœud
 * @route GET /api/files/node/:nodeId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Liste des fichiers associés au nœud
 */
const getFilesByNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { category, subcategory } = req.query;
    
    logger.info(`Récupération des fichiers par nœud`, { 
      nodeId, 
      category, 
      subcategory 
    });
    
    // Déléguer au service
    const result = await fileService.getAllFilesByNode({
      nodeId,
      category,
      subcategory
    });
    
    return apiResponse.success(res, { files: result.files }, 'Fichiers récupérés avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des fichiers: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Récupère un fichier spécifique par son ID
 * @route GET /api/files/:fileId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Contenu du fichier
 */
const getFileById = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    logger.info(`Récupération du fichier #${fileId}`);
    
    // Déléguer au service
    const fileData = await fileService.getFileById(fileId);
    
    // Servir le fichier
    res.setHeader('Content-Type', fileData.mime_type);
    fs.createReadStream(fileData.file_path).pipe(res);
    
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    logger.error(`Erreur lors de la récupération du fichier: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Télécharge un fichier
 * @route GET /api/files/:fileId/download
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Fichier à télécharger
 */
const downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    logger.info(`Téléchargement du fichier #${fileId}`);
    
    // Déléguer au service
    const fileInfo = await fileService.downloadFile(fileId);
    
    // Définir les headers appropriés pour le téléchargement
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Téléchargement du fichier
    return res.download(fileInfo.filePath, fileInfo.originalName);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    logger.error(`Erreur lors du téléchargement du fichier: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Supprime un fichier
 * @route DELETE /api/files/:fileId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Confirmation de suppression
 */
const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    logger.info(`Suppression du fichier #${fileId}`);
    
    // Déléguer au service
    await fileService.deleteFile(fileId);
    
    return apiResponse.success(
      res, 
      { deletedId: fileId }, 
      'Fichier supprimé avec succès'
    );
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    logger.error(`Erreur lors de la suppression du fichier: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Récupère les statistiques des fichiers pour un nœud
 * @route GET /api/files/stats/:nodeId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Statistiques des fichiers
 */
const getFileStats = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    logger.info(`Récupération des statistiques de fichiers pour le nœud #${nodeId}`);
    
    // Déléguer au service
    const stats = await fileService.getFileStats(nodeId);
    
    return apiResponse.success(res, stats, 'Statistiques de fichiers récupérées avec succès');
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    logger.error(`Erreur lors de l'obtention des statistiques de fichiers: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

/**
 * Met à jour un fichier (changement de parent, nom, catégorie)
 * @route PUT /api/files/:fileId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {Object} Fichier mis à jour
 */
const updateFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { newParentId, category, subcategory, name } = req.body;
    
    // Validation des données
    if (newParentId && !Number.isInteger(parseInt(newParentId))) {
      return apiResponse.error(res, 'ID du nouveau parent invalide', 400);
    }
    
    logger.info(`Mise à jour du fichier #${fileId}`, { 
      newParentId, 
      category, 
      subcategory, 
      name 
    });
    
    // Déléguer au service
    const result = await fileService.updateFile(parseInt(fileId), {
      newParentId: newParentId ? parseInt(newParentId) : undefined,
      category,
      subcategory,
      name
    });
    
    return apiResponse.success(
      res, 
      result, 
      'Fichier mis à jour avec succès'
    );
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    if (error.name === 'ValidationError') {
      return apiResponse.error(res, error.message, 400);
    }
    logger.error(`Erreur lors de la mise à jour du fichier: ${error.message}`, error);
    return apiResponse.error(res, error.message, 500);
  }
};

module.exports = {
  uploadFiles,
  associateFiles,
  getFilesByNode,
  getFileById,
  downloadFile,
  deleteFile,
  getFileStats,
  updateFile
};