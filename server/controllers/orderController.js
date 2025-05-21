/**
 * Controller de gestion des commandes
 * Gère les opérations CRUD sur les commandes
 */

const { orderService } = require('../services');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { ValidationError } = require('../utils/errors');

/**
 * Récupère toutes les commandes avec pagination
 * @route GET /api/orders
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des commandes
 */
const getOrders = async (req, res, next) => {
  try {
    const { parent_id, search } = req.query;
    const { limit, offset, sortBy, sortOrder } = req.pagination || {
      limit: 10,
      offset: 0,
      sortBy: 'modified_at',
      sortOrder: 'DESC'
    };
    
    logger.info('Récupération des commandes', { 
      parent_id, 
      limit, 
      offset, 
      sortBy, 
      sortOrder 
    });
    
    // Déléguer au service
    const result = await orderService.getAllOrders({
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
      result.orders,
      result.pagination,
      'Commandes récupérées avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des commandes: ${error.message}`, error);
    next(error);
  }
};


/**
 * Récupère une commande spécifique par son ID
 * @route GET /api/orders/:orderId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails de la commande
 */
const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    logger.info(`Récupération de la commande #${orderId}`);
    
    // Déléguer au service
    const order = await orderService.getOrderById(orderId);
    
    return apiResponse.success(res, order, 'Commande récupérée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la commande #${req.params.orderId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée une nouvelle commande
 * @route POST /api/orders
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Commande créée
 */
const createOrder = async (req, res, next) => {
  try {
    const orderData = req.body;
    
    logger.info('Création d\'une nouvelle commande', { 
      parent_id: orderData.parent_id,
      order_number: orderData.order_number 
    });
    
    // Déléguer au service
    const createdOrder = await orderService.createOrder(orderData);
    
    return apiResponse.success(
      res, 
      createdOrder, 
      'Commande créée avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création de la commande: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour une commande existante
 * @route PUT /api/orders/:orderId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Commande mise à jour
 */
const updateOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const orderData = req.body;
    
    logger.info(`Mise à jour de la commande #${orderId}`);
    
    // Déléguer au service
    const updatedOrder = await orderService.updateOrder(orderId, orderData);
    
    return apiResponse.success(res, updatedOrder, 'Commande mise à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la commande #${req.params.orderId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime une commande
 * @route DELETE /api/orders/:orderId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    logger.info(`Suppression de la commande #${orderId}`);
    
    // Déléguer au service
    await orderService.deleteOrder(orderId);
    
    return apiResponse.success(res, { deletedId: orderId }, 'Commande supprimée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la commande #${req.params.orderId}: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
};


