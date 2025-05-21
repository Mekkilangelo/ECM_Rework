/**
 * Contrôleur de gestion des clients
 * Gère les opérations CRUD sur les clients
 */

const { clientService } = require('../services');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

/**
 * Récupère tous les clients avec pagination
 * @route GET /api/clients
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des clients
 */
const getClients = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, search } = req.query;
    const { sortBy, sortOrder } = req.query || { sortBy: 'modified_at', sortOrder: 'DESC' };
    
    logger.info('Récupération des clients', { 
      limit, 
      offset, 
      search,
      sortBy,
      sortOrder
    });
    
    // Déléguer au service
    const result = await clientService.getAllClients({
      limit,
      offset,
      search,
      sortBy,
      sortOrder
    });
    
    // Renvoyer la réponse paginée
    return apiResponse.paginated(
      res,
      result.clients,
      result.pagination,
      'Clients récupérés avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des clients: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère un client spécifique par son ID
 * @route GET /api/clients/:clientId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails du client
 */
const getClientById = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    
    logger.info(`Récupération du client #${clientId}`);
    
    // Déléguer au service
    const client = await clientService.getClientById(clientId);
    
    return apiResponse.success(res, client, 'Client récupéré avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération du client #${req.params.clientId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée un nouveau client
 * @route POST /api/clients
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Client créé
 */
const createClient = async (req, res, next) => {
  try {
    const clientData = req.body;
    
    logger.info('Création d\'un nouveau client', { 
      name: clientData.name, 
      country: clientData.country 
    });
    
    // Déléguer au service
    const newClient = await clientService.createClient(clientData);
    
    return apiResponse.success(
      res, 
      newClient, 
      'Client créé avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création du client: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour un client existant
 * @route PUT /api/clients/:clientId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Client mis à jour
 */
const updateClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const clientData = req.body;
    
    logger.info(`Mise à jour du client #${clientId}`);
    
    // Déléguer au service
    const updatedClient = await clientService.updateClient(clientId, clientData);
    
    return apiResponse.success(res, updatedClient, 'Client mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du client #${req.params.clientId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime un client et tous ses descendants
 * @route DELETE /api/clients/:clientId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    
    logger.info(`Suppression du client #${clientId}`);
    
    // Déléguer au service
    await clientService.deleteClient(clientId);
    
    return apiResponse.success(res, { deletedId: clientId }, 'Client supprimé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression du client #${req.params.clientId}: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
};