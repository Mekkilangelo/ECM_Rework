/**
 * Contrôleur de gestion des aciers
 * Gère les opérations CRUD sur les aciers
 */

const { steelService } = require('../services');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Récupère tous les aciers avec pagination
 * @route GET /api/steels
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des aciers
 */
const getSteels = async (req, res, next) => {
  try {
    const { search, filter } = req.query;
    const { limit, offset, sortBy, sortOrder } = req.pagination || {
      limit: 10,
      offset: 0,
      sortBy: 'grade',
      sortOrder: 'ASC'
    };
    
    logger.info('Récupération des aciers', { 
      limit, 
      offset, 
      sortBy, 
      sortOrder,
      search,
      filter
    });
    
    // Déléguer au service
    const result = await steelService.getAllSteels({
      limit,
      offset,
      sortBy,
      sortOrder,
      search,
      filter: filter ? JSON.parse(filter) : null
    });
    
    // Renvoyer la réponse paginée
    return apiResponse.paginated(
      res,
      result.steels,
      result.pagination,
      'Aciers récupérés avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des aciers: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère toutes les nuances d'acier
 * @route GET /api/steels/grades
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste des nuances d'acier
 */
const getSteelsGrades = async (req, res, next) => {
  try {
    logger.info('Récupération des nuances d\'acier');
    
    // Déléguer au service
    const grades = await steelService.getSteelGrades();
    
    return apiResponse.success(res, grades, 'Nuances d\'acier récupérées avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des nuances d'acier: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère un acier spécifique par son ID
 * @route GET /api/steels/:steelId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails de l'acier
 */
const getSteelById = async (req, res, next) => {
  try {
    const { steelId } = req.params;
    
    logger.info(`Récupération de l'acier #${steelId}`);
    
    // Déléguer au service
    const steel = await steelService.getSteelById(steelId);
    
    return apiResponse.success(res, steel, 'Acier récupéré avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l'acier #${req.params.steelId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée un nouvel acier
 * @route POST /api/steels
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Acier créé
 */
const createSteel = async (req, res, next) => {
  try {
    const steelData = req.body;
    
    logger.info('Création d\'un nouvel acier', { 
      grade: steelData.grade,
      standard: steelData.standard 
    });
    
    // Déléguer au service
    const createdSteel = await steelService.createSteel(steelData);
    
    return apiResponse.success(
      res, 
      createdSteel, 
      'Acier créé avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création de l'acier: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour un acier existant
 * @route PUT /api/steels/:steelId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Acier mis à jour
 */
const updateSteel = async (req, res, next) => {
  try {
    const { steelId } = req.params;
    const steelData = req.body;
    
    logger.info(`Mise à jour de l'acier #${steelId}`);
    
    // Déléguer au service
    const updatedSteel = await steelService.updateSteel(steelId, steelData);
    
    return apiResponse.success(res, updatedSteel, 'Acier mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'acier #${req.params.steelId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime un acier
 * @route DELETE /api/steels/:steelId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteSteel = async (req, res, next) => {
  try {
    const { steelId } = req.params;
    
    logger.info(`Suppression de l'acier #${steelId}`);
    
    // Déléguer au service
    await steelService.deleteSteel(steelId);
    
    return apiResponse.success(res, { deletedId: steelId }, 'Acier supprimé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'acier #${req.params.steelId}: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  getSteels,
  getSteelsGrades,
  getSteelById,
  createSteel,
  updateSteel,
  deleteSteel
};
