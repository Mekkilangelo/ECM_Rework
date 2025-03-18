// server/controllers/steelController.js
const { Node, Steel, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les aciers avec pagination
 */
exports.getSteels = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const steels = await Node.findAll({
      where: { type: 'steel' },
      include: [{
        model: Steel,
        attributes: ['grade', 'family', 'standard', 'equivalents', 'chemistery', 'elements']
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: { type: 'steel' }
    });
    
    return res.status(200).json({
      steels,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des aciers:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des aciers', error: error.message });
  }
};

/**
 * Récupérer un acier spécifique
 */
exports.getSteelById = async (req, res) => {
  try {
    const { steelId } = req.params;
    
    const steel = await Node.findOne({
      where: { id: steelId, type: 'steel' },
      include: [{
        model: Steel,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!steel) {
      return res.status(404).json({ message: 'Acier non trouvé' });
    }
    
    return res.status(200).json(steel);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'acier:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération de l\'acier', error: error.message });
  }
};

/**
 * Créer un nouvel acier
 */
exports.createSteel = async (req, res) => {
  try {
    const { name, grade, family, standard, equivalents, chemistery, elements, parent_id } = req.body;
    
    // Validation des données
    if (!name || !grade) {
      return res.status(400).json({ message: 'Nom et grade requis' });
    }
    
    // Vérifier si le grade est déjà utilisé
    const existingSteel = await Steel.findOne({
      where: { grade }
    });
    
    if (existingSteel) {
      return res.status(409).json({ message: 'Ce grade d\'acier existe déjà' });
    }
    
    // Créer l'acier dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Préparer le chemin
      let path = `/${name}`;
      if (parent_id) {
        const parentNode = await Node.findByPk(parent_id, { transaction: t });
        if (parentNode) {
          path = `${parentNode.path}/${name}`;
        }
      }
      
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path,
        type: 'steel',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new'
      }, { transaction: t });
      
      // Créer les données de l'acier
      await Steel.create({
        node_id: newNode.id,
        grade,
        family,
        standard,
        equivalents,
        chemistery,
        elements
      }, { transaction: t });
      
      // Créer l'entrée de fermeture (auto-relation)
      await Closure.create({
        ancestor_id: newNode.id,
        descendant_id: newNode.id,
        depth: 0
      }, { transaction: t });
      
      // Si parent_id est spécifié, créer des relations closure avec tous ses ancêtres
      if (parent_id) {
        const parentClosures = await Closure.findAll({
          where: { descendant_id: parent_id },
          transaction: t
        });
        
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
    
    // Récupérer l'acier complet avec ses données associées
    const newSteel = await Node.findByPk(result.id, {
      include: [{
        model: Steel,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(201).json(newSteel);
  } catch (error) {
    console.error('Erreur lors de la création de l\'acier:', error);
    return res.status(500).json({ message: 'Erreur lors de la création de l\'acier', error: error.message });
  }
};

/**
 * Mettre à jour un acier existant
 */
exports.updateSteel = async (req, res) => {
  try {
    const { steelId } = req.params;
    const { name, grade, family, standard, equivalents, chemistery, elements } = req.body;
    
    const node = await Node.findOne({
      where: { id: steelId, type: 'steel' },
      include: [{
        model: Steel
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Acier non trouvé' });
    }
    
    // Si le grade change, vérifier s'il est déjà utilisé
    if (grade && grade !== node.Steel.grade) {
      const existingSteel = await Steel.findOne({
        where: { grade }
      });
      
      if (existingSteel) {
        return res.status(409).json({ message: 'Ce grade d\'acier existe déjà' });
      }
    }
    
    await sequelize.transaction(async (t) => {
      // Mettre à jour le nœud
      if (name) {
        const oldPath = node.path;
        const parentPath = node.parent_id ? 
          (await Node.findByPk(node.parent_id, { transaction: t })).path : 
          '';
        const newPath = parentPath ? `${parentPath}/${name}` : `/${name}`;
        
        await node.update({
          name,
          path: newPath,
          modified_at: new Date()
        }, { transaction: t });
        
        // Si le nom a changé, mettre à jour les chemins des descendants
        if (name !== node.name) {
          const descendants = await Closure.findAll({
            where: { 
              ancestor_id: steelId,
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
      
      // Mettre à jour les données de l'acier
      const steelData = {};
      if (grade) steelData.grade = grade;
      if (family) steelData.family = family;
      if (standard) steelData.standard = standard;
      if (equivalents) steelData.equivalents = equivalents;
      if (chemistery) steelData.chemistery = chemistery;
      if (elements) steelData.elements = elements;
      
      if (Object.keys(steelData).length > 0) {
        await Steel.update(steelData, {
          where: { node_id: steelId },
          transaction: t
        });
      }
    });
    
    // Récupérer et renvoyer l'acier mis à jour
    const updatedSteel = await Node.findByPk(steelId, {
      include: [{
        model: Steel,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(200).json(updatedSteel);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'acier:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'acier', error: error.message });
  }
};

/**
 * Supprimer un acier
 */
exports.deleteSteel = async (req, res) => {
  try {
    const { steelId } = req.params;
    
    const steel = await Node.findOne({
      where: { id: steelId, type: 'steel' }
    });
    
    if (!steel) {
      return res.status(404).json({ message: 'Acier non trouvé' });
    }
    
    // La cascade de suppression s'occupera de supprimer tous les enregistrements associés
    await steel.destroy();
    
    return res.status(200).json({ message: 'Acier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'acier:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression de l\'acier', error: error.message });
  }
};