/**
 * Service de gestion des clients
 * Contient la logique métier relative aux clients
 */

const { node, client, closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');
const logger = require('../utils/logger');

/**
 * Fonction utilitaire pour valider les données du client
 * @param {Object} data - Données du client à valider
 * @returns {Object} - Objet contenant les erreurs de validation
 */
const validateClientData = (data) => {
  const errors = {};

  // Validation des champs obligatoires
  if (!data.name || !data.name.trim()) {
    errors.name = 'validation.required.clientName';
  }

  if (!data.country) {
    errors.country = 'validation.required.country';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Récupère tous les clients avec pagination et filtrage
 * @param {Object} options - Options de requête
 * @returns {Object} Clients paginés et données de pagination
 */
const getAllClients = async ({ limit = 10, offset = 0, search = null, sortBy = 'modified_at', sortOrder = 'DESC' }) => {
  // Construction de la clause WHERE pour la recherche
  const whereClause = { type: 'client' };
  if (search) {
    whereClause.name = { [Op.like]: `%${search}%` };
  }
  
  // Mapping des champs de tri pour gérer les colonnes des tables associées
  const getOrderClause = (sortBy, sortOrder) => {
    const sortMapping = {
      'name': ['name', sortOrder],
      'client_group': [{ model: client, as: 'client' }, 'client_group', sortOrder],
      'country': [{ model: client, as: 'client' }, 'country', sortOrder],
      'city': [{ model: client, as: 'client' }, 'city', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };
    
    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };
  
  const clients = await node.findAll({
    where: whereClause,
    include: [{
      model: client,
      as: 'client',
      attributes: ['client_code', 'country', 'city', 'client_group', 'address']
    }],
    order: [getOrderClause(sortBy, sortOrder)],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  const total = await node.count({
    where: whereClause
  });
  
  return {
    clients,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Récupère un client spécifique par son ID
 * @param {number} clientId - ID du client
 * @returns {Object} Détails du client
 */
const getClientById = async (clientId) => {
  const foundClient = await node.findOne({
    where: { id: clientId, type: 'client' },
    include: [{
      model: client,
      as: 'client',
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!foundClient) {
    throw new NotFoundError('Client non trouvé');
  }
  
  return foundClient;
};

/**
 * Crée un nouveau client
 * @param {Object} clientData - Données du client
 * @returns {Object} Client créé
 */
const createClient = async (clientData) => {
  const { name, country, city, client_group, description, address } = clientData;
  
  // Validation des données
  const { isValid, errors } = validateClientData({ name, country });
  if (!isValid) {
    throw new ValidationError('Données de client invalides', errors);
  }
  
  // Vérifier si un client avec ce nom existe déjà
  const existingClient = await node.findOne({
    where: { 
      name,
      type: 'client'
    }
  });
  
  if (existingClient) {
    throw new ValidationError('Un client avec ce nom existe déjà');
  }
  
  // Créer le client dans une transaction
  const result = await sequelize.transaction(async (t) => {
    // Créer le nœud
    const newNode = await node.create({
      name,
      path: `/${name}`,
      type: 'client',
      parent_id: null,
      created_at: new Date(),
      modified_at: new Date(),
      data_status: 'new',
      description
    }, { transaction: t });
    
    // Générer le client_code à partir du node_id
    const client_code = `CLI_${newNode.id}`;
    
    // Créer les données du client
    await client.create({
      node_id: newNode.id,
      client_code,
      country,
      city,
      client_group,
      address
    }, { transaction: t });
    
    // Créer l'entrée de fermeture (auto-relation)
    await closure.create({
      ancestor_id: newNode.id,
      descendant_id: newNode.id,
      depth: 0
    }, { transaction: t });
    
    return newNode;
  });
  
  // Mettre à jour le modified_at du client et de ses ancêtres après création
  await updateAncestorsModifiedAt(result.id);
  
  // Récupérer le client complet avec ses données associées
  const newClient = await node.findByPk(result.id, {
    include: [{
      model: client,
      as: 'client',
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  return newClient;
};

/**
 * Met à jour un client existant
 * @param {number} clientId - ID du client
 * @param {Object} clientData - Données mises à jour du client
 * @returns {Object} Client mis à jour
 */
const updateClient = async (clientId, clientData) => {
  const { name, client_code, country, city, client_group, address, description } = clientData;
  
  // Validation des données si country est fourni
  if (country !== undefined) {
    const { isValid, errors } = validateClientData({ name: name || 'nom-temporaire', country });
    if (!isValid) {
      throw new ValidationError('Données de client invalides', errors);
    }
  }
  
  const foundNode = await node.findOne({
    where: { id: clientId, type: 'client' },
    include: [{
      model: client,
      as: 'client'
    }]
  });
  
  if (!foundNode) {
    throw new NotFoundError('Client non trouvé');
  }
  
  // Si le code client change, vérifier s'il est déjà utilisé
  if (client_code && client_code !== foundNode.client.client_code) {
    const existingClient = await client.findOne({
      where: { client_code }
    });
    
    if (existingClient) {
      throw new ValidationError('Ce code client existe déjà');
    }
  }
  
  await sequelize.transaction(async (t) => {
    // Mettre à jour le nœud
    const nodeUpdateData = {};
    
    if (name) {
      nodeUpdateData.name = name;
      nodeUpdateData.path = `/${name}`;
    }
    
    if (description !== undefined) {
      nodeUpdateData.description = description;
    }
    
    nodeUpdateData.modified_at = new Date();
    
    await foundNode.update(nodeUpdateData, { transaction: t });
    
    // Si le nom a changé, mettre à jour les chemins des descendants
    if (name && name !== foundNode.name) {
      const descendants = await closure.findAll({
        where: { 
          ancestor_id: clientId,
          depth: { [Op.gt]: 0 }
        },
        transaction: t
      });
      
      for (const relation of descendants) {
        const descendant = await node.findByPk(relation.descendant_id, { transaction: t });
        const descendantPath = descendant.path.replace(foundNode.path, `/${name}`);
        await descendant.update({ path: descendantPath }, { transaction: t });
      }
    }
    
    // Mettre à jour les données du client
    const clientData = {};
    if (client_code !== undefined) clientData.client_code = client_code;
    if (country !== undefined) clientData.country = country;
    if (city !== undefined) clientData.city = city;
    if (client_group !== undefined) clientData.client_group = client_group;
    if (address !== undefined) clientData.address = address;
    
    if (Object.keys(clientData).length > 0) {
      await client.update(clientData, {
        where: { node_id: clientId },
        transaction: t
      });
    }
  });
  
  // Mettre à jour le modified_at du client et de ses ancêtres après mise à jour
  await updateAncestorsModifiedAt(clientId);
  
  // Récupérer et renvoyer le client mis à jour
  const updatedClient = await node.findByPk(clientId, {
    include: [{
      model: client,
      as: 'client',
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  return updatedClient;
};

/**
 * Supprime un client et tous ses descendants
 * @param {number} clientId - ID du client à supprimer
 * @returns {boolean} Succès de l'opération
 */
const deleteClient = async (clientId) => {
  // Créer une transaction pour assurer l'intégrité des données
  const t = await sequelize.transaction();
  
  try {
    // 1. Vérifier que le client existe
    const foundClient = await node.findOne({
      where: { id: clientId, type: 'client' },
      transaction: t
    });
    
    if (!foundClient) {
      await t.rollback();
      throw new NotFoundError('Client non trouvé');
    }
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await closure.findAll({
      where: { ancestor_id: clientId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(clientId)); // Ajouter l'ID du client lui-même
    
    // 3. Supprimer toutes les entrées de fermeture associées aux descendants
    // Supprimer d'abord où ils sont descendants ou ancêtres
    await closure.destroy({
      where: {
        [Op.or]: [
          { descendant_id: { [Op.in]: Array.from(descendantIds) } },
          { ancestor_id: { [Op.in]: Array.from(descendantIds) } }
        ]
      },
      transaction: t
    });
    
    // 4. Maintenant, supprimer tous les nœuds descendants
    await node.destroy({
      where: {
        id: { [Op.in]: Array.from(descendantIds) }
      },
      transaction: t
    });
    
    // 5. Valider toutes les modifications
    await t.commit();
    
    return true;
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    // IMPORTANT: Vérifier que la transaction n'est pas déjà terminée avant le rollback
    if (!t.finished) {
      await t.rollback();
    }
    throw error;
  }
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  validateClientData
};
