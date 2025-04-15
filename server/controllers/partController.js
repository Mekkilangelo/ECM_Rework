const { Node, Part, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer toutes les pièces avec pagination
 */
exports.getParts = async (req, res) => {
  try {
    const { limit = 10, offset = 0, parent_id } = req.query;
    
    const whereCondition = { type: 'part' };
    
    // Si un order_id est fourni, rechercher les pièces associées à cette commande
    if (parent_id) {
      const orderDescendants = await Closure.findAll({
        where: { ancestor_id: parent_id },
        attributes: ['descendant_id']
      });
      
      const descendantIds = orderDescendants.map(d => d.descendant_id);
      
      whereCondition.id = {
        [Op.in]: descendantIds
      };
    }
    
    const parts = await Node.findAll({
      where: whereCondition,
      include: [{
        model: Part,
        attributes: ['designation', 'client_designation', 'dimensions', 'specifications', 'steel', 'reference','quantity']
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: whereCondition
    });
    
    return res.status(200).json({
      parts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des pièces:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des pièces', error: error.message });
  }
};

/**
 * Récupérer une pièce spécifique
 */
exports.getPartById = async (req, res) => {
  try {
    const { partId } = req.params;
    
    const part = await Node.findOne({
      where: { id: partId, type: 'part' },
      include: [{
        model: Part,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!part) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    
    return res.status(200).json(part);
  } catch (error) {
    console.error('Erreur lors de la récupération de la pièce:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de la pièce', error: error.message });
  }
};

/**
 * Créer une nouvelle pièce
 */
exports.createPart = async (req, res) => {
  try {
    const { parent_id, designation, dimensions, specifications, steel, description, clientDesignation, reference, quantity } = req.body;

    const name = req.body.designation || null;
    
    // Validation des données
    if (!name || !parent_id) {
      return res.status(400).json({ message: 'Nom et ID parent sont requis' });
    }
    
    // Vérifier si le parent existe et est une commande
    const parentNode = await Node.findByPk(parent_id);
    if (!parentNode) {
      return res.status(404).json({ message: 'Node parent non trouvé' });
    }
    
    if (parentNode.type !== 'order') {
      return res.status(400).json({ message: 'Le parent doit être une commande' });
    }
    
    // Créer la pièce dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path: `${parentNode.path}/${name}`,
        type: 'part',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new',
        description
      }, { transaction: t });
      
      // Créer les données de la pièce
      await Part.create({
        node_id: newNode.id,
        designation,
        dimensions,
        specifications,
        steel,
        client_designation: clientDesignation,
        reference,
        quantity
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
    
    // Récupérer la pièce complète avec ses données associées
    const newPart = await Node.findByPk(result.id, {
      include: [{
        model: Part,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(201).json(newPart);
  } catch (error) {
    console.error('Erreur lors de la création de la pièce:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de la pièce', error: error.message });
  }
};

/**
 * Mettre à jour une pièce existante
 */
exports.updatePart = async (req, res) => {
  try {
    const { partId } = req.params;
    const { designation, dimensions, specifications, steel, description, clientDesignation, reference, quantity } = req.body;

    const name = req.body.designation || null;
    
    const node = await Node.findOne({
      where: { id: partId, type: 'part' },
      include: [{
        model: Part
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    
    await sequelize.transaction(async (t) => {
      // Mettre à jour le nœud
      if (name) {
        const oldPath = node.path;
        const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + name;
        
        await node.update({
          name,
          path: newPath,
          modified_at: new Date(),
          description
        }, { transaction: t });
        
        // Si le nom a changé, mettre à jour les chemins des descendants
        if (name !== node.name) {
          const descendants = await Closure.findAll({
            where: { 
              ancestor_id: partId,
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
          modified_at: new Date(),
          description
        }, { transaction: t });
      }
      
      // Mettre à jour les données de la pièce
      const partData = {};
      partData.designation = designation;
      partData.dimensions = dimensions;
      partData.specifications = specifications;
      partData.steel = steel;
      partData.client_designation = clientDesignation;
      partData.reference = reference;
      partData.quantity = quantity;
      
      if (Object.keys(partData).length > 0) {
        await Part.update(partData, {
          where: { node_id: partId },
          transaction: t
        });
      }
    });
    
    // Récupérer et renvoyer la pièce mise à jour
    const updatedPart = await Node.findByPk(partId, {
      include: [{
        model: Part,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(200).json(updatedPart);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la pièce:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de la pièce', error: error.message });
  }
};

/**
 * Supprimer une pièce et tous ses descendants
 */
exports.deletePart = async (req, res) => {
  // Créer une transaction pour assurer l'intégrité des données
  const t = await sequelize.transaction();
  
  try {
    const { partId } = req.params;
    
    // 1. Vérifier que la pièce existe
    const part = await Node.findOne({
      where: { id: partId, type: 'part' },
      transaction: t
    });
    
    if (!part) {
      await t.rollback();
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await Closure.findAll({
      where: { ancestor_id: partId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(partId)); // Ajouter l'ID de la pièce elle-même
    
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
      message: 'Pièce supprimée avec succès',
      deletedId: partId
    });
    
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await t.rollback();
    console.error('Erreur lors de la suppression de la pièce:', error);
    
    return res.status(500).json({ 
      message: 'Erreur lors de la suppression de la pièce', 
      error: error.message 
    });
  }
};