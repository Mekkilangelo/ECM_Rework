const { Node, Order, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer toutes les commandes avec pagination
 */
exports.getOrders = async (req, res) => {
  try {
    const { limit = 10, offset = 0, client_id } = req.query;
    
    const whereCondition = { type: 'order' };
    
    // Si un client_id est fourni, rechercher les commandes associées à ce client
    if (client_id) {
      const clientDescendants = await Closure.findAll({
        where: { ancestor_id: client_id },
        attributes: ['descendant_id']
      });
      
      const descendantIds = clientDescendants.map(d => d.descendant_id);
      
      whereCondition.id = {
        [Op.in]: descendantIds
      };
    }
    
    const orders = await Node.findAll({
      where: whereCondition,
      include: [{
        model: Order,
        attributes: ['order_number', 'order_date', 'status', 'commercial', 'contacts']
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: whereCondition
    });
    
    return res.status(200).json({
      orders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des commandes', error: error.message });
  }
};

/**
 * Récupérer une commande spécifique
 */
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Node.findOne({
      where: { id: orderId, type: 'order' },
      include: [{
        model: Order,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    return res.status(200).json(order);
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la commande', error: error.message });
  }
};

/**
 * Créer une nouvelle commande
 */
exports.createOrder = async (req, res) => {
  try {
    const { name, parent_id, order_number, order_date, status, commercial, contacts } = req.body;
    
    // Validation des données
    if (!name || !order_number || !parent_id) {
      return res.status(400).json({ message: 'Nom, numéro de commande et ID parent sont requis' });
    }
    
    // Vérifier si le numéro de commande est déjà utilisé
    const existingOrder = await Order.findOne({
      where: { order_number }
    });
    
    if (existingOrder) {
      return res.status(409).json({ message: 'Ce numéro de commande existe déjà' });
    }
    
    // Vérifier si le parent existe et est un client
    const parentNode = await Node.findByPk(parent_id);
    if (!parentNode) {
      return res.status(404).json({ message: 'Node parent non trouvé' });
    }
    
    if (parentNode.type !== 'client') {
      return res.status(400).json({ message: 'Le parent doit être un client' });
    }
    
    // Créer la commande dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path: `${parentNode.path}/${name}`,
        type: 'order',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new'
      }, { transaction: t });
      
      // Créer les données de la commande
      await Order.create({
        node_id: newNode.id,
        order_number,
        order_date: order_date || null,
        status: status || 'en_cours',
        commercial,
        contacts
      }, { transaction: t });
      
      // Créer l'entrée de fermeture (auto-relation)
      await Closure.create({
        ancestor_id: newNode.id,
        descendant_id: newNode.id,
        depth: 0
      }, { transaction: t });
      
      // Créer les relations de fermeture avec les ancêtres
      const parentClosures = await Closure.findAll({
        where: { descendant_id: parent_id },
        transaction: t
      });
      
      for (const pc of parentClosures) {
        await Closure.create({
          ancestor_id: pc.ancestor_id,
          descendant_id: newNode.id,
          depth: pc.depth + 1
        }, { transaction: t });
      }
      
      return newNode;
    });
    
    // Récupérer la commande complète avec ses données associées
    const newOrder = await Node.findByPk(result.id, {
      include: [{
        model: Order,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(201).json(newOrder);
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la commande', error: error.message });
  }
};

/**
 * Mettre à jour une commande existante
 */
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { name, order_number, order_date, status, commercial, contacts } = req.body;
    
    const node = await Node.findOne({
      where: { id: orderId, type: 'order' },
      include: [{
        model: Order
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    // Si le numéro de commande change, vérifier s'il est déjà utilisé
    if (order_number && order_number !== node.Order.order_number) {
      const existingOrder = await Order.findOne({
        where: { order_number }
      });
      
      if (existingOrder) {
        return res.status(409).json({ message: 'Ce numéro de commande existe déjà' });
      }
    }
    
    await sequelize.transaction(async (t) => {
      // Mettre à jour le nœud
      if (name) {
        const oldPath = node.path;
        const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + name;
        
        await node.update({
          name,
          path: newPath,
          modified_at: new Date()
        }, { transaction: t });
        
        // Si le nom a changé, mettre à jour les chemins des descendants
        if (name !== node.name) {
          const descendants = await Closure.findAll({
            where: { 
              ancestor_id: orderId,
              depth: { [Op.gt]: 0 }
            },
            transaction: t
          });
          
          for (const relation of descendants) {
            const descendant = await Node.findByPk(relation.descendant_id, { transaction: t });
            const descendantPath = descendant.path.replace(oldPath, newPath);
            await descendant.update({ path: descendantPath }, { transaction: t });
          }
        }
      } else {
        // Juste mettre à jour la date de modification
        await node.update({
          modified_at: new Date()
        }, { transaction: t });
      }
      
      // Mettre à jour les données de la commande
      const orderData = {};
      if (order_number) orderData.order_number = order_number;
      if (order_date !== undefined) orderData.order_date = order_date;
      if (status) orderData.status = status;
      if (commercial) orderData.commercial = commercial;
      if (contacts) orderData.contacts = contacts;
      
      if (Object.keys(orderData).length > 0) {
        await Order.update(orderData, {
          where: { node_id: orderId },
          transaction: t
        });
      }
    });
    
    // Récupérer et renvoyer la commande mise à jour
    const updatedOrder = await Node.findByPk(orderId, {
      include: [{
        model: Order,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la commande:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la commande', error: error.message });
  }
};

/**
 * Supprimer une commande et tous ses descendants
 */
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Node.findOne({
      where: { id: orderId, type: 'order' }
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    // La cascade de suppression s'occupera de supprimer tous les enregistrements associés
    await order.destroy();
    
    return res.status(200).json({ message: 'Commande supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la commande:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la commande', error: error.message });
  }
};