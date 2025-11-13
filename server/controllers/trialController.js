/**
 * Contrôleur de gestion des trials
 * Gère les opérations CRUD sur les trials
 */

const { trialService } = require('../services');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

/**
 * Récupère tous les trials avec pagination
 * @route GET /api/trials
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des trials
 */
const getTrials = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, search, parent_id } = req.query;
    const { sortBy, sortOrder } = req.query || { sortBy: 'modified_at', sortOrder: 'DESC' };
    
    logger.info('Récupération des trials', { 
      limit, 
      offset, 
      search,
      parent_id,
      sortBy,
      sortOrder
    });
    
    // Déléguer au service
    const result = await trialService.getAllTrials({
      limit,
      offset,
      search,
      parent_id,
      sortBy,
      sortOrder
    });
    
    // Renvoyer la réponse paginée
    return apiResponse.paginated(
      res,
      result.trials,
      result.pagination,
      'Trials récupérés avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des trials: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère un trial spécifique par son ID
 * @route GET /api/trials/:trialId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails du trial
 */
const getTrialById = async (req, res, next) => {
  try {
    const { trialId } = req.params;
    
    logger.info(`Récupération du trial #${trialId}`);
    
    // Déléguer au service
    const trial = await trialService.getTrialById(trialId);
    
    return apiResponse.success(res, trial, 'Trial récupéré avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération du trial #${req.params.trialId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée un nouveau trial
 * @route POST /api/trials
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Trial créé
 */
const createTrial = async (req, res, next) => {
  try {
    const trialData = req.body;
    
    logger.info("Création d'un nouveau trial", { 
      parent_id: trialData.parent_id,
      trial_date: trialData.trial_date 
    });
    
    // Déléguer au service
    const newTrial = await trialService.createTrial(trialData);
    
    return apiResponse.success(
      res, 
      newTrial, 
      'Trial créé avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création du trial: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour un trial existant
 * @route PUT /api/trials/:trialId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Trial mis à jour
 */
const updateTrial = async (req, res, next) => {
  try {
    const { trialId } = req.params;
    const trialData = req.body;
    
    logger.info(`Mise à jour du trial #${trialId}`);
    
    // Déléguer au service
    const updatedTrial = await trialService.updateTrial(trialId, trialData);
    
    return apiResponse.success(res, updatedTrial, 'Trial mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du trial #${req.params.trialId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime un trial
 * @route DELETE /api/trials/:trialId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteTrial = async (req, res, next) => {
  try {
    const { trialId } = req.params;
    
    logger.info(`Suppression du trial #${trialId}`);
    
    // Déléguer au service
    await trialService.deleteTrial(trialId);
    
    return apiResponse.success(res, { deletedId: trialId }, 'Trial supprimé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression du trial #${req.params.trialId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère les spécifications d'un trial spécifique
 * @route GET /api/trials/:trialId/specs
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Spécifications du trial
 */
const getTrialSpecs = async (req, res, next) => {
  try {
    const { trialId } = req.params;
    const { parent_id } = req.query;
    
    logger.info(`Récupération des spécifications du trial #${trialId}`, { 
      trialId, 
      parent_id,
      query: req.query,
      url: req.originalUrl
    });
    
    // Déléguer au service
    const specs = await trialService.getTrialSpecs(trialId, parent_id);
    
    logger.info(`Spécifications récupérées avec succès pour le trial #${trialId}`);
    return apiResponse.success(res, specs, 'Spécifications du trial récupérées avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des spécifications du trial #${req.params.trialId}: ${error.message}`, { 
      stack: error.stack,
      name: error.name
    });
    next(error);
  }
};

module.exports = {
  getTrials,
  getTrialById,
  createTrial,
  updateTrial,
  deleteTrial,
  getTrialSpecs
};
