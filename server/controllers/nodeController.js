/**
 * Contrôleur de gestion des nœuds
 * 
 * Note : Ce contrôleur contient uniquement les opérations transversales
 * sur les nœuds. Les opérations CRUD spécifiques sont gérées par
 * les contrôleurs dédiés (clientController, orderController, etc.)
 */

const { nodeService } = require('../services');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Met à jour le statut d'un nœud (new → opened)
 * Utilisé par le dashboard pour marquer les éléments comme "lus"
 */
exports.updateNodeStatus = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { status } = req.body;
    
    logger.info(`Mise à jour du statut du nœud #${nodeId}`, { status });
    
    // Déléguer au service
    const result = await nodeService.updateNodeStatus(nodeId, status);
    
    return apiResponse.success(res, result, 'Statut mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du statut du nœud: ${error.message}`, error);
    
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    
    return apiResponse.error(res, 'Erreur lors de la mise à jour du statut', 500);
  }
};

/**
 * Supprime tous les nœuds (réinitialisation complète)
 * Utile pour les environnements de développement/test
 */
exports.deleteNodes = async (req, res) => {
  try {
    logger.info('Début de la procédure de suppression de toutes les données');
    
    // Déléguer au service
    const result = await nodeService.deleteAllNodes();
    
    return apiResponse.success(res, {
      tables: result.tables
    }, 'Toutes les tables ont été vidées avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression des données: ${error.message}`, error);
    return apiResponse.error(res, 'Erreur lors de la suppression des données', 500);
  }
};




