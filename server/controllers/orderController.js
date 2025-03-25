const { Node, Order, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer toutes les commandes avec pagination
 */
exports.getOrders = async (req, res) => {
  try {
    const { limit = 10, offset = 0, parent_id } = req.query;
    
    const whereCondition = { type: 'order' };
    
    // Si un parent_id est fourni, filtrer par parent direct
    if (parent_id) {
      whereCondition.parent_id = parent_id;
    }
    
    const orders = await Node.findAll({
      where: whereCondition,
      include: [{
        model: Order,
        attributes: ['order_number', 'order_date', 'commercial', 'contacts']
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
    const {  
      parent_id, 
      order_date, 
      description, 
      commercial, 
      contacts 
    } = req.body;
    
    // Validation des données
    if (!parent_id) {
      return res.status(400).json({ message: 'ID parent est requis' });
    }
    
    // Vérifier si le parent existe et est un client
    const parentNode = await Node.findByPk(parent_id);
    if (!parentNode) {
      return res.status(404).json({ message: 'Node parent non trouvé' });
    }
    
    if (parentNode.type !== 'client') {
      return res.status(400).json({ message: 'Le parent doit être un client' });
    }
    
    // Vérifier si une commande existe déjà pour la même date
    const orderDate = new Date(order_date);
    const formattedDate = orderDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Fonction pour générer le nom avec indice si nécessaire
    async function generateNodeName() {
      const baseName = `TRQ_${formattedDate}`;
      
      // Trouver toutes les commandes du même jour
      const existingNodes = await Node.findAll({
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
    
    // Créer la commande dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Générer le nom du nœud avec indice si nécessaire
      const nodeName = await generateNodeName();
      
      // Créer le nœud
      const newNode = await Node.create({
        name: nodeName,
        path: `${parentNode.path}/${nodeName}`,
        type: 'order',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new',
        description
      }, { transaction: t });
      
      // Générer le numéro de commande basé sur l'ID du nœud
      const order_number = `TRQ_${newNode.id}`;
      
      // Créer les données de la commande
      await Order.create({
        node_id: newNode.id,
        order_number,
        order_date: order_date || null, 
        commercial,
        contacts: contacts || []
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
    return res.status(500).json({ 
      message: 'Erreur lors de la création de la commande', 
      error: error.message 
    });
  }
};

/**
 * Mettre à jour une commande existante
 */
exports.updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { name, order_number, order_date, status, commercial, contacts, description } = req.body;
    
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
  // Créer une transaction pour assurer l'intégrité des données
  const t = await sequelize.transaction();
  
  try {
    const { orderId } = req.params;
    
    // 1. Vérifier que la commande existe
    const order = await Node.findOne({
      where: { id: orderId, type: 'order' },
      transaction: t
    });
    
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await Closure.findAll({
      where: { ancestor_id: orderId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(orderId)); // Ajouter l'ID de la commande elle-même
    
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
    
    return res.status(200).json({ 
      message: 'Commande supprimée avec succès',
      deletedId: orderId
    });
    
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await t.rollback();
    console.error('Erreur lors de la suppression de la commande:', error);
    
    return res.status(500).json({ 
      message: 'Erreur lors de la suppression de la commande', 
      error: error.message 
    });
  }
};


