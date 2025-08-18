/**
 * Utilitaires pour la gestion de la hiérarchie des nœuds
 * Fournit des fonctions pour mettre à jour les ancêtres lors de modifications
 */

const { node: Node, closure: Closure } = require('../models');
const logger = require('./logger');

/**
 * Met à jour le modified_at d'un nœud et de tous ses ancêtres
 * @param {number} nodeId - ID du nœud modifié
 * @param {Object} transaction - Transaction Sequelize (optionnelle)
 * @returns {Promise<void>}
 */
const updateAncestorsModifiedAt = async (nodeId, transaction = null) => {
  try {
    const now = new Date();
    
    logger.info(`Mise à jour du modified_at pour le nœud #${nodeId} et ses ancêtres`);
    
    // 1. Mettre à jour le nœud lui-même
    await Node.update(
      { modified_at: now },
      { 
        where: { id: nodeId },
        transaction
      }
    );
    
    // 2. Récupérer tous les ancêtres via la table Closure
    const ancestorClosures = await Closure.findAll({
      where: { 
        descendant_id: nodeId,
        depth: { [require('sequelize').Op.gt]: 0 } // Exclure la relation avec soi-même
      },
      transaction
    });
    
    if (ancestorClosures.length > 0) {
      // 3. Extraire les IDs des ancêtres
      const ancestorIds = ancestorClosures.map(closure => closure.ancestor_id);
      
      logger.info(`Mise à jour de ${ancestorIds.length} ancêtres pour le nœud #${nodeId}: [${ancestorIds.join(', ')}]`);
      
      // 4. Mettre à jour tous les ancêtres en une seule requête
      await Node.update(
        { modified_at: now },
        {
          where: { id: ancestorIds },
          transaction
        }
      );
      
      logger.info(`Modified_at mis à jour avec succès pour le nœud #${nodeId} et ${ancestorIds.length} ancêtres`);
    } else {
      logger.info(`Aucun ancêtre trouvé pour le nœud #${nodeId}, seul le nœud lui-même a été mis à jour`);
    }
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du modified_at pour le nœud #${nodeId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Met à jour le modified_at de plusieurs nœuds et de tous leurs ancêtres
 * Utile pour les opérations en lot
 * @param {Array<number>} nodeIds - IDs des nœuds modifiés
 * @param {Object} transaction - Transaction Sequelize (optionnelle)
 * @returns {Promise<void>}
 */
const updateMultipleAncestorsModifiedAt = async (nodeIds, transaction = null) => {
  try {
    const now = new Date();
    
    logger.info(`Mise à jour du modified_at pour ${nodeIds.length} nœuds et leurs ancêtres: [${nodeIds.join(', ')}]`);
    
    // 1. Mettre à jour tous les nœuds fournis
    await Node.update(
      { modified_at: now },
      { 
        where: { id: nodeIds },
        transaction
      }
    );
    
    // 2. Récupérer tous les ancêtres pour tous les nœuds
    const ancestorClosures = await Closure.findAll({
      where: { 
        descendant_id: nodeIds,
        depth: { [require('sequelize').Op.gt]: 0 }
      },
      transaction
    });
    
    if (ancestorClosures.length > 0) {
      // 3. Extraire les IDs uniques des ancêtres
      const ancestorIds = [...new Set(ancestorClosures.map(closure => closure.ancestor_id))];
      
      logger.info(`Mise à jour de ${ancestorIds.length} ancêtres uniques pour les nœuds [${nodeIds.join(', ')}]`);
      
      // 4. Mettre à jour tous les ancêtres
      await Node.update(
        { modified_at: now },
        {
          where: { id: ancestorIds },
          transaction
        }
      );
      
      logger.info(`Modified_at mis à jour avec succès pour ${nodeIds.length} nœuds et ${ancestorIds.length} ancêtres`);
    } else {
      logger.info(`Aucun ancêtre trouvé pour les nœuds [${nodeIds.join(', ')}]`);
    }
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du modified_at pour les nœuds [${nodeIds.join(', ')}]: ${error.message}`, error);
    throw error;
  }
};

/**
 * Récupère tous les ancêtres d'un nœud
 * @param {number} nodeId - ID du nœud
 * @param {Object} transaction - Transaction Sequelize (optionnelle)
 * @returns {Promise<Array>} Liste des ancêtres avec leurs informations
 */
const getNodeAncestors = async (nodeId, transaction = null) => {
  try {
    const ancestorClosures = await Closure.findAll({
      where: { 
        descendant_id: nodeId,
        depth: { [require('sequelize').Op.gt]: 0 }
      },
      include: [{
        model: Node,
        as: 'ancestor',
        attributes: ['id', 'name', 'type', 'path', 'modified_at']
      }],
      order: [['depth', 'ASC']], // Du plus proche au plus éloigné
      transaction
    });
    
    return ancestorClosures.map(closure => ({
      id: closure.ancestor_id,
      depth: closure.depth,
      ...closure.ancestor.dataValues
    }));
  } catch (error) {
    logger.error(`Erreur lors de la récupération des ancêtres pour le nœud #${nodeId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Récupère tous les descendants d'un nœud
 * @param {number} nodeId - ID du nœud
 * @param {Object} transaction - Transaction Sequelize (optionnelle)
 * @returns {Promise<Array>} Liste des descendants avec leurs informations
 */
const getNodeDescendants = async (nodeId, transaction = null) => {
  try {
    const descendantClosures = await Closure.findAll({
      where: { 
        ancestor_id: nodeId,
        depth: { [require('sequelize').Op.gt]: 0 }
      },
      include: [{
        model: Node,
        as: 'descendant',
        attributes: ['id', 'name', 'type', 'path', 'modified_at']
      }],
      order: [['depth', 'ASC']], // Du plus proche au plus éloigné
      transaction
    });
    
    return descendantClosures.map(closure => ({
      id: closure.descendant_id,
      depth: closure.depth,
      ...closure.descendant.dataValues
    }));
  } catch (error) {
    logger.error(`Erreur lors de la récupération des descendants pour le nœud #${nodeId}: ${error.message}`, error);
    throw error;
  }
};

module.exports = {
  updateAncestorsModifiedAt,
  updateMultipleAncestorsModifiedAt,
  getNodeAncestors,
  getNodeDescendants
};
