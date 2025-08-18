/**
 * Service de gestion des nœuds
 * Contient la logique métier liée aux opérations sur les nœuds
 */

const { node: Node, closure: Closure, client: Client, order: Order, part: Part, test: Test, file: File, furnace: Furnace, steel: Steel, sequelize } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { deletePhysicalFiles } = require('../utils/fileUtils');

/**
 * Fonction utilitaire pour obtenir le modèle correspondant au type
 * @param {string} type - Type de nœud
 * @returns {Object} Modèle Sequelize correspondant
 */
const getModelForType = (type) => {
  const typeModelMap = {
    'client': Client,
    'order': Order,
    'part': Part,
    'test': Test,
    'file': File,
    'furnace': Furnace,
    'steel': Steel
  };
  return typeModelMap[type];
};

/**
 * Fonction utilitaire pour obtenir les attributs à inclure selon le type
 * @param {string} type - Type de nœud
 * @returns {Array} Liste des attributs à inclure
 */
const getAttributesForType = (type) => {
  const typeAttributesMap = {
    'client': ['country', 'city', 'client_group','address'],
    'order': ['order_number', 'order_date', 'commercial'],
    'part': ['designation', 'steel'],
    'test': ['test_code', 'status', 'test_date', 'location', 'is_mesured'],
    'file': ['size', 'mime_type'],
    'furnace': ['furnace_type', 'furnace_size'],
    'steel': ['grade', 'standard', 'family']
  };
  return typeAttributesMap[type] || [];
};

/**
 * Récupère les nœuds d'un type spécifique avec pagination
 * @param {Object} params - Paramètres de la requête
 * @returns {Promise<Object>} Nœuds récupérés
 */
const getNodes = async (params) => {
  const { ancestorId = 0, type, depth = 1, limit = 10, offset = 0 } = params;
  
  // Validation des entrées
  if (!type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
    throw new ValidationError('Type de nœud invalide');
  }

  const associatedModel = getModelForType(type);
  const modelAttributes = getAttributesForType(type);
  
  // Configuration de base pour la requête
  const queryOptions = {
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['modified_at', 'DESC']],
    include: [{
      model: associatedModel,
      attributes: modelAttributes
    }]
  };

  // Logique spécifique selon le type
  if (type === 'client') {
    // Pour les clients, pas besoin de contrainte ancestorId
    queryOptions.where = { type };
  } else if (type === 'steel' && parseInt(ancestorId) === 0) {
    // Pour les aciers sans parent spécifié
    queryOptions.where = { type };
  } else {
    // Pour les autres types avec une contrainte de hiérarchie
    const descendantIds = await Closure.findAll({
      attributes: ['descendant_id'],
      where: { 
        ancestor_id: parseInt(ancestorId)
      }
    });
    
    const ids = descendantIds.map(item => item.descendant_id);
    
    queryOptions.where = {
      id: { [Op.in]: ids },
      type
    };
    
    // Ajout d'une contrainte de profondeur pour les fichiers
    if (type === 'file') {
      queryOptions.include.push({
        model: Closure,
        as: 'ClosureRelations',
        attributes: [],
        where: {
          ancestor_id: parseInt(ancestorId),
          depth: { [Op.lte]: parseInt(depth) }
        }
      });
    }
  }

  const nodes = await Node.findAll(queryOptions);
  return nodes;
};

/**
 * Récupère les détails d'un nœud spécifique
 * @param {number} nodeId - ID du nœud
 * @param {string} type - Type de nœud
 * @returns {Promise<Object>} Détails du nœud
 */
const getNodeDetails = async (nodeId, type) => {
  // Validation des entrées
  if (!type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
    throw new ValidationError('Type de nœud invalide');
  }
  
  const associatedModel = getModelForType(type);
  
  const node = await Node.findOne({
    where: { id: nodeId, type },
    include: [{
      model: associatedModel,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!node) {
    throw new NotFoundError('Nœud non trouvé');
  }
  
  return node;
};

/**
 * Compte le nombre total de nœuds d'un type spécifique
 * @param {Object} params - Paramètres de la requête
 * @returns {Promise<number>} Nombre total de nœuds
 */
const getTotalNodes = async (params) => {
  const { ancestorId = 0, type } = params;
  
  // Validation des entrées
  if (!type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
    throw new ValidationError('Type de nœud invalide');
  }
  
  const associatedModel = getModelForType(type);
  
  // Configuration de la requête
  const countOptions = {
    include: [{
      model: associatedModel,
      attributes: []
    }],
    where: { type }
  };
  
  // Ajout de la contrainte d'ancêtre pour tous les types sauf client
  if (type !== 'client' && parseInt(ancestorId) !== 0) {
    const descendantIds = await Closure.findAll({
      attributes: ['descendant_id'],
      where: { 
        ancestor_id: parseInt(ancestorId)
      }
    });
    
    const ids = descendantIds.map(item => item.descendant_id);
    
    countOptions.where.id = { [Op.in]: ids };
  }
  
  const count = await Node.count(countOptions);
  return count;
};

/**
 * Crée un nouveau nœud et ses relations de hiérarchie
 * @param {Object} nodeData - Données du nœud
 * @returns {Promise<Object>} Nœud créé
 */
const createNode = async (nodeData) => {
  const { name, type, parentId, data, description } = nodeData;
  
  // Validation des entrées
  if (!name || !type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
    throw new ValidationError('Données de nœud invalides');
  }
  
  // Si ce n'est pas un client ou un acier sans parent, vérifier que le parent existe
  if (type !== 'client' && (type !== 'steel' || parentId)) {
    if (!parentId) {
      throw new ValidationError('ID du parent requis pour ce type de nœud');
    }
    
    const parentNode = await Node.findByPk(parentId);
    if (!parentNode) {
      throw new NotFoundError('Nœud parent non trouvé');
    }
  }
  
  // Création du nœud dans une transaction
  const result = await sequelize.transaction(async (t) => {
    // Générer le chemin
    let path;
    if (parentId) {
      const parentNode = await Node.findByPk(parentId, { transaction: t });
      path = `${parentNode.path}/${name}`;
    } else {
      path = `/${name}`;
    }
    
    // Créer le nœud
    const newNode = await Node.create({
      name,
      path,
      type,
      parent_id: parentId || null,
      created_at: new Date(),
      modified_at: new Date(),
      data_status: 'new',
      description
    }, { transaction: t });
    
    // Créer l'entrée dans la table spécifique
    const specificModel = getModelForType(type);
    await specificModel.create({
      node_id: newNode.id,
      ...data
    }, { transaction: t });
    
    // Créer les entrées de fermeture
    // 1. Auto-relation (profondeur 0)
    await Closure.create({
      ancestor_id: newNode.id,
      descendant_id: newNode.id,
      depth: 0
    }, { transaction: t });
    
    // 2. Relations avec les ancêtres si un parent existe
    if (parentId) {
      const parentClosures = await Closure.findAll({
        where: { descendant_id: parentId },
        transaction: t
      });
      
      // Pour chaque ancêtre du parent, créer une relation avec le nouveau nœud
      for (const parentClosure of parentClosures) {
        await Closure.create({
          ancestor_id: parentClosure.ancestor_id,
          descendant_id: newNode.id,
          depth: parentClosure.depth + 1
        }, { transaction: t });
      }
    }
    
    return newNode;
  });
  
  return result;
};

/**
 * Met à jour un nœud existant
 * @param {number} nodeId - ID du nœud
 * @param {Object} updateData - Données à mettre à jour
 * @returns {Promise<Object>} Nœud mis à jour
 */
const updateNode = async (nodeId, updateData) => {
  const { name, data } = updateData;
  
  const node = await Node.findByPk(nodeId);
  if (!node) {
    throw new NotFoundError('Nœud non trouvé');
  }
  
  await sequelize.transaction(async (t) => {
    // Mettre à jour le nœud
    if (name) {
      // Si le nom change, mettre à jour aussi le chemin
      if (name !== node.name) {
        // 1. Mettre à jour le chemin de ce nœud
        const pathParts = node.path.split('/');
        pathParts[pathParts.length - 1] = name;
        const newPath = pathParts.join('/');
        
        await node.update({
          name,
          path: newPath,
          modified_at: new Date()
        }, { transaction: t });
        
        // 2. Mettre à jour récursivement les chemins des descendants
        const descendants = await Closure.findAll({
          where: { 
            ancestor_id: nodeId,
            depth: { [Op.gt]: 0 }
          },
          transaction: t
        });
        
        for (const relation of descendants) {
          const descendant = await Node.findByPk(relation.descendant_id, { transaction: t });
          const descendantPath = descendant.path.replace(node.path, newPath);
          await descendant.update({ path: descendantPath }, { transaction: t });
        }
      } else {
        // Juste mettre à jour la date de modification
        await node.update({
          modified_at: new Date()
        }, { transaction: t });
      }
    }
    
    // Mettre à jour les données spécifiques au type
    if (data) {
      const specificModel = getModelForType(node.type);
      await specificModel.update(data, {
        where: { node_id: nodeId },
        transaction: t
      });
    }
  });
  
  // Récupérer et renvoyer le nœud mis à jour avec ses données spécifiques
  const updatedNode = await Node.findByPk(nodeId, {
    include: [{
      model: getModelForType(node.type),
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  return updatedNode;
};

/**
 * Fonction helper pour supprimer les données spécifiques au type
 * @param {string} nodeType - Type de nœud
 * @param {number} nodeId - ID du nœud
 * @param {Object} transaction - Transaction Sequelize
 * @returns {Promise<number>} Nombre d'enregistrements supprimés
 */
const deleteSpecificData = async (nodeType, nodeId, transaction) => {
  const specificModel = getModelForType(nodeType);
  if (specificModel) {
    return await specificModel.destroy({ 
      where: { node_id: nodeId }, 
      transaction 
    });
  }
  return 0;
};

/**
 * Supprime un nœud et tous ses descendants
 * @param {number} nodeId - ID du nœud
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteNode = async (nodeId) => {
  const t = await sequelize.transaction();
  
  try {
    // 1. Vérifier que le nœud existe
    const node = await Node.findByPk(nodeId, { transaction: t });
    
    if (!node) {
      await t.rollback();
      throw new NotFoundError('Nœud non trouvé');
    }

    // 2. Récupérer tous les descendants pour supprimer leurs fichiers physiques
    const descendants = await Closure.findAll({
      where: { ancestor_id: nodeId },
      transaction: t
    });    // 3. Supprimer les fichiers physiques associés à ce nœud et tous ses descendants
    const allNodeIds = [nodeId, ...descendants.map(d => d.descendant_id)];
    for (const nodeIdToClean of allNodeIds) {
      try {
        await deletePhysicalFiles(nodeIdToClean, t);
      } catch (error) {
        console.warn(`Erreur lors de la suppression des fichiers du nœud ${nodeIdToClean}:`, error.message);
        // Continue avec les autres nœuds même si un échoue
      }
    }
    
    // 4. Supprimer toutes les références dans Closure
    await Closure.destroy({
      where: {
        [Op.or]: [
          { ancestor_id: nodeId },
          { descendant_id: nodeId }
        ]
      },
      transaction: t
    });
    
    // 5. Supprimer les données spécifiques au type pour tous les descendants
    for (const desc of descendants) {
      const descendantNode = await Node.findByPk(desc.descendant_id, { transaction: t });
      if (descendantNode && descendantNode.type !== 'file') { // Les fichiers sont déjà supprimés
        await deleteSpecificData(descendantNode.type, desc.descendant_id, t);
      }
    }

    // 6. Supprimer les données spécifiques du nœud principal si ce n'est pas un fichier
    if (node.type && node.type !== 'file') {
      await deleteSpecificData(node.type, nodeId, t);
    }

    // 7. Supprimer tous les nœuds descendants (sauf les fichiers déjà supprimés)
    const nonFileDescendants = descendants.filter(d => d.descendant_id !== nodeId);
    if (nonFileDescendants.length > 0) {
      await Node.destroy({
        where: {
          id: { [Op.in]: nonFileDescendants.map(d => d.descendant_id) },
          type: { [Op.ne]: 'file' } // Les fichiers sont déjà supprimés
        },
        transaction: t
      });
    }

    // 8. Supprimer le nœud principal si ce n'est pas un fichier
    if (node.type !== 'file') {
      await node.destroy({ transaction: t });
    }
    
    // 9. Valider la transaction
    await t.commit();
    return true;
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await t.rollback();
    throw error;
  }
};

/**
 * Vide toutes les tables de la base de données
 * @returns {Promise<Object>} Résultat de l'opération
 */
const deleteAllNodes = async () => {
  const t = await sequelize.transaction();
  
  try {
    // Désactiver les contraintes de clé étrangère
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction: t });
    
    // Tables à nettoyer avec leurs modèles Sequelize correspondants
    const models = [Client, Order, Part, Test, File, Furnace, Steel, Node, Closure];
    
    // Suppression des données de chaque table en utilisant les méthodes Sequelize
    for (const model of models) {
      await model.destroy({ 
        truncate: true,
        cascade: true, 
        force: true, 
        transaction: t 
      });
    }
    
    // Réactiver les contraintes de clé étrangère
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction: t });
    
    // Valider la transaction
    await t.commit();
    
    return {
      success: true,
      tables: models.map(model => model.tableName || model.name)
    };
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await t.rollback();
    throw error;
  }
};

/**
 * Récupère une table hiérarchique de nœuds
 * @param {Object} params - Paramètres de la requête
 * @returns {Promise<Object>} Table de nœuds avec pagination
 */
const getTable = async (params) => {
  const { parentId = null, limit = 10, page = 1 } = params;
  const offset = (page - 1) * limit;
  
  // Récupérer les enfants directs du nœud parent
  const nodes = await Node.findAll({
    attributes: ['id', 'name', 'type', 'created_at', 'updated_at'],
    include: [
      {
        model: Closure,
        as: 'ancestors',
        where: { 
          ancestor_id: parentId || null,
          depth: 1
        },
        required: parentId ? true : false
      }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['updated_at', 'DESC']]
  });
  
  // Récupérer le total pour la pagination
  const count = await Node.count({
    include: [
      {
        model: Closure,
        as: 'ancestors',
        where: { 
          ancestor_id: parentId || null,
          depth: 1
        },
        required: parentId ? true : false
      }
    ]
  });
  
  return {
    nodes,
    pagination: {
      total: count,
      pages: Math.ceil(count / limit),
      current: parseInt(page),
      limit: parseInt(limit)
    }
  };
};

/**
 * Met à jour le statut d'un nœud
 * @param {number} nodeId - ID du nœud
 * @param {string} status - Nouveau statut
 * @returns {Promise<Object>} Résultat de l'opération
 */
const updateNodeStatus = async (nodeId, status) => {
  const node = await Node.findByPk(nodeId);
  if (!node) {
    throw new NotFoundError('Nœud non trouvé');
  }
  
  // Mettre à jour le statut et la date de modification
  await node.update({
    data_status: status,
    modified_at: new Date()
  });
  
  return { 
    id: nodeId,
    data_status: status
  };
};

module.exports = {
  getModelForType,
  getAttributesForType,
  getNodes,
  getNodeDetails,
  getTotalNodes,
  createNode,
  updateNode,
  deleteNode,
  deleteAllNodes,
  getTable,
  updateNodeStatus
};
