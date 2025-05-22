const { nodeService } = require('../services');
const apiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * Remplace la procédure p_get_nodes
 * Récupère les nœuds d'un type spécifique avec pagination
 */
exports.getNodes = async (req, res) => {
  try {
    const { ancestorId = 0, type, depth = 1, limit = 10, offset = 0 } = req.query;
    
    logger.info(`Récupération des nœuds de type ${type}`, {
      ancestorId,
      type,
      depth,
      limit,
      offset
    });
    
    // Déléguer au service
    const nodes = await nodeService.getNodes({
      ancestorId,
      type,
      depth,
      limit,
      offset
    });

    return apiResponse.success(res, nodes, 'Nœuds récupérés avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des nœuds: ${error.message}`, error);
    
    if (error.name === 'ValidationError') {
      return apiResponse.error(res, error.message, 400);
    }
    
    return apiResponse.error(res, 'Erreur lors de la récupération des nœuds', 500);
  }
};

/**
 * Remplace la procédure p_get_node_details
 * Récupère les détails d'un nœud spécifique
 */
exports.getNodeDetails = async (req, res) => {
  try {
    const { nodeId, type } = req.params;
    
    logger.info(`Récupération des détails du nœud #${nodeId} de type ${type}`);
    
    // Déléguer au service
    const node = await nodeService.getNodeDetails(nodeId, type);
    
    return apiResponse.success(res, node, 'Détails du nœud récupérés avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des détails du nœud: ${error.message}`, error);
    
    if (error.name === 'ValidationError') {
      return apiResponse.error(res, error.message, 400);
    } else if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    
    return apiResponse.error(res, 'Erreur lors de la récupération des détails du nœud', 500);
  }
};

/**
 * Remplace la procédure p_get_total
 * Compte le nombre total de nœuds d'un type spécifique
 */
exports.getTotalNodes = async (req, res) => {
  try {
    const { ancestorId = 0, type } = req.query;
    
    logger.info(`Comptage des nœuds de type ${type}`, { ancestorId });
    
    // Déléguer au service
    const count = await nodeService.getTotalNodes({
      ancestorId,
      type
    });
    
    return apiResponse.success(res, { total: count }, 'Comptage des nœuds effectué avec succès');
  } catch (error) {
    logger.error(`Erreur lors du comptage des nœuds: ${error.message}`, error);
    
    if (error.name === 'ValidationError') {
      return apiResponse.error(res, error.message, 400);
    }
    
    return apiResponse.error(res, 'Erreur lors du comptage des nœuds', 500);
  }
};

/**
 * Fonction pour créer un nouveau nœud et ses relations de hiérarchie
 */
exports.createNode = async (req, res) => {
  try {
    const { name, type, parentId, data, description } = req.body;
    
    logger.info(`Création d'un nouveau nœud de type ${type}`, {
      name,
      parentId,
      type
    });
    
    // Déléguer au service
    const newNode = await nodeService.createNode({
      name,
      type,
      parentId,
      data,
      description
    });
    
    return apiResponse.success(res, newNode, 'Nœud créé avec succès', 201);
  } catch (error) {
    logger.error(`Erreur lors de la création du nœud: ${error.message}`, error);
    
    if (error.name === 'ValidationError') {
      return apiResponse.error(res, error.message, 400);
    } else if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    
    return apiResponse.error(res, 'Erreur lors de la création du nœud', 500);
  }
};

/**
 * Fonction pour mettre à jour un nœud existant
 */
exports.updateNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { name, data } = req.body;
    
    logger.info(`Mise à jour du nœud #${nodeId}`, {
      name: name || 'inchangé',
      dataChanged: !!data
    });
    
    // Déléguer au service
    const updatedNode = await nodeService.updateNode(nodeId, {
      name,
      data
    });
    
    return apiResponse.success(res, updatedNode, 'Nœud mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du nœud: ${error.message}`, error);
    
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    
    return apiResponse.error(res, 'Erreur lors de la mise à jour du nœud', 500);
  }
};

/**
 * Fonction pour supprimer un nœud et tous ses descendants
 */
exports.deleteNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    logger.info(`Suppression du nœud #${nodeId}`);
    
    // Déléguer au service
    await nodeService.deleteNode(nodeId);
    
    return apiResponse.success(res, { deletedId: nodeId }, 'Nœud supprimé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression du nœud: ${error.message}`, error);
    
    if (error.name === 'NotFoundError') {
      return apiResponse.error(res, error.message, 404);
    }
    
    return apiResponse.error(res, 'Erreur lors de la suppression du nœud', 500);
  }
};

/**
 * Fonction pour vider toutes les tables de la base de données
 * Permet de réinitialiser complètement les données
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


exports.getTable = async (req, res) => {
  try {
    const { parentId = null, limit = 10, page = 1 } = req.query;
    
    logger.info(`Récupération de la table hiérarchique`, {
      parentId,
      limit,
      page
    });
    
    // Déléguer au service
    const result = await nodeService.getTable({
      parentId,
      limit,
      page
    });
    
    return apiResponse.success(res, result, 'Table hiérarchique récupérée avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la table: ${error.message}`, error);
    return apiResponse.error(res, 'Erreur lors de la récupération de la table hiérarchique', 500);
  }
};


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




