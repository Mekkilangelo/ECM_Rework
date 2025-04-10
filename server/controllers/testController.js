// server/controllers/testController.js
const { Node, Test, Part, Client, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Génère un nom séquentiel pour un nouveau test basé sur les tests existants avec le même parent
 * @param {string} parentId - ID du nœud parent
 * @returns {Promise<string>} - Nom généré (TRIAL_X)
 */
async function generateSequentialTestName(parentId) {
  try {
    // Récupérer tous les tests qui ont le même parent
    const testsWithSameParent = await Node.findAll({
      where: {
        parent_id: parentId,
        type: 'test'
      }
    });
    
    // S'il n'y a pas de tests existants, commencer à 1
    if (testsWithSameParent.length === 0) {
      return 'TRIAL_1';
    }
    
    // Extraire les numéros des noms existants
    const existingNumbers = testsWithSameParent
      .map(node => {
        const match = node.name.match(/TRIAL_(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));
    
    // Trouver le plus grand nombre
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    // Créer le nouveau nom avec le numéro suivant
    return `TRIAL_${maxNumber + 1}`;
  } catch (error) {
    console.error('Erreur lors de la génération du nom de test:', error);
    throw error;
  }
}

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
      load_number,
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
    if (!parent_id) {
      return res.status(400).json({ message: 'ID parent requis' });
    }
    
    // Vérifier si le parent existe
    const parentNode = await Node.findByPk(parent_id);
    if (!parentNode) {
      return res.status(404).json({ message: 'Nœud parent non trouvé' });
    }
    
    // Générer un nom séquentiel basé sur les tests existants avec le même parent
    const name = await generateSequentialTestName(parent_id);
    
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
        test_date: test_date || null,
        load_number: load_number || null,
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
      test_code, 
      test_date,
      load_number, 
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
      process_type,
      description 
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
      // Mettre à jour uniquement la description et la date de modification du nœud
      // Le nom reste inchangé après la création
      await node.update({
        modified_at: new Date(),
        description: description !== undefined ? description : node.description
      }, { transaction: t });
      
      // Mettre à jour les données du test
      const testData = {};
      if (test_code) testData.test_code = test_code;
      testData.test_date = test_date;
      if (load_number) testData.load_number = load_number;
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
  // Créer une transaction pour assurer l'intégrité des données
  const t = await sequelize.transaction();
  
  try {
    const { testId } = req.params;
    
    // 1. Vérifier que le test existe
    const test = await Node.findOne({
      where: { id: testId, type: 'test' },
      transaction: t
    });
    
    if (!test) {
      await t.rollback();
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await Closure.findAll({
      where: { ancestor_id: testId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(testId)); // Ajouter l'ID du test lui-même
    
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
      message: 'Test supprimé avec succès',
      deletedId: testId
    });
    
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await t.rollback();
    console.error('Erreur lors de la suppression du test:', error);
    
    return res.status(500).json({ 
      message: 'Erreur lors de la suppression du test', 
      error: error.message 
    });
  }
};

exports.getTestReportData = async (req, res) => {
  const { testId } = req.params;
  
  try {
    // Récupérer le test avec son noeud
    const test = await Test.findOne({
      where: { node_id: testId },
      include: [
        { 
          model: Node,
          attributes: ['id', 'name', 'path', 'type']
        }
      ]
    });

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    const testNodeId = test.node_id;

    // Trouver tous les ancêtres du test
    const ancestorRelations = await Closure.findAll({
      where: { descendant_id: testNodeId }
    });

    const ancestorIds = ancestorRelations.map(relation => relation.ancestor_id);
    
    // Récupérer les informations de la pièce
    const partData = await Node.findOne({
      where: { 
        id: { [Op.in]: ancestorIds },
        type: 'part' 
      },
      include: [
        { 
          model: require('../models').Part
        }
      ]
    });

    // Récupérer les informations du client
    const clientData = await Node.findOne({
      where: { 
        id: { [Op.in]: ancestorIds },
        type: 'client' 
      },
      include: [
        { 
          model: require('../models').Client
        }
      ]
    });

    // Préparer les données structurées pour le rapport
    const reportData = {
      test: {
        id: test.id,
        name: test.Node.name,
        testCode: test.test_code,
        testDate: test.test_date,
        status: test.status,
        location: test.location,
        loadData: test.load_data,
        processType: test.process_type
      },
      part: partData ? {
        designation: partData.Part.designation,
        reference: partData.name,
        steel: partData.Part.steel,
        specifications: partData.Part.specifications,
        dimensions: partData.Part.dimensions
      } : null,
      client: clientData ? {
        name: clientData.name,
        code: clientData.Client.client_code,
        city: clientData.Client.city,
        country: clientData.Client.country,
        address: clientData.Client.address
      } : null
    };

    res.json(reportData);
  } catch (error) {
    console.error('Error fetching report data:', error);
    res.status(500).json({ message: 'Failed to fetch report data', error: error.message });
  }
};

/**
 * Récupère les spécifications associées à un test
 * @route GET /tests/:testId/specs
 * @access Public
 */
exports.getTestSpecs = async (req, res) => {
  try {
    const { testId } = req.params;
    const { parentId } = req.query;

    // Vérifier si le test existe
    const test = await Test.findOne({
      where: { node_id: testId },
      include: [{ model: Node }]
    });

    if (!test) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }

    // Si parentId est fourni, utiliser directement ce ID
    const partNodeId = parentId ? parentId : null;

    if (!partNodeId) {
      return res.status(400).json({ message: 'ID de la pièce parente requis' });
    }

    // Récupérer la pièce et ses spécifications
    const part = await Part.findOne({
      where: { node_id: partNodeId },
      include: [{ model: Node }]
    });

    if (!part) {
      return res.status(404).json({ message: 'Pièce parente non trouvée' });
    }

    // Renvoyer les spécifications de la pièce
    const specifications = part.specifications;
    const response = { specifications };

    // Traiter les spécifications ECD pour le graphique
    if (specifications && specifications.ecd) {
      const ecd = specifications.ecd;
      
      if (ecd.depthMin && ecd.depthMax && ecd.hardness) {
        // S'assurer que les valeurs sont traitées comme des nombres
        const depthMin = parseFloat(ecd.depthMin);
        const depthMax = parseFloat(ecd.depthMax);
        const hardnessValue = parseFloat(ecd.hardness);
        
        // Points pour tracer la droite horizontale dans la plage spécifiée
        response.ecdPoints = [
          { distance: depthMin, value: hardnessValue },
          { distance: depthMax, value: hardnessValue }
        ];
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de la récupération des spécifications:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};