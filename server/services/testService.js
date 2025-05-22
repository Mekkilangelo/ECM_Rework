/**
 * Service de gestion des tests
 * Contient la logique métier liée aux opérations sur les tests
 */

const { Node, Test, Closure } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateTestData } = require('../utils/validators');
const { 
  NotFoundError, 
  ValidationError 
} = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Récupère tous les tests avec pagination et filtrage
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des tests
 */
const getAllTests = async (options = {}) => {
  const { 
    limit = 10, 
    offset = 0, 
    parent_id = null, 
    sortBy = 'modified_at', 
    sortOrder = 'DESC',
    search = null
  } = options;
  
  const whereCondition = { type: 'test' };
  
  // Filtrage par parent direct
  if (parent_id) {
    whereCondition.parent_id = parent_id;
  }
    // Recherche textuelle
  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      sequelize.literal(`Test.test_code LIKE '%${search.replace(/'/g, "''")}%'`)
    ];
  }
  
  // Exécuter la requête
  const tests = await Node.findAll({
    where: whereCondition,
    include: [{
      model: Test,
      attributes: ['test_code', 'test_date', 'status', 'location']
    }],
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // Compter le total pour la pagination
  const total = await Node.count({
    where: whereCondition
  });
  
  return {
    tests,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Récupère un test par son ID
 * @param {number} testId - ID du test
 * @returns {Promise<Object>} Détails du test
 */
const getTestById = async (testId) => {
  const test = await Node.findOne({
    where: { id: testId, type: 'test' },
    include: [{
      model: Test,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!test) {
    throw new NotFoundError('Test non trouvé');
  }
  
  // Fusionner les données du nœud et du test pour simplifier le traitement côté client
  const testData = {
    id: test.id,
    name: test.name,
    path: test.path,
    type: test.type,
    parent_id: test.parent_id,
    created_at: test.created_at,
    modified_at: test.modified_at,
    data_status: test.data_status,
    description: test.description
  };
  
  // Ajouter les propriétés du test si elles existent
  if (test.Test) {
    Object.assign(testData, test.Test.dataValues);
  }
  
  return testData;
};

/**
 * Récupère les spécifications d'un test
 * @param {number} testId - ID du test
 * @param {number} parent_id - ID du parent (optionnel)
 * @returns {Promise<Object>} Spécifications du test
 */
const getTestSpecs = async (testId, parent_id) => {
  try {
    logger.info(`Récupération des spécifications pour test #${testId}, parent_id=${parent_id || 'non spécifié'}`);
    
    // Construire la clause WHERE
    const whereClause = { 
      id: testId, 
      type: 'test' 
    };
    
    // Ajouter le filtrage par parent_id si fourni et non nul
    if (parent_id && parent_id !== 'undefined' && parent_id !== 'null') {
      whereClause.parent_id = parent_id;
    }
    
    logger.info(`Recherche de test avec les critères:`, whereClause);
    
    // Rechercher le test avec ces critères
    const test = await Node.findOne({
      where: whereClause,
      include: [{
        model: Test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    // Si le test n'existe pas, retourner une erreur
    if (!test) {
      logger.warn(`Test non trouvé avec ID ${testId} et parent_id ${parent_id || 'non spécifié'}`);
      throw new NotFoundError('Test non trouvé');
    }
      // Récupérer les spécifications de la pièce parente
    let specifications = null;
    
    if (parent_id && parent_id !== 'undefined' && parent_id !== 'null') {
      // Rechercher le nœud parent et ses spécifications
      const parentNode = await Node.findOne({
        where: { 
          id: parent_id,
          type: 'part'  // S'assurer que c'est une pièce
        },
        include: [{
          model: sequelize.models.Part,
          attributes: ['specifications']
        }]
      });
      
      if (parentNode && parentNode.Part && parentNode.Part.specifications) {
        specifications = parentNode.Part.specifications;
        logger.info(`Spécifications de la pièce parente récupérées pour le test #${testId}`);
      } else {
        logger.warn(`Aucune spécification trouvée pour la pièce parente #${parent_id}`);
        specifications = {};
      }
    }
    
    const result = {
      testId: test.id,
      testName: test.name,
      specifications: specifications
    };
    
    logger.info(`Spécifications récupérées avec succès pour test #${testId}`);
    return result;
  } catch (error) {
    logger.error(`Erreur dans getTestSpecs pour test #${testId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Crée un nouveau test
 * @param {Object} testData - Données du test
 * @returns {Promise<Object>} Test créé
 */
const createTest = async (testData) => {
  // Validation des données (à implémenter dans les validators)
  // const validationResult = validateTestData(testData);
  // if (!validationResult.isValid) {
  //   throw new ValidationError('Données de test invalides', validationResult.errors);
  // }
  
  const {
    parent_id,
    name,
    description,
    test_code,
    test_date,
    location,
    status,
    additional_info
  } = testData;
  
  // Vérifier si le parent existe
  const parentNode = await Node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Nœud parent introuvable');
  }
    // Démarrer une transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Générer un nom séquentiel basé sur les tests existants avec le même parent
    async function generateSequentialTestName() {
      // Récupérer tous les tests qui ont le même parent
      const testsWithSameParent = await Node.findAll({
        where: {
          parent_id,
          type: 'test'
        },
        transaction
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
    }
    
    // Générer le nom du nœud avec indice séquentiel
    const nodeName = await generateSequentialTestName();
    
    // Créer le nœud de test
    const testNode = await Node.create({
      name: name || nodeName,
      path: `${parentNode.path}/${nodeName}`,
      type: 'test',
      parent_id,
      description,
      data_status: 'new',
      created_at: new Date(),
      modified_at: new Date()
    }, { transaction });    // Générer la référence basée sur l'ID du nœud si non fournie
    const testCodeToUse = test_code || `TRIAL_${testNode.id}`;
    
    // Créer l'enregistrement de test
    const testRecord = await Test.create({
      node_id: testNode.id,
      test_code: testCodeToUse,
      test_date,
      location,
      status: status || 'Pending',
      additional_info
    }, { transaction });
    
    // Créer les enregistrements de fermeture (closure table)
    await Closure.create({
      ancestor_id: testNode.id,
      descendant_id: testNode.id,
      depth: 0
    }, { transaction });
    
    // Récupérer tous les ancêtres du parent
    const parentClosures = await Closure.findAll({
      where: { descendant_id: parent_id },
      transaction
    });
    
    // Créer les fermetures pour relier le nœud à tous ses ancêtres
    for (const closure of parentClosures) {
      await Closure.create({
        ancestor_id: closure.ancestor_id,
        descendant_id: testNode.id,
        depth: closure.depth + 1
      }, { transaction });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Récupérer le test complet
    const createdTest = await getTestById(testNode.id);
    return createdTest;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    logger.error(`Erreur lors de la création du test: ${error.message}`, error);
    throw error;
  }
};

/**
 * Met à jour un test existant
 * @param {number} testId - ID du test
 * @param {Object} testData - Nouvelles données
 * @returns {Promise<Object>} Test mis à jour
 */
const updateTest = async (testId, testData) => {
  // Récupérer le test existant
  const testNode = await Node.findOne({
    where: { id: testId, type: 'test' },
    include: [{ model: Test }]
  });
  
  if (!testNode) {
    throw new NotFoundError('Test non trouvé');
  }
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
  try {
    // Mettre à jour le nœud
    const nodeUpdates = {};
    
    // Ne mettre à jour que les champs spécifiés
    if (testData.name) nodeUpdates.name = testData.name;
    if (testData.description !== undefined) nodeUpdates.description = testData.description;
    
    // Toujours mettre à jour la date de modification
    nodeUpdates.modified_at = new Date();
    
    // S'assurer que la mise à jour est toujours appliquée pour mettre à jour modified_at
    await testNode.update(nodeUpdates, { transaction });
      // Mettre à jour les données de test
    const testUpdates = {};
    const testFields = [
      'test_code', 'load_number', 'test_date', 'location', 'status', 'mounting_type', 
      'position_type', 'process_type', 'furnace_data', 'load_data', 'recipe_data', 
      'quench_data', 'results_data'
    ];
    
    for (const field of testFields) {
      if (testData[field] !== undefined) {
        testUpdates[field] = testData[field];
      }
    }
    
    if (Object.keys(testUpdates).length > 0) {
      await testNode.Test.update(testUpdates, { transaction });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Récupérer le test mis à jour
    const updatedTest = await getTestById(testId);
    return updatedTest;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    logger.error(`Erreur lors de la mise à jour du test #${testId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Supprime un test
 * @param {number} testId - ID du test à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteTest = async (testId) => {
  // Récupérer le test
  const testNode = await Node.findOne({
    where: { id: testId, type: 'test' }
  });
  
  if (!testNode) {
    throw new NotFoundError('Test non trouvé');
  }
  
  // Récupérer tous les descendants de ce test
  const descendants = await Closure.findAll({
    where: { ancestor_id: testId },
    order: [['depth', 'DESC']] // Important: supprimer les plus profonds d'abord
  });
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
  
  try {
    // 1. D'abord supprimer toutes les relations de fermeture liées à ce test et ses descendants
    // Récupérer tous les IDs des descendants
    const descendantIds = descendants.map(desc => desc.descendant_id);
    
    // Supprimer toutes les relations de fermeture où un descendant est impliqué
    await Closure.destroy({
      where: {
        [Op.or]: [
          { ancestor_id: { [Op.in]: descendantIds } },
          { descendant_id: { [Op.in]: descendantIds } }
        ]
      },
      transaction
    });
    
    // 2. Ensuite supprimer les données spécifiques aux tests pour tous les descendants
    for (const desc of descendants) {
      const nodeToDelete = await Node.findByPk(desc.descendant_id, { transaction });
      if (nodeToDelete && nodeToDelete.type === 'test') {
        await Test.destroy({
          where: { node_id: nodeToDelete.id },
          transaction
        });
      }
    }
    
    // 3. Enfin supprimer tous les nœuds descendants
    for (const desc of descendants) {
      await Node.destroy({
        where: { id: desc.descendant_id },
        transaction
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    return true;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    logger.error(`Erreur lors de la suppression du test #${testId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Récupère les données pour le rapport de test
 * @param {number} testId - ID du test
 * @param {Array} sections - Sections du rapport à inclure
 * @returns {Promise<Object>} Données formatées pour le rapport
 */
const getTestReportData = async (testId, sections = []) => {
  try {
    // Rechercher le test sans les associations problématiques
    const test = await Node.findOne({
      where: { id: testId, type: 'test' },
      include: [{
        model: Test
      }]
    });
    
    if (!test) {
      throw new NotFoundError('Test non trouvé');
    }
    
    // Préparer les données selon les sections demandées
    const reportData = {
      testId: test.id,
      testName: test.name,
      testDate: test.Test ? test.Test.test_date : null,
      testCode: test.Test ? test.Test.test_code : null,
      data: {}
    };
    
    // Pour l'instant, retourner des données vides pour les sections demandées
    // jusqu'à ce que les associations soient correctement définies
    if (!sections || sections.length === 0 || sections.includes('all') || sections.includes('specs')) {
      reportData.data.specifications = [];
    }
    
    if (!sections || sections.length === 0 || sections.includes('all') || sections.includes('results')) {
      reportData.data.results = [];
    }
    
    logger.info(`Données de rapport récupérées avec succès pour test #${testId}`);
    return reportData;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des données de rapport pour le test #${testId}: ${error.message}`, error);
    throw error;
  }
};

module.exports = {
  getAllTests,
  getTestById,
  getTestSpecs,
  createTest,
  updateTest,
  deleteTest,
  getTestReportData
};