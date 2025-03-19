const { Node, Closure, Client, Order, Part, Test, File, Furnace, Steel } = require('../models');
const { Op } = require('sequelize');

// Fonction utilitaire pour obtenir le modèle correspondant au type
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

// Fonction utilitaire pour obtenir les attributs à inclure selon le type
const getAttributesForType = (type) => {
  const typeAttributesMap = {
    'client': ['country', 'city', 'client_group','address'],
    'order': ['order_number', 'status', 'order_date', 'commercial'],
    'part': ['designation', 'steel'],
    'test': ['test_code', 'status', 'test_date', 'location', 'is_mesured'],
    'file': ['size', 'mime_type'],
    'furnace': ['furnace_type', 'furnace_size'],
    'steel': ['grade', 'standard', 'family']
  };
  return typeAttributesMap[type] || [];
};

/**
 * Remplace la procédure p_get_nodes
 * Récupère les nœuds d'un type spécifique avec pagination
 */
exports.getNodes = async (req, res) => {
  try {
    const { ancestorId = 0, type, depth = 1, limit = 10, offset = 0 } = req.query;
    
    // Validation des entrées
    if (!type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
      return res.status(400).json({ message: 'Type de nœud invalide' });
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

    return res.status(200).json(nodes);
  } catch (error) {
    console.error('Erreur lors de la récupération des nœuds:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des nœuds', error: error.message });
  }
};

/**
 * Remplace la procédure p_get_node_details
 * Récupère les détails d'un nœud spécifique
 */
exports.getNodeDetails = async (req, res) => {
  try {
    const { nodeId, type } = req.params;
    
    // Validation des entrées
    if (!type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
      return res.status(400).json({ message: 'Type de nœud invalide' });
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
      return res.status(404).json({ message: 'Nœud non trouvé' });
    }
    
    return res.status(200).json(node);
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du nœud:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des détails du nœud', error: error.message });
  }
};

/**
 * Remplace la procédure p_get_total
 * Compte le nombre total de nœuds d'un type spécifique
 */
exports.getTotalNodes = async (req, res) => {
  try {
    const { ancestorId = 0, type } = req.query;
    
    // Validation des entrées
    if (!type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
      return res.status(400).json({ message: 'Type de nœud invalide' });
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
    
    return res.status(200).json({ total: count });
  } catch (error) {
    console.error('Erreur lors du comptage des nœuds:', error);
    return res.status(500).json({ message: 'Erreur lors du comptage des nœuds', error: error.message });
  }
};

/**
 * Fonction pour créer un nouveau nœud et ses relations de hiérarchie
 */
exports.createNode = async (req, res) => {
  try {
    const { name, type, parentId, data, description } = req.body;
    
    // Validation des entrées
    if (!name || !type || !['client', 'order', 'test', 'file', 'part', 'furnace', 'steel'].includes(type)) {
      return res.status(400).json({ message: 'Données de nœud invalides' });
    }
    
    // Si ce n'est pas un client ou un acier sans parent, vérifier que le parent existe
    if (type !== 'client' && (type !== 'steel' || parentId)) {
      if (!parentId) {
        return res.status(400).json({ message: 'ID du parent requis pour ce type de nœud' });
      }
      
      const parentNode = await Node.findByPk(parentId);
      if (!parentNode) {
        return res.status(404).json({ message: 'Nœud parent non trouvé' });
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
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Erreur lors de la création du nœud:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du nœud', error: error.message });
  }
};

/**
 * Fonction pour mettre à jour un nœud existant
 */
exports.updateNode = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { name, data } = req.body;
    
    const node = await Node.findByPk(nodeId);
    if (!node) {
      return res.status(404).json({ message: 'Nœud non trouvé' });
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
    
    return res.status(200).json(updatedNode);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du nœud:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du nœud', error: error.message });
  }
};


exports.getTable = async (req, res) => {
  try {
    const { parentId = null, limit = 10, page = 1 } = req.query;
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
    
    return res.status(200).json({
      nodes,
      pagination: {
        total: count,
        pages: Math.ceil(count / limit),
        current: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return res.status(500).json({ error: 'Failed to fetch nodes' });
  }
};

exports.getAllNodes = async (req, res) => {
  try {
    const nodes = await Node.findAll();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNodeById = async (req, res) => {
  try {
    const node = await Node.findByPk(req.params.id);
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateNodeStatus = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { status } = req.body;
    
    const node = await Node.findByPk(nodeId);
    if (!node) {
      return res.status(404).json({ message: 'Nœud non trouvé' });
    }
    
    // Mettre à jour le statut et la date de modification
    await node.update({
      data_status: status,
      modified_at: new Date()
    });
    
    return res.status(200).json({ 
      message: 'Statut mis à jour avec succès',
      id: nodeId,
      data_status: status
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du nœud:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du statut', error: error.message });
  }
};





