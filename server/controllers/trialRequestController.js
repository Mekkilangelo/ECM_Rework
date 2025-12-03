/**
 * Controller de gestion des demandes d'essai (trial requests)
 * Gère les opérations CRUD sur les demandes d'essai
 */

const { trialRequestService } = require('../services');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Récupère toutes les demandes d'essai avec pagination
 * @route GET /api/trial-requests
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des demandes d'essai
 */
const getTrialRequests = async (req, res, next) => {
  try {
    const { parent_id, search } = req.query;
    const { limit, offset, sortBy, sortOrder } = req.pagination || {
      limit: 10,
      offset: 0,
      sortBy: 'modified_at',
      sortOrder: 'DESC'
    };
    
    logger.info('Récupération des demandes d\'essai', { 
      parent_id, 
      limit, 
      offset, 
      sortBy, 
      sortOrder 
    });
    
    // Déléguer au service
    const result = await trialRequestService.getAllTrialRequests({
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
      result.trial_requests,
      result.pagination,
      'Demandes d\'essai récupérées avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des demandes d'essai: ${error.message}`, error);
    next(error);
  }
};


/**
 * Récupère une demande d'essai spécifique par son ID
 * @route GET /api/trial-requests/:trialRequestId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails de la demande d'essai
 */
const getTrialRequestById = async (req, res, next) => {
  try {
    const { trialRequestId } = req.params;
    
    logger.info(`Récupération de la demande d'essai #${trialRequestId}`);
    
    // Déléguer au service
    const trialRequest = await trialRequestService.getTrialRequestById(trialRequestId);
    
    return apiResponse.success(res, trialRequest, 'Demande d\'essai récupérée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la demande d'essai #${req.params.trialRequestId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée une nouvelle demande d'essai
 * @route POST /api/trial-requests
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Demande d'essai créée
 */
const createTrialRequest = async (req, res, next) => {
  try {
    const trialRequestData = req.body;
    
    logger.info('Création d\'une nouvelle demande d\'essai', { 
      parent_id: trialRequestData.parent_id,
      trial_request_number: trialRequestData.trial_request_number 
    });
    
    // Déléguer au service
    const createdTrialRequest = await trialRequestService.createTrialRequest(trialRequestData);
    
    return apiResponse.success(
      res, 
      createdTrialRequest, 
      'Demande d\'essai créée avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création de la demande d'essai: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour une demande d'essai existante
 * @route PUT /api/trial-requests/:trialRequestId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Demande d'essai mise à jour
 */
const updateTrialRequest = async (req, res, next) => {
  try {
    const { trialRequestId } = req.params;
    const trialRequestData = req.body;
    
    logger.info(`Mise à jour de la demande d'essai #${trialRequestId}`);
    
    // Déléguer au service
    const updatedTrialRequest = await trialRequestService.updateTrialRequest(trialRequestId, trialRequestData);
    
    return apiResponse.success(res, updatedTrialRequest, 'Demande d\'essai mise à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la demande d'essai #${req.params.trialRequestId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime une demande d'essai
 * @route DELETE /api/trial-requests/:trialRequestId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteTrialRequest = async (req, res, next) => {
  try {
    const { trialRequestId } = req.params;
    
    logger.info(`Suppression de la demande d'essai #${trialRequestId}`);
    
    // Déléguer au service
    await trialRequestService.deleteTrialRequest(trialRequestId);
    
    return apiResponse.success(res, { deletedId: trialRequestId }, 'Demande d\'essai supprimée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la demande d'essai #${req.params.trialRequestId}: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  getTrialRequests,
  getTrialRequestById,
  createTrialRequest,
  updateTrialRequest,
  deleteTrialRequest
};


