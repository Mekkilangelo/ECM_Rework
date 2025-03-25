// server/controllers/testController.js
const { Node, Test, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Récupérer tous les tests avec pagination
 */
exports.getTests = async (req, res) => {
  try {
    const { limit = 10, offset = 0, parent_id } = req.query;
    
    const whereCondition = { type: 'test' };

    // Si un part_id est fourni, rechercher les tests associés à cette pièce
    if (parent_id) {
      const partsDescendants = await Closure.findAll({
        where: { ancestor_id: parent_id },
        attributes: ['descendant_id']
      });
      
      const descendantIds = partsDescendants.map(d => d.descendant_id);
      
      whereCondition.id = {
        [Op.in]: descendantIds
      };
    }
    
    const tests = await Node.findAll({
      where: whereCondition,
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }],
      order: [['modified_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Node.count({
      where: whereCondition
    });
    
    return res.status(200).json({
      tests,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des tests:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération des tests', error: error.message });
  }
};

/**
 * Récupérer un test spécifique
 */
exports.getTestById = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Node.findOne({
      where: { id: testId, type: 'test' },
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    return res.status(200).json(test);
  } catch (error) {
    console.error('Erreur lors de la récupération du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la récupération du test', error: error.message });
  }
};

/**
 * Créer un nouveau test
 */
exports.createTest = async (req, res) => {
  try {
    const { 
      name,  
      test_date, 
      status,
      location,
      is_mesured,
      furnace_data,
      load_data,
      recipe_data,
      quench_data,
      mounting_type,
      position_type,
      process_type,
      parent_id,
      description 
    } = req.body;
    
    // Validation des données
    if (!name || !parent_id) {
      return res.status(400).json({ message: 'Nom et ID parent requis' });
    }
    
    // Vérifier si le code de test est déjà utilisé
    // const existingTest = await Test.findOne({
    //   where: { test_code }
    // });
    
    // if (existingTest) {
    //   return res.status(409).json({ message: 'Ce code de test existe déjà' });
    // }
    
    // Vérifier si le parent existe
    const parentNode = await Node.findByPk(parent_id);
    if (!parentNode) {
      return res.status(404).json({ message: 'Nœud parent non trouvé' });
    }
    
    // Créer le test dans une transaction
    const result = await sequelize.transaction(async (t) => {
      // Créer le nœud
      const newNode = await Node.create({
        name,
        path: `${parentNode.path}/${name}`,
        type: 'test',
        parent_id,
        created_at: new Date(),
        modified_at: new Date(),
        data_status: 'new',
        description
      }, { transaction: t });
      
      // Générer le numéro de commande basé sur l'ID du nœud
      const test_code = `TRIAL_${newNode.id}`;

      // Créer les données du test
      await Test.create({
        node_id: newNode.id,
        test_code,
        test_date: test_date || new Date(),
        status: status || 'planned',
        location,
        is_mesured,
        furnace_data,
        load_data,
        recipe_data,
        quench_data,
        mounting_type,
        position_type,
        process_type
      }, { transaction: t });
      
      // Créer l'entrée de fermeture (auto-relation)
      await Closure.create({
        ancestor_id: newNode.id,
        descendant_id: newNode.id,
        depth: 0
      }, { transaction: t });
      
      // Créer des relations closure avec tous les ancêtres du parent
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
      
      return newNode;
    });
    
    // Récupérer le test complet avec ses données associées
    const newTest = await Node.findByPk(result.id, {
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(201).json(newTest);
  } catch (error) {
    console.error('Erreur lors de la création du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la création du test', error: error.message });
  }
};

/**
 * Mettre à jour un test existant
 */
exports.updateTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { 
      name, 
      test_code, 
      test_date, 
      status,
      location,
      is_mesured,
      furnace_data,
      load_data,
      recipe_data,
      quench_data,
      results_data,
      mounting_type,
      position_type,
      process_type 
    } = req.body;
    
    const node = await Node.findOne({
      where: { id: testId, type: 'test' },
      include: [{
        model: Test
      }]
    });
    
    if (!node) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    // Si le code de test change, vérifier s'il est déjà utilisé
    if (test_code && test_code !== node.Test.test_code) {
      const existingTest = await Test.findOne({
        where: { test_code }
      });
      
      if (existingTest) {
        return res.status(409).json({ message: 'Ce code de test existe déjà' });
      }
    }
    
    await sequelize.transaction(async (t) => {
      // Mettre à jour le nœud
      if (name) {
        const oldPath = node.path;
        const parentPath = (await Node.findByPk(node.parent_id, { transaction: t })).path;
        const newPath = `${parentPath}/${name}`;
        
        await node.update({
          name,
          path: newPath,
          modified_at: new Date()
        }, { transaction: t });
        
        // Si le nom a changé, mettre à jour les chemins des descendants
        if (name !== node.name) {
          const descendants = await Closure.findAll({
            where: { 
              ancestor_id: testId,
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
      
      // Mettre à jour les données du test
      const testData = {};
      if (test_code) testData.test_code = test_code;
      if (test_date) testData.test_date = test_date;
      if (status) testData.status = status;
      if (location !== undefined) testData.location = location;
      if (is_mesured !== undefined) testData.is_mesured = is_mesured;
      if (furnace_data) testData.furnace_data = furnace_data;
      if (load_data) testData.load_data = load_data;
      if (recipe_data) testData.recipe_data = recipe_data;
      if (quench_data) testData.quench_data = quench_data;
      if (results_data) testData.results_data = results_data;
      if (mounting_type) testData.mounting_type = mounting_type;
      if (position_type) testData.position_type = position_type;
      if (process_type) testData.process_type = process_type;
      
      if (Object.keys(testData).length > 0) {
        await Test.update(testData, {
          where: { node_id: testId },
          transaction: t
        });
      }
    });
    
    // Récupérer et renvoyer le test mis à jour
    const updatedTest = await Node.findByPk(testId, {
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    return res.status(200).json(updatedTest);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la mise à jour du test', error: error.message });
  }
};

/**
 * Supprimer un test
 */
exports.deleteTest = async (req, res) => {
  try {
    const { testId } = req.params;
    
    const test = await Node.findOne({
      where: { id: testId, type: 'test' }
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    // La cascade de suppression s'occupera de supprimer tous les enregistrements associés
    await test.destroy();
    
    return res.status(200).json({ message: 'Test supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du test:', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression du test', error: error.message });
  }
};