// server/controllers/clientController.js
const { Node, Client, Closure } = require('../models');
const { sequelize } = require('../models');

/**
 * Récupérer tous les clients avec pagination
 */
exports.getClients = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const clients = await Node.findAll({
      where: { type: 'client' },
      include: [{
        model: Client,
        attributes: ['client_code', 'country', 'city', 'client_group', 'address']
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: { type: 'client' }
    });
    
    return res.status(200).json({
      clients,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des clients', error: error.message });
  }
};

/**
 * Récupérer un client spécifique
 */
exports.getClientById = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const client = await Node.findOne({
      where: { id: clientId, type: 'client' },
      include: [{
        model: Client,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    return res.status(200).json(client);
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du client', error: error.message });
  }
};

/**
 * Créer un nouveau client
 */
exports.createClient = async (req, res) => {
  try {
    const { name, client_code, country, city, client_group, address } = req.body;
    
    // Validation des données
    if (!name || !client_code) {
      return res.status(400).json({ message: 'Nom et code client requis' });
    }
    
    // Vérifier si le code client est déjà utilisé
    const existingClient = await Client.findOne({
      where: { client_code }
    });
    
    if (existingClient) {
      return res.status(409).json({ message: 'Ce code client existe déjà' });
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
        data_status: 'new'
      }, { transaction: t });
      
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
    
    return res.status(201).json(newClient);
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du client', error: error.message });
  }
};

/**
 * Mettre à jour un client existant
 */
exports.updateClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, client_code, country, city, client_group, address } = req.body;
    
    const node = await Node.findOne({
      where: { id: clientId, type: 'client' },
      include: [{
        model: Client
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // Si le code client change, vérifier s'il est déjà utilisé
    if (client_code && client_code !== node.Client.client_code) {
      const existingClient = await Client.findOne({
        where: { client_code }
      });
      
      if (existingClient) {
        return res.status(409).json({ message: 'Ce code client existe déjà' });
      }
    }
    
    await sequelize.transaction(async (t) => {
      // Mettre à jour le nœud
      if (name) {
        await node.update({
          name,
          path: `/${name}`,
          modified_at: new Date()
        }, { transaction: t });
        
        // Si le nom a changé, mettre à jour les chemins des descendants
        if (name !== node.name) {
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
      } else {
        // Juste mettre à jour la date de modification
        await node.update({
          modified_at: new Date()
        }, { transaction: t });
      }
      
      // Mettre à jour les données du client
      const clientData = {};
      if (client_code) clientData.client_code = client_code;
      if (country) clientData.country = country;
      if (city) clientData.city = city;
      if (client_group) clientData.client_group = client_group;
      if (address) clientData.address = address;
      
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
    
    return res.status(200).json(updatedClient);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du client', error: error.message });
  }
};

/**
 * Supprimer un client et tous ses descendants
 */
exports.deleteClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const client = await Node.findOne({
      where: { id: clientId, type: 'client' }
    });
    
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // La cascade de suppression s'occupera de supprimer tous les enregistrements associés
    await client.destroy();
    
    return res.status(200).json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du client:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression du client', error: error.message });
  }
};