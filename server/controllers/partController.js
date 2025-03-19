const { Node, Part, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer toutes les pièces avec pagination
 */
exports.getParts = async (req, res) => {
  try {
    const { limit = 10, offset = 0, order_id } = req.query;
    
    const whereCondition = { type: 'part' };
    
    // Si un order_id est fourni, rechercher les pièces associées à cette commande
    if (order_id) {
      const orderDescendants = await Closure.findAll({
        where: { ancestor_id: order_id },
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
        attributes: ['designation', 'dimensions', 'specifications', 'steel']
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
    const { name, parent_id, designation, dimensions, specifications, steel, description } = req.body;
    
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
        designation: 'Pinion',
        dimensions,
        specifications,
        steel
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
    const { name, designation, dimensions, specifications, steel } = req.body;
    
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
          modified_at: new Date()
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
          modified_at: new Date()
        }, { transaction: t });
      }
      
      // Mettre à jour les données de la pièce
      const partData = {};
      if (designation) partData.designation = designation;
      if (dimensions) partData.dimensions = dimensions;
      if (specifications) partData.specifications = specifications;
      if (steel) partData.steel = steel;
      
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
  try {
    const { partId } = req.params;
    
    const part = await Node.findOne({
      where: { id: partId, type: 'part' }
    });
    
    if (!part) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    
    // La cascade de suppression s'occupera de supprimer tous les enregistrements associés
    await part.destroy();
    
    return res.status(200).json({ message: 'Pièce supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la pièce:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de la pièce', error: error.message });
  }
};