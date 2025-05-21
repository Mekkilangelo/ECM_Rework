/**
 * Service de gestion des clients
 * Contient la logique métier relative aux clients
 */

const { Node, Client, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Fonction utilitaire pour valider les données du client
 * @param {Object} data - Données du client à valider
 * @returns {Object} - Objet contenant les erreurs de validation
 */
const validateClientData = (data) => {
  const errors = {};
  
  // Validation des champs obligatoires
  if (!data.name || !data.name.trim()) {
    errors.name = 'Le nom du client est requis';
  }
  
  if (!data.country) {
    errors.country = 'Le pays est requis';
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
  
  const clients = await Node.findAll({
    where: whereClause,
    include: [{
      model: Client,
      attributes: ['client_code', 'country', 'city', 'client_group', 'address']
    }],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  const total = await Node.count({
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
  const client = await Node.findOne({
    where: { id: clientId, type: 'client' },
    include: [{
      model: Client,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!client) {
    throw new NotFoundError('Client non trouvé');
  }
  
  return client;
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
  const existingClient = await Node.findOne({
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
    const newNode = await Node.create({
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
    await Client.create({
      node_id: newNode.id,
      client_code,
      country,
      city,
      client_group,
      address
    }, { transaction: t });
    
    // Créer l'entrée de fermeture (auto-relation)
    await Closure.create({
      ancestor_id: newNode.id,
      descendant_id: newNode.id,
      depth: 0
    }, { transaction: t });
    
    return newNode;
  });
  
  // Récupérer le client complet avec ses données associées
  const newClient = await Node.findByPk(result.id, {
    include: [{
      model: Client,
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
  
  const node = await Node.findOne({
    where: { id: clientId, type: 'client' },
    include: [{
      model: Client
    }]
  });
  
  if (!node) {
    throw new NotFoundError('Client non trouvé');
  }
  
  // Si le code client change, vérifier s'il est déjà utilisé
  if (client_code && client_code !== node.Client.client_code) {
    const existingClient = await Client.findOne({
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
    
    await node.update(nodeUpdateData, { transaction: t });
    
    // Si le nom a changé, mettre à jour les chemins des descendants
    if (name && name !== node.name) {
      const descendants = await Closure.findAll({
        where: { 
          ancestor_id: clientId,
          depth: { [Op.gt]: 0 }
        },
        transaction: t
      });
      
      for (const relation of descendants) {
        const descendant = await Node.findByPk(relation.descendant_id, { transaction: t });
        const descendantPath = descendant.path.replace(node.path, `/${name}`);
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
      await Client.update(clientData, {
        where: { node_id: clientId },
        transaction: t
      });
    }
  });
  
  // Récupérer et renvoyer le client mis à jour
  const updatedClient = await Node.findByPk(clientId, {
    include: [{
      model: Client,
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
    const client = await Node.findOne({
      where: { id: clientId, type: 'client' },
      transaction: t
    });
    
    if (!client) {
      await t.rollback();
      throw new NotFoundError('Client non trouvé');
    }
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await Closure.findAll({
      where: { ancestor_id: clientId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(clientId)); // Ajouter l'ID du client lui-même
    
    // 3. Supprimer toutes les entrées de fermeture associées aux descendants
    // Supprimer d'abord où ils sont descendants ou ancêtres
    await Closure.destroy({
      where: {
        [Op.or]: [
          { descendant_id: { [Op.in]: Array.from(descendantIds) } },
          { ancestor_id: { [Op.in]: Array.from(descendantIds) } }
        ]
      },
      transaction: t
    });
    
    // 4. Maintenant, supprimer tous les nœuds descendants
    await Node.destroy({
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
    await t.rollback();
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
