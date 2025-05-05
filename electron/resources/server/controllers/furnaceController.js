const { Node, Furnace, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les fours avec pagination
 */
exports.getFurnaces = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const furnaces = await Node.findAll({
      where: { type: 'furnace' },
      include: [{
        model: Furnace,
        attributes: ['furnace_type', 'furnace_size', 'heating_cell_type', 'cooling_media', 'process_type', 'quench_cell']
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: { type: 'furnace' }
    });
    
    return res.status(200).json({
      furnaces,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des fours:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des fours', error: error.message });
  }
};

/**
 * Récupérer un four spécifique
 */
exports.getFurnaceById = async (req, res) => {
  try {
    const { furnaceId } = req.params;
    
    const furnace = await Node.findOne({
      where: { id: furnaceId, type: 'furnace' },
      include: [{
        model: Furnace,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!furnace) {
      return res.status(404).json({ message: 'Four non trouvé' });
    }
    
    return res.status(200).json(furnace);
  } catch (error) {
    console.error('Erreur lors de la récupération du four:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du four', error: error.message });
  }
};

/**
 * Créer un nouveau four
 */
exports.createFurnace = async (req, res) => {
  try {
    const { name, parent_id, furnace_type, furnace_size, heating_cell_type, cooling_media, process_type, quench_cell } = req.body;
    
    // Validation des données
    if (!name) {
      return res.status(400).json({ message: 'Nom du four requis' });
    }
    
    // Vérifier si le parent existe
    let parentPath = '';
    if (parent_id) {
      const parentNode = await Node.findByPk(parent_id);
      if (!parentNode) {
        return res.status(404).json({ message: 'Node parent non trouvé' });
      }
      parentPath = parentNode.path;
    }
    
    // Créer le four dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path: parent_id ? `${parentPath}/${name}` : `/${name}`,
        type: 'furnace',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new'
      }, { transaction: t });
      
      // Créer les données du four
      await Furnace.create({
        node_id: newNode.id,
        furnace_type,
        furnace_size,
        heating_cell_type,
        cooling_media,
        process_type,
        quench_cell
      }, { transaction: t });
      
      // Créer l'entrée de fermeture (auto-relation)
      await Closure.create({
        ancestor_id: newNode.id,
        descendant_id: newNode.id,
        depth: 0
      }, { transaction: t });
      
      // Si un parent est spécifié, créer les relations de fermeture appropriées
      if (parent_id) {
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
      }
      
      return newNode;
    });
    
    // Récupérer le four complet avec ses données associées
    const newFurnace = await Node.findByPk(result.id, {
      include: [{
        model: Furnace,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(201).json(newFurnace);
  } catch (error) {
    console.error('Erreur lors de la création du four:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du four', error: error.message });
  }
};

/**
 * Mettre à jour un four existant
 */
exports.updateFurnace = async (req, res) => {
  try {
    const { furnaceId } = req.params;
    const { name, furnace_type, furnace_size, heating_cell_type, cooling_media, process_type, quench_cell } = req.body;
    
    const node = await Node.findOne({
      where: { id: furnaceId, type: 'furnace' },
      include: [{
        model: Furnace
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Four non trouvé' });
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
              ancestor_id: furnaceId,
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
      
      // Mettre à jour les données du four
      const furnaceData = {};
      if (furnace_type) furnaceData.furnace_type = furnace_type;
      if (furnace_size) furnaceData.furnace_size = furnace_size;
      if (heating_cell_type) furnaceData.heating_cell_type = heating_cell_type;
      if (cooling_media) furnaceData.cooling_media = cooling_media;
      if (process_type) furnaceData.process_type = process_type;
      if (quench_cell) furnaceData.quench_cell = quench_cell;
      
      if (Object.keys(furnaceData).length > 0) {
        await Furnace.update(furnaceData, {
          where: { node_id: furnaceId },
          transaction: t
        });
      }
    });
    
    // Récupérer et renvoyer le four mis à jour
    const updatedFurnace = await Node.findByPk(furnaceId, {
      include: [{
        model: Furnace,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(200).json(updatedFurnace);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du four:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du four', error: error.message });
  }
};

/**
 * Supprimer un four et tous ses descendants
 */
exports.deleteFurnace = async (req, res) => {
  try {
    const { furnaceId } = req.params;
    
    const furnace = await Node.findOne({
      where: { id: furnaceId, type: 'furnace' }
    });
    
    if (!furnace) {
      return res.status(404).json({ message: 'Four non trouvé' });
    }
    
    // La cascade de suppression s'occupera de supprimer tous les enregistrements associés
    await furnace.destroy();
    
    return res.status(200).json({ message: 'Four supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du four:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression du four', error: error.message });
  }
};