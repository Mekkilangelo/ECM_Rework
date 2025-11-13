/**
 * Contrôleur de gestion des pièces
 * Gère les opérations CRUD sur les pièces
 */

const { partService } = require('../services');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

/**
 * Récupère toutes les pièces avec pagination
 * @route GET /api/parts
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des pièces
 */
const getParts = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, parent_id, search } = req.query;
    const { sortBy, sortOrder } = req.query || { sortBy: 'modified_at', sortOrder: 'DESC' };
    
    logger.info('Récupération des pièces', { 
      limit, 
      offset, 
      parent_id, 
      search, 
      sortBy, 
      sortOrder 
    });
    
    // Déléguer au service
    const result = await partService.getAllParts({
      limit,
      offset,
      parent_id,
      sortBy,
      sortOrder,
      search
    });
    
    // Renvoyer la réponse paginée
    return apiResponse.paginated(
      res,
      result.parts,
      result.pagination,
      'Pièces récupérées avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des pièces: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère une pièce spécifique par son ID
 * @route GET /api/parts/:partId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails de la pièce
 */
const getPartById = async (req, res, next) => {
  try {
    const { partId } = req.params;
    
    logger.info(`Récupération de la pièce #${partId}`);
    
    // Déléguer au service
    const part = await partService.getPartById(partId);
    
    return apiResponse.success(res, part, 'Pièce récupérée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la pièce #${req.params.partId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée une nouvelle pièce
 * @route POST /api/parts
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Pièce créée
 */
const createPart = async (req, res, next) => {
  try {
    const partData = req.body;
    
    logger.info('Création d\'une nouvelle pièce', { 
      parent_id: partData.parent_id,
      designation: partData.designation 
    });
    
    // Déléguer au service
    const newPart = await partService.createPart(partData);
    
    return apiResponse.success(
      res, 
      newPart, 
      'Pièce créée avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création de la pièce: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour une pièce existante
 * @route PUT /api/parts/:partId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Pièce mise à jour
 */
const updatePart = async (req, res, next) => {
  try {
    const { partId } = req.params;
    const partData = req.body;
    
    logger.info(`Mise à jour de la pièce #${partId}`);
    
    // Déléguer au service
    const updatedPart = await partService.updatePart(partId, partData);
    
    return apiResponse.success(res, updatedPart, 'Pièce mise à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la pièce #${req.params.partId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime une pièce et tous ses descendants
 * @route DELETE /api/parts/:partId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deletePart = async (req, res, next) => {
  try {
    const { partId } = req.params;
    
    logger.info(`Suppression de la pièce #${partId}`);
    
    // Déléguer au service
    await partService.deletePart(partId);
    
    return apiResponse.success(res, { deletedId: partId }, 'Pièce supprimée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la pièce #${req.params.partId}: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart
};