// server/controllers/steelController.js
const { Node, Steel, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Fonction utilitaire pour valider les données d'un acier
 * @param {Object} data - Données de l'acier à valider
 * @returns {Object} - Objet contenant les erreurs de validation et un boolean indiquant si les données sont valides
 */
const validateSteelData = (data) => {
  const errors = {};

  // Validation des champs obligatoires
  if (!data.grade) {
    errors.grade = 'Grade de l\'acier requis';
  }

  // Vérifier si les équivalents sont bien remplis
  if (data.equivalents && data.equivalents.length > 0) {
    const invalidEquivalents = data.equivalents.filter(eq => !eq.steel_id);
    if (invalidEquivalents.length > 0) {
      errors.equivalents = 'Tous les équivalents doivent avoir un acier sélectionné';
    }
  }

  // Vérifier si les éléments chimiques sont bien remplis
  if (data.elements && data.elements.length > 0) {
    const elementErrors = [];
    let hasErrors = false;

    data.elements.forEach((element, index) => {
      const elementError = {};

      if (!element.element) {
        elementError.element = 'Élément chimique requis';
        hasErrors = true;
      }

      if (element.rate_type === 'exact' && element.value === undefined) {
        elementError.value = 'Valeur requise pour le type exact';
        hasErrors = true;
      }

      if (element.rate_type === 'range') {
        if (element.min_value === undefined) {
          elementError.min_value = 'Valeur minimum requise';
          hasErrors = true;
        }
        if (element.max_value === undefined) {
          elementError.max_value = 'Valeur maximum requise';
          hasErrors = true;
        }
        if (element.min_value !== undefined && element.max_value !== undefined && 
            parseFloat(element.min_value) >= parseFloat(element.max_value)) {
          elementError.range = 'La valeur minimum doit être inférieure à la valeur maximum';
          hasErrors = true;
        }
      }

      if (Object.keys(elementError).length > 0) {
        elementErrors[index] = elementError;
      }
    });

    if (hasErrors) {
      errors.elements = elementErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

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

exports.getSteelsGrades = async (req, res) => {
  try {
    const steels = await Node.findAll({
      where: { type: 'steel' },
      include: [{
        model: Steel,
        attributes: ['grade'] 
      }],
    });
    
    // Extraction des grades uniques
    const grades = steels
      .filter(node => node.Steel && node.Steel.grade)
      .map(node => node.Steel.grade)
      .filter((grade, index, self) => self.indexOf(grade) === index);
    
    return res.status(200).json({
      success: true,
      data: grades
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des grades d\'acier:', error);
    return res.status(500).json({ 
      message: 'Erreur lors de la récupération des grades d\'acier', 
      error: error.message 
    });
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
    const { 
      name, 
      grade, 
      family, 
      standard, 
      equivalents, 
      chemistery,
      elements 
    } = req.body;
    
    // Validation des données
    const { isValid, errors } = validateSteelData(req.body);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors 
      });
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
      
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path,
        type: 'steel',
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
    
    // Validation des données
    const { isValid, errors } = validateSteelData(req.body);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Données invalides', 
        errors 
      });
    }
    
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
        where: { 
          grade,
          node_id: { [Op.ne]: steelId } // Exclure l'acier actuel
        }
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