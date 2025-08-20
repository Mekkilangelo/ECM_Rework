/**
 * Service de gestion des commandes
 * Contient la logique métier liée aux opérations sur les commandes
 */

const { node, order, closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateOrderData } = require('../utils/validators');
const { 
  NotFoundError, 
  ValidationError 
} = require('../utils/errors');
const { deletePhysicalDirectory } = require('../utils/fileUtils');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');

/**
 * Récupère toutes les commandes avec pagination et filtrage
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des commandes
 */
const getAllOrders = async (options = {}) => {
  const { 
    limit = 10, 
    offset = 0, 
    parent_id = null, 
    sortBy = 'modified_at', 
    sortOrder = 'DESC',
    search = null
  } = options;
  
  const whereCondition = { type: 'order' };
  
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
      'commercial': [{ model: order }, 'commercial', sortOrder],
      'order_date': [{ model: order }, 'order_date', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };
    
    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };
  
  // Exécuter la requête
  const orders = await node.findAll({
    where: whereCondition,
    include: [{
      model: order,
      attributes: ['order_number', 'order_date', 'commercial', 'contacts']
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
    orders,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Récupère une commande par son ID
 * @param {number} orderId - ID de la commande
 * @returns {Promise<Object>} Détails de la commande
 */
const getOrderById = async (orderId) => {
  const foundOrder = await node.findOne({
    where: { id: orderId, type: 'order' },
    include: [{
      model: order,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!foundOrder) {
    throw new NotFoundError('Commande non trouvée');
  }
  
  return foundOrder;
};

/**
 * Crée une nouvelle commande
 * @param {Object} orderData - Données de la commande
 * @returns {Promise<Object>} Commande créée
 */
const createOrder = async (orderData) => {
  // Validation des données
  const validationResult = validateOrderData(orderData);
  if (!validationResult.isValid) {
    throw new ValidationError('Données de commande invalides', validationResult.errors);
  }
  
  const {
    parent_id,
    name,
    description,
    order_number,
    order_date,
    commercial,
    client_id,
    contacts,
    delivery_date,
    urgency,
    status,
    additional_info
  } = orderData;
  
  // Vérifier si le parent existe
  const parentNode = await node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Nœud parent introuvable');
  }
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
    try {
    // Générer un nom de nœud basé sur la date
    const orderDate = new Date(order_date);
    const formattedDate = orderDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Fonction pour générer le nom avec indice si nécessaire
    async function generateNodeName() {
      const baseName = `TRQ_${formattedDate}`;
      
      // Trouver toutes les commandes du même jour
      const existingNodes = await node.findAll({
        where: {
          parent_id: parent_id,
          type: 'order',
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
    
    // Créer le nœud de commande
    const orderNode = await node.create({
      name: name || nodeName, // Utiliser le nom TRQ_date si aucun nom n'est fourni
      path: `${parentNode.path}/${nodeName}`,
      type: 'order',
      parent_id,
      description,
      data_status: 'new',
      created_at: new Date(),
      modified_at: new Date() // Ajouter la date de modification
    }, { transaction });
      // Générer le numéro de commande basé sur l'ID du nœud si non fourni
    const orderNumberToUse = order_number || `TRQ_${orderNode.id}`;
    
    // Créer l'enregistrement de commande
    const orderRecord = await order.create({
      node_id: orderNode.id,
      order_number: orderNumberToUse,
      order_date,
      commercial,
      client_id,
      contacts,
      delivery_date,
      urgency: urgency || 'normal',
      status: status || 'new',
      additional_info
    }, { transaction });
      // Créer les enregistrements de fermeture (closure table)
    await closure.create({
      ancestor_id: orderNode.id,
      descendant_id: orderNode.id,
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
        descendant_id: orderNode.id,
        depth: pc.depth + 1
      }, { transaction });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at de la commande et de ses ancêtres après création
    await updateAncestorsModifiedAt(orderNode.id);
    
    // Récupérer la commande complète
    const createdOrder = await getOrderById(orderNode.id);
    return createdOrder;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Met à jour une commande existante
 * @param {number} orderId - ID de la commande
 * @param {Object} orderData - Nouvelles données
 * @returns {Promise<Object>} Commande mise à jour
 */
const updateOrder = async (orderId, orderData) => {
  // Récupérer la commande existante
  const orderNode = await node.findOne({
    where: { id: orderId, type: 'order' },
    include: [{ model: order }]
  });
  
  if (!orderNode) {
    throw new NotFoundError('Commande non trouvée');
  }
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
    try {
    // Mettre à jour le nœud
    const nodeUpdates = {};
    if (orderData.name) nodeUpdates.name = orderData.name;
    if (orderData.description) nodeUpdates.description = orderData.description;
    
    // Vérifier si la date de commande a changé pour mettre à jour le nom du nœud
    if (orderData.order_date && orderNode.order && orderNode.order.order_date) {
      const currentDate = new Date(orderNode.order.order_date);
      const newDate = new Date(orderData.order_date);
      
      // Si la date a changé et que le nom du nœud suit le format TRQ_
      if (currentDate.getTime() !== newDate.getTime() && orderNode.name.startsWith('TRQ_')) {
        // Générer le nouveau nom basé sur la nouvelle date
        const formattedNewDate = newDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // Fonction pour générer le nouveau nom avec indice si nécessaire
        async function generateUpdatedNodeName() {
          const baseName = `TRQ_${formattedNewDate}`;
          
          // Trouver toutes les commandes du même jour (exclure la commande actuelle)
          const existingNodes = await node.findAll({
            where: {
              parent_id: orderNode.parent_id,
              type: 'order',
              id: { [Op.ne]: orderId }, // Exclure la commande actuelle
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
        if (orderNode.parent_id) {
          const parentNode = await node.findByPk(orderNode.parent_id, { transaction });
          if (parentNode) {
            nodeUpdates.path = `${parentNode.path}/${newNodeName}`;
          }
        }
      }
    }
    
    // Mettre à jour la date de modification
    nodeUpdates.modified_at = new Date();
    
    // S'assurer que la mise à jour est toujours appliquée pour mettre à jour modified_at
    await orderNode.update(nodeUpdates, { transaction });
    
    // Mettre à jour les données de commande
    const orderUpdates = {};
    const orderFields = [
      'order_number', 'order_date', 'commercial', 'client_id', 
      'contacts', 'delivery_date', 'urgency', 'status', 'additional_info'
    ];
    
    for (const field of orderFields) {
      if (orderData[field] !== undefined) {
        orderUpdates[field] = orderData[field];
      }
    }
    
    if (Object.keys(orderUpdates).length > 0) {
      await order.update(orderUpdates, {
        where: { node_id: orderId },
        transaction
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at de la commande et de ses ancêtres après mise à jour
    await updateAncestorsModifiedAt(orderId);
    
    // Récupérer la commande mise à jour
    const updatedOrder = await getOrderById(orderId);
    return updatedOrder;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

/**
 * Supprime une commande
 * @param {number} orderId - ID de la commande à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteOrder = async (orderId) => {
  // Récupérer la commande
  const orderNode = await node.findOne({
    where: { id: orderId, type: 'order' }
  });
  
  if (!orderNode) {
    throw new NotFoundError('Commande non trouvée');
  }

  // Stocker le chemin physique de la commande pour la suppression
  const orderPhysicalPath = orderNode.path;
  
  // Récupérer tous les descendants de cette commande
  const descendants = await closure.findAll({
    where: { ancestor_id: orderId },
    order: [['depth', 'DESC']] // Important: supprimer les plus profonds d'abord
  });
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
  
  try {    // Supprimer tous les descendants (du plus profond au moins profond)
    const sortedDescendants = descendants.sort((a, b) => b.depth - a.depth);
    
    for (const desc of sortedDescendants) {
      if (desc.depth > 0) { // Ne pas supprimer la commande elle-même pour l'instant
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
        
        // Ensuite supprimer les entités spécifiques (Order, File, etc.)
        const node = await node.findByPk(desc.descendant_id, { transaction });
        if (node) {
          if (node.type === 'file') {
            await sequelize.query('DELETE FROM Files WHERE node_id = :nodeId', {
              replacements: { nodeId: node.id },
              transaction
            });
          } else if (node.type === 'order') {
            await sequelize.query('DELETE FROM Orders WHERE node_id = :nodeId', {
              replacements: { nodeId: node.id },
              transaction
            });
          } // Ajouter d'autres types si nécessaire
          
          // Enfin supprimer le nœud
          await node.destroy({ transaction });
        }
      }
    }
    
    // Supprimer les relations de fermeture restantes pour le nœud racine
    await closure.destroy({
      where: {
        [Op.or]: [
          { ancestor_id: orderId },
          { descendant_id: orderId }
        ]
      },
      transaction
    });
    
    // Supprimer l'enregistrement de la commande
    await order.destroy({
      where: { node_id: orderId },
      transaction
    });
    
    // Supprimer le nœud de commande
    await orderNode.destroy({ transaction });
    
    // Valider la transaction
    await transaction.commit();
    
    // NOUVELLE FONCTIONNALITÉ : Supprimer le dossier physique de la commande
    // Cette opération se fait après la validation de la transaction pour éviter
    // de supprimer les fichiers si la transaction échoue
    try {
      const deletionResult = await deletePhysicalDirectory(orderPhysicalPath);
      if (deletionResult) {
        console.log(`Dossier physique de la commande ${orderId} supprimé avec succès`);
      } else {
        console.warn(`Échec de la suppression du dossier physique de la commande ${orderId}`);
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      console.error(`Erreur lors de la suppression du dossier physique de la commande ${orderId}:`, physicalDeleteError);
    }
    
    return true;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder
};
