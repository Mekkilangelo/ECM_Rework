/**
 * Service de gestion des demandes d'essai (trial requests)
 * Contient la logique métier liée aux opérations sur les demandes d'essai
 */

const { node, trial_request, closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateOrderData } = require('../utils/validators');
const { 
  NotFoundError, 
  ValidationError 
} = require('../utils/errors');
const { deletePhysicalDirectory } = require('../utils/fileUtils');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');
const logger = require('../utils/logger');
const fileService = require('./fileService');

/**
 * Récupère toutes les demandes d'essai avec pagination et filtrage
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des demandes d'essai
 */
const getAllTrialRequests = async (options = {}) => {
  const { 
    limit = 10, 
    offset = 0, 
    parent_id = null, 
    sortBy = 'modified_at', 
    sortOrder = 'DESC',
    search = null
  } = options;
  
  const whereCondition = { type: 'trial_request' };
  
  // Filtrage par parent direct
  if (parent_id) {
    whereCondition.parent_id = parent_id;
  }
  // Recherche textuelle - Simplifiée pour cohérence avec les autres services
  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }
  
  // Mapping des champs de tri pour gérer les colonnes des tables associées
  const getOrderClause = (sortBy, sortOrder) => {
    const sortMapping = {
      'name': ['name', sortOrder],
      'commercial': [{ model: trial_request, as: 'trialRequest' }, 'commercial', sortOrder],
      'request_date': [{ model: trial_request, as: 'trialRequest' }, 'request_date', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };
    
    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };
  
  // Exécuter la requête
  const { contact } = require('../models');
  
  const trial_requests = await node.findAll({
    where: whereCondition,
    include: [{
      model: trial_request,
      as: 'trialRequest',
      attributes: ['request_number', 'request_date', 'commercial'],
      include: [{
        model: contact,
        as: 'contacts',
        attributes: ['contact_id', 'name', 'email', 'phone']
      }]
    }],
    order: [getOrderClause(sortBy, sortOrder)],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // Compter le total pour la pagination
  const total = await node.count({
    where: whereCondition
  });
  
  return {
    trial_requests,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Récupère une demande d'essai par son ID
 * @param {number} trialRequestId - ID de la demande d'essai
 * @returns {Promise<Object>} Détails de la demande d'essai
 */
const getTrialRequestById = async (trialRequestId) => {
  const { contact } = require('../models');
  
  const foundTrialRequest = await node.findOne({
    where: { id: trialRequestId, type: 'trial_request' },
    include: [{
      model: trial_request,
      as: 'trialRequest',
      attributes: { exclude: ['node_id'] },
      include: [{
        model: contact,
        as: 'contacts',
        attributes: ['contact_id', 'name', 'email', 'phone']
      }]
    }]
  });
  
  if (!foundTrialRequest) {
    throw new NotFoundError('Demande d\'essai non trouvée');
  }
  
  return foundTrialRequest;
};

/**
 * Crée une nouvelle demande d'essai
 * @param {Object} trialRequestData - Données de la demande d'essai
 * @returns {Promise<Object>} Demande d'essai créée
 */
const createTrialRequest = async (trialRequestData) => {
  // Validation des données
  const validationResult = validateOrderData(trialRequestData);
  if (!validationResult.isValid) {
    throw new ValidationError('Données de demande d\'essai invalides', validationResult.errors);
  }
  
  const {
    parent_id,
    name,
    description,
    request_number,
    request_date,
    commercial,
    client_id,
    contacts,
    delivery_date,
    urgency,
    status,
    additional_info
  } = trialRequestData;
  
  // Vérifier si le parent existe
  const parentNode = await node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Nœud parent introuvable');
  }
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
    try {
    // Générer un nom de nœud basé sur la date
    const trialRequestDate = new Date(request_date);
    const formattedDate = trialRequestDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Fonction pour générer le nom avec indice si nécessaire
    async function generateNodeName() {
      const baseName = `TRQ_${formattedDate}`;
      
      // Trouver toutes les demandes d'essai du même jour
      const existingNodes = await node.findAll({
        where: {
          parent_id: parent_id,
          type: 'trial_request',
          name: {
            [Op.like]: `${baseName}%`
          }
        }
      });
      
      if (existingNodes.length === 0) {
        return baseName;
      }
      
      // Trouver le plus grand indice
      let maxIndex = 0;
      
      existingNodes.forEach(node => {
        const nameMatch = node.name.match(`${baseName}\\((\\d+)\\)`);
        if (nameMatch) {
          const index = parseInt(nameMatch[1], 10);
          if (index > maxIndex) {
            maxIndex = index;
          }
        }
      });
      
      return `${baseName}(${maxIndex + 1})`;
    }
    
    // Générer le nom du nœud avec indice si nécessaire
    const nodeName = await generateNodeName();
    
    // Créer le nœud de demande d'essai
    const trialRequestNode = await node.create({
      name: name || nodeName, // Utiliser le nom TRQ_date si aucun nom n'est fourni
      path: `${parentNode.path}/${nodeName}`,
      type: 'trial_request',
      parent_id,
      description,
      data_status: 'new',
      created_at: new Date(),
      modified_at: new Date() // Ajouter la date de modification
    }, { transaction });
      // Générer le numéro de demande d'essai basé sur l'ID du nœud si non fourni
    const trialRequestNumberToUse = request_number || `TRQ_${trialRequestNode.id}`;
    
    // Créer l'enregistrement de demande d'essai (sans contacts)
    const trialRequestRecord = await trial_request.create({
      node_id: trialRequestNode.id,
      request_number: trialRequestNumberToUse,
      request_date,
      commercial
    }, { transaction });

    // Créer les contacts si fournis
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
      const { contact } = require('../models');
      await contact.bulkCreate(
        contacts.map(c => ({
          trial_request_node_id: trialRequestNode.id,
          name: c.name,
          email: c.email,
          phone: c.phone
        })),
        { transaction }
      );
    }
      // Créer les enregistrements de fermeture (closure table)
    await closure.create({
      ancestor_id: trialRequestNode.id,
      descendant_id: trialRequestNode.id,
      depth: 0
    }, { transaction });
    
    // Récupérer tous les ancêtres du parent
    const parentClosures = await closure.findAll({
      where: { descendant_id: parent_id },
      transaction
    });
    
    // Créer les fermetures pour relier le nœud à tous ses ancêtres
    for (const pc of parentClosures) {
      await closure.create({
        ancestor_id: pc.ancestor_id,
        descendant_id: trialRequestNode.id,
        depth: pc.depth + 1
      }, { transaction });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at de la demande d'essai et de ses ancêtres après création
    await updateAncestorsModifiedAt(trialRequestNode.id);
    
    // Récupérer la demande d'essai complète
    const createdTrialRequest = await getTrialRequestById(trialRequestNode.id);
    return createdTrialRequest;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Met à jour une demande d'essai existante
 * @param {number} trialRequestId - ID de la demande d'essai
 * @param {Object} trialRequestData - Nouvelles données
 * @returns {Promise<Object>} Demande d'essai mise à jour
 */
const updateTrialRequest = async (trialRequestId, trialRequestData) => {
  // Récupérer la demande d'essai existante
  const trialRequestNode = await node.findOne({
    where: { id: trialRequestId, type: 'trial_request' },
    include: [{ model: trial_request, as: 'trialRequest' }]
  });
  
  if (!trialRequestNode) {
    throw new NotFoundError('Demande d\'essai non trouvée');
  }
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
    try {
    // Mettre à jour le nœud
    const nodeUpdates = {};
    if (trialRequestData.name) nodeUpdates.name = trialRequestData.name;
    if (trialRequestData.description) nodeUpdates.description = trialRequestData.description;
    
    // Vérifier si la date de demande d'essai a changé pour mettre à jour le nom du nœud
    if (trialRequestData.request_date && trialRequestNode.trialRequest && trialRequestNode.trialRequest.request_date) {
      const currentDate = new Date(trialRequestNode.trialRequest.request_date);
      const newDate = new Date(trialRequestData.request_date);
      
      // Si la date a changé et que le nom du nœud suit le format TRQ_
      if (currentDate.getTime() !== newDate.getTime() && trialRequestNode.name.startsWith('TRQ_')) {
        // Générer le nouveau nom basé sur la nouvelle date
        const formattedNewDate = newDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Fonction pour générer le nouveau nom avec indice si nécessaire
        async function generateUpdatedNodeName() {
          const baseName = `TRQ_${formattedNewDate}`;
          
          // Trouver toutes les demandes d'essai du même jour (exclure la demande actuelle)
          const existingNodes = await node.findAll({
            where: {
              parent_id: trialRequestNode.parent_id,
              type: 'trial_request',
              id: { [Op.ne]: trialRequestId }, // Exclure la demande actuelle
              name: {
                [Op.like]: `${baseName}%`
              }
            },
            transaction
          });
          
          if (existingNodes.length === 0) {
            return baseName;
          }
          
          // Trouver le plus grand indice
          let maxIndex = 0;
          
          existingNodes.forEach(node => {
            const nameMatch = node.name.match(`${baseName}\\((\\d+)\\)`);
            if (nameMatch) {
              const index = parseInt(nameMatch[1], 10);
              if (index > maxIndex) {
                maxIndex = index;
              }
            }
          });
          
          return `${baseName}(${maxIndex + 1})`;
        }
        
        // Générer le nouveau nom et mettre à jour le chemin
        const newNodeName = await generateUpdatedNodeName();
        nodeUpdates.name = newNodeName;
        
        // Mettre à jour le chemin aussi si nécessaire
        if (trialRequestNode.parent_id) {
          const parentNode = await node.findByPk(trialRequestNode.parent_id, { transaction });
          if (parentNode) {
            nodeUpdates.path = `${parentNode.path}/${newNodeName}`;
          }
        }
      }
    }
    
    // Mettre à jour la date de modification
    nodeUpdates.modified_at = new Date();
    
    // S'assurer que la mise à jour est toujours appliquée pour mettre à jour modified_at
    await trialRequestNode.update(nodeUpdates, { transaction });
    
    // Mettre à jour les données de demande d'essai (sans contacts)
    const trialRequestUpdates = {};
    const trialRequestFields = [
      'request_number', 'request_date', 'commercial'
    ];
    
    for (const field of trialRequestFields) {
      if (trialRequestData[field] !== undefined) {
        trialRequestUpdates[field] = trialRequestData[field];
      }
    }
    
    if (Object.keys(trialRequestUpdates).length > 0) {
      await trial_request.update(trialRequestUpdates, {
        where: { node_id: trialRequestId },
        transaction
      });
    }

    // Gérer les contacts si fournis
    if (trialRequestData.contacts !== undefined) {
      const { contact } = require('../models');
      
      // Supprimer les contacts existants
      await contact.destroy({
        where: { trial_request_node_id: trialRequestId },
        transaction
      });
      
      // Créer les nouveaux contacts
      if (Array.isArray(trialRequestData.contacts) && trialRequestData.contacts.length > 0) {
        await contact.bulkCreate(
          trialRequestData.contacts.map(c => ({
            trial_request_node_id: trialRequestId,
            name: c.name,
            email: c.email,
            phone: c.phone
          })),
          { transaction }
        );
      }
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at de la demande d'essai et de ses ancêtres après mise à jour
    await updateAncestorsModifiedAt(trialRequestId);
    
    // Récupérer la demande d'essai mise à jour
    const updatedTrialRequest = await getTrialRequestById(trialRequestId);
    return updatedTrialRequest;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Supprime une demande d'essai
 * @param {number} trialRequestId - ID de la demande d'essai à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteTrialRequest = async (trialRequestId) => {
  // Récupérer la demande d'essai
  const trialRequestNode = await node.findOne({
    where: { id: trialRequestId, type: 'trial_request' }
  });
  
  if (!trialRequestNode) {
    throw new NotFoundError('Demande d\'essai non trouvée');
  }

  // Stocker le chemin physique de la demande d'essai pour la suppression
  const trialRequestPhysicalPath = trialRequestNode.path;
  
  // Récupérer tous les descendants de cette demande d'essai
  const descendants = await closure.findAll({
    where: { ancestor_id: trialRequestId },
    order: [['depth', 'DESC']] // Important: supprimer les plus profonds d'abord
  });
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
  
  try {    // Supprimer tous les descendants (du plus profond au moins profond)
    const sortedDescendants = descendants.sort((a, b) => b.depth - a.depth);
    
    for (const desc of sortedDescendants) {
      if (desc.depth > 0) { // Ne pas supprimer la demande d'essai elle-même pour l'instant
        // D'abord supprimer toutes les relations de fermeture pour ce descendant
        await closure.destroy({
          where: {
            [Op.or]: [
              { ancestor_id: desc.descendant_id },
              { descendant_id: desc.descendant_id }
            ]
          },
          transaction
        });
        
        // Ensuite supprimer les entités spécifiques (TrialRequest, File, etc.)
        const descendantNode = await node.findByPk(desc.descendant_id, { transaction });
        if (descendantNode) {
          if (descendantNode.type === 'file') {
            await sequelize.query('DELETE FROM files WHERE node_id = :nodeId', {
              replacements: { nodeId: descendantNode.id },
              transaction
            });
          } else if (descendantNode.type === 'trial_request') {
            await sequelize.query('DELETE FROM trial_requests WHERE node_id = :nodeId', {
              replacements: { nodeId: descendantNode.id },
              transaction
            });
          } // Ajouter d'autres types si nécessaire
          
          // Enfin supprimer le nœud
          await descendantNode.destroy({ transaction });
        }
      }
    }
    
    // Supprimer les relations de fermeture restantes pour le nœud racine
    await closure.destroy({
      where: {
        [Op.or]: [
          { ancestor_id: trialRequestId },
          { descendant_id: trialRequestId }
        ]
      },
      transaction
    });
    
    // Supprimer l'enregistrement de la demande d'essai
    await trial_request.destroy({
      where: { node_id: trialRequestId },
      transaction
    });
    
    // Supprimer le nœud de demande d'essai
    await trialRequestNode.destroy({ transaction });
    
    // Valider la transaction
    await transaction.commit();
    
    // NOUVELLE FONCTIONNALITÉ : Supprimer le dossier physique de la demande d'essai
    // Cette opération se fait après la validation de la transaction pour éviter
    // de supprimer les fichiers si la transaction échoue
    try {
      const deletionResult = await deletePhysicalDirectory(trialRequestPhysicalPath);
      if (deletionResult) {
        logger.info('Dossier physique demande d\'essai supprimé', { trialRequestId });
      } else {
        logger.warn('Échec suppression dossier physique demande d\'essai', { trialRequestId });
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      logger.error('Erreur suppression dossier physique demande d\'essai', { 
        trialRequestId, 
        error: physicalDeleteError.message 
      });
    }
    
    return true;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    // IMPORTANT: Vérifier que la transaction n'est pas déjà terminée avant le rollback
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
};

module.exports = {
  getAllTrialRequests,
  getTrialRequestById,
  createTrialRequest,
  updateTrialRequest,
  deleteTrialRequest
};
