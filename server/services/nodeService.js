/**
 * Service minimal de gestion des nœuds
 * 
 * Note : Ce service était initialement conçu comme une façade générique
 * pour gérer tous les types de nœuds (pattern Factory/Facade).
 * 
 * L'architecture a évolué vers des services spécialisés :
 * - clientService pour les clients
 * - orderService pour les commandes
 * - partService pour les pièces
 * - trialService pour les trials
 * 
 * Seules les fonctions transversales sont conservées ici :
 * - Gestion du statut (new → opened) utilisée par le dashboard
 * - Suppression en masse pour les environnements de dev/test
 */

const { node, client, trial_request, part, trial, file, furnace, steel, closure, sequelize } = require('../models');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Met à jour le statut d'un nœud (new → opened)
 * Utilisé par le dashboard pour marquer les éléments comme "lus"
 * 
 * @param {number} nodeId - ID du nœud
 * @param {string} status - Nouveau statut (ex: 'opened', 'new')
 * @returns {Promise<Object>} Résultat de l'opération
 */
const updateNodeStatus = async (nodeId, status) => {
  const nodeToUpdate = await node.findByPk(nodeId);
  
  if (!nodeToUpdate) {
    throw new NotFoundError('Nœud non trouvé');
  }
  
  // Mettre à jour le statut et la date de modification
  await nodeToUpdate.update({
    data_status: status,
    modified_at: new Date()
  });
  
  logger.info(`Statut du nœud #${nodeId} mis à jour`, { status });
  
  return { 
    id: nodeId,
    data_status: status
  };
};

/**
 * Vide toutes les tables de la base de données
 * ATTENTION : Cette fonction supprime TOUTES les données !
 * Utilisée uniquement pour les environnements de dev/test
 * 
 * @returns {Promise<Object>} Résultat de l'opération avec la liste des tables nettoyées
 */
const deleteAllNodes = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    logger.warn('⚠️ DÉBUT DE LA SUPPRESSION COMPLÈTE DE LA BASE DE DONNÉES');
    
    // Désactiver les contraintes de clé étrangère temporairement
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    
    // Liste des modèles à nettoyer dans l'ordre
    const models = [
      { name: 'Client', model: client },
      { name: 'TrialRequest', model: trial_request },
      { name: 'Part', model: part },
      { name: 'Trial', model: trial },
      { name: 'File', model: file },
      { name: 'Furnace', model: furnace },
      { name: 'Steel', model: steel },
      { name: 'Closure', model: closure },
      { name: 'Node', model: node }
    ];
    
    // Suppression des données de chaque table
    for (const { name, model } of models) {
      await model.destroy({ 
        truncate: true,
        cascade: true, 
        force: true, 
        transaction 
      });
      logger.info(`✓ Table ${name} vidée`);
    }
    
    // Réactiver les contraintes de clé étrangère
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    
    // Valider la transaction
    await transaction.commit();
    
    logger.warn('✅ TOUTES LES DONNÉES ONT ÉTÉ SUPPRIMÉES');
    
    return {
      success: true,
      tables: models.map(m => m.name)
    };
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await transaction.rollback();
    logger.error('❌ Erreur lors de la suppression des données', error);
    throw error;
  }
};

module.exports = {
  updateNodeStatus,
  deleteAllNodes
};
