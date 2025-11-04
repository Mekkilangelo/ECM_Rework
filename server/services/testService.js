/**
 * Service de gestion des tests
 * Contient la logique métier liée aux opérations sur les tests
 */

const { node, test, closure, part, client, file, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateTestData } = require('../utils/validators');
const { 
  NotFoundError, 
  ValidationError 
} = require('../utils/errors');
const { deletePhysicalDirectory } = require('../utils/fileUtils');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');
const logger = require('../utils/logger');
const fileService = require('./fileService');
const reportService = require('./reportService');

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
  }  // Recherche textuelle - Simplifiée pour cohérence avec les autres services
  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }
  
  // Mapping des champs de tri pour gérer les colonnes des tables associées
  const getOrderClause = (sortBy, sortOrder) => {
    const sortMapping = {
      'name': ['name', sortOrder],
      'load_number': [{ model: test }, 'load_number', sortOrder],
      'test_date': [{ model: test }, 'test_date', sortOrder],
      'location': [{ model: test }, 'location', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };
    
    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };
    
    // Exécuter la requête
  const tests = await node.findAll({
    where: whereCondition,
    include: [{
      model: test,
      attributes: ['test_code', 'load_number', 'test_date', 'status', 'location']
    }],
    order: [getOrderClause(sortBy, sortOrder)],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // Compter le total pour la pagination
  const total = await node.count({
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
  const testNode = await node.findOne({
    where: { id: testId, type: 'test' },
    include: [{
      model: test,
      attributes: { exclude: ['node_id'] }
    }]
  });
  
  if (!testNode) {
    throw new NotFoundError('Test non trouvé');
  }
  
  // Fusionner les données du nœud et du test pour simplifier le traitement côté client
  const testData = {
    id: testNode.id,
    name: testNode.name,
    path: testNode.path,
    type: testNode.type,
    parent_id: testNode.parent_id,
    created_at: testNode.created_at,
    modified_at: testNode.modified_at,
    data_status: testNode.data_status,
    description: testNode.description
  };
  
  // Ajouter les propriétés du test si elles existent
  if (testNode.test) {
    Object.assign(testData, testNode.test.dataValues);
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
    const testNode = await node.findOne({
      where: whereClause,
      include: [{
        model: test,
        attributes: { exclude: ['node_id'] }
      }]
    });
    
    // Si le test n'existe pas, retourner une erreur
    if (!testNode) {
      logger.warn(`Test non trouvé avec ID ${testId} et parent_id ${parent_id || 'non spécifié'}`);
      throw new NotFoundError('Test non trouvé');
    }
      // Récupérer les spécifications de la pièce parente
    let specifications = null;
    
    if (parent_id && parent_id !== 'undefined' && parent_id !== 'null') {
      // Rechercher le nœud parent et ses spécifications
      const parentNode = await node.findOne({
        where: { 
          id: parent_id,
          type: 'part'  // S'assurer que c'est une pièce
        },
        include: [{
          model: sequelize.models.part,
          attributes: ['specifications']
        }]
      });
      
      if (parentNode && parentNode.part && parentNode.part.specifications) {
        specifications = parentNode.part.specifications;
        
        logger.info(`Spécifications de la pièce parente récupérées pour le test #${testId}`);
      } else {
        logger.warn(`Aucune spécification trouvée pour la pièce parente #${parent_id}`);
        specifications = { hardnessSpecs: [], ecdSpecs: [] };
      }
    } else {
      logger.warn(`Aucun parent_id fourni, initialisation avec spécifications vides`);
      specifications = { hardnessSpecs: [], ecdSpecs: [] };
    }
    
    const result = {
      testId: testNode.id,
      testName: testNode.name,
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
    load_number,
    test_date,
    location,
    status,
    furnace_data,
    load_data,
    recipe_data,
    quench_data,
    results_data,
    mounting_type,
    position_type,
    process_type,
    preox_media
  } = testData;
  
  // Vérifier si le parent existe
  const parentNode = await node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Nœud parent introuvable');
  }
    // Démarrer une transaction
  const transaction = await sequelize.transaction();
  
  try {
    // Créer d'abord le nœud de test pour obtenir l'ID
    const testNode = await node.create({
      name: 'temp', // Nom temporaire, sera mis à jour ci-dessous
      path: 'temp', // Chemin temporaire, sera mis à jour ci-dessous
      type: 'test',
      parent_id,
      description,
      data_status: 'new',
      created_at: new Date(),
      modified_at: new Date()
    }, { transaction });

    // Maintenant qu'on a l'ID, générer le nom et le chemin définitifs
    let finalName;
    if (load_number && load_number.trim()) {
      // Si on a un load_number, l'utiliser comme nom
      finalName = load_number.trim();
    } else {
      // Sinon, utiliser TRIAL_ID comme pour test_code
      finalName = `TRIAL_${testNode.id}`;
    }

    // Mettre à jour le nom et le chemin avec les valeurs définitives
    await testNode.update({
      name: name || finalName,
      path: `${parentNode.path}/${finalName}`
    }, { transaction });

    // Générer la référence basée sur l'ID du nœud si non fournie
    const testCodeToUse = test_code || `TRIAL_${testNode.id}`;
    
    // Créer l'enregistrement de test
    const testRecord = await test.create({
      node_id: testNode.id,
      test_code: testCodeToUse,
      load_number,
      test_date,
      location,
      status: status || 'Pending',
      furnace_data,
      load_data,
      recipe_data,
      quench_data,
      results_data,
      mounting_type,
      position_type,
      process_type,
      preox_media
    }, { transaction });
    
    // Créer les enregistrements de fermeture (closure table)
    await closure.create({
      ancestor_id: testNode.id,
      descendant_id: testNode.id,
      depth: 0
    }, { transaction });
    
    // Récupérer tous les ancêtres du parent
    const parentClosures = await closure.findAll({
      where: { descendant_id: parent_id },
      transaction
    });
    
    // Créer les fermetures pour relier le nœud à tous ses ancêtres
    for (const cp of parentClosures) {
      await closure.create({
        ancestor_id: cp.ancestor_id,
        descendant_id: testNode.id,
        depth: cp.depth + 1
      }, { transaction });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at du test et de ses ancêtres après commit
    await updateAncestorsModifiedAt(testNode.id);
    
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
  const testNode = await node.findOne({
    where: { id: testId, type: 'test' },
    include: [{ model: test }]
  });
  
  if (!testNode) {
    throw new NotFoundError('Test non trouvé');
  }
  
  // Démarrer une transaction
  const transaction = await sequelize.transaction();
  try {
    // Mettre à jour le nœud
    const nodeUpdates = {};
    
    // Gérer la mise à jour du nom basé sur load_number
    // Si le load_number change, mettre à jour automatiquement le nom
    if (testData.load_number !== undefined) {
      const currentName = testNode.name;
      const currentTestCode = testNode.test ? testNode.test.test_code : null;
      const currentLoadNumber = testNode.test ? testNode.test.load_number : null;
      
      // Détecter si le nom actuel est auto-généré (soit test_code, soit ancien load_number, soit TRIAL_X)
      const isAutoGeneratedName = currentName === currentTestCode || 
                                 currentName === currentLoadNumber || 
                                 /^TRIAL_\d+$/.test(currentName);
      
      // Si le nom est auto-généré ou si un nom spécifique n'est pas fourni différent du nom actuel
      if (isAutoGeneratedName || !testData.name || testData.name === currentName) {
        if (testData.load_number && testData.load_number.trim()) {
          // Si on a un load_number, l'utiliser comme nom
          nodeUpdates.name = testData.load_number.trim();
        } else {
          // Si le load_number est vide, revenir au nom basé sur le test_code ou l'ID
          nodeUpdates.name = currentTestCode || `TRIAL_${testNode.id}`;
        }
      }
    }
    
    // Si un nom spécifique est fourni et différent du nom actuel, l'utiliser
    if (testData.name && testData.name !== testNode.name && !nodeUpdates.name) {
      nodeUpdates.name = testData.name;
    }
    
    // Gérer la description
    if (testData.description !== undefined) {
      nodeUpdates.description = testData.description;
    }
    
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
        
        // Debug : tracer les mises à jour de results_data
        if (field === 'results_data' && process.env.NODE_ENV === 'development') {
          logger.debug('Mise à jour results_data', {
            field,
            dataType: typeof testData[field],
            resultsCount: testData[field]?.results?.length || 0
          });
          
          if (testData[field] && testData[field].results) {
            testData[field].results.forEach((result, resultIndex) => {
              if (result.samples) {
                result.samples.forEach((sample, sampleIndex) => {
                  if (sample.curveData) {
                    logger.debug('CurveData trouvée', {
                      resultIndex,
                      sampleIndex,
                      hasPoints: !!sample.curveData.points,
                      pointsCount: sample.curveData.points?.length || 0
                    });
                  }
                });
              }
            });
          }
        }
      }
    }
    
    if (Object.keys(testUpdates).length > 0) {
      await testNode.test.update(testUpdates, { transaction });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // Mettre à jour le modified_at du test et de ses ancêtres après commit
    await updateAncestorsModifiedAt(testId);
    
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
  const testNode = await node.findOne({
    where: { id: testId, type: 'test' }
  });
  
  if (!testNode) {
    throw new NotFoundError('Test non trouvé');
  }

  // Stocker le chemin physique du test pour la suppression
  const testPhysicalPath = testNode.path;
  
  // Récupérer tous les descendants de ce test
  const descendants = await closure.findAll({
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
    await closure.destroy({
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
      const nodeToDelete = await node.findByPk(desc.descendant_id, { transaction });
      if (nodeToDelete && nodeToDelete.type === 'test') {
        await test.destroy({
          where: { node_id: nodeToDelete.id },
          transaction
        });
      }
    }
    
    // 3. Enfin supprimer tous les nœuds descendants
    for (const desc of descendants) {
      await node.destroy({
        where: { id: desc.descendant_id },
        transaction
      });
    }
    
    // Valider la transaction
    await transaction.commit();
    
    // NOUVELLE FONCTIONNALITÉ : Supprimer le dossier physique du test
    // Cette opération se fait après la validation de la transaction pour éviter
    // de supprimer les fichiers si la transaction échoue
    try {
      const deletionResult = await deletePhysicalDirectory(testPhysicalPath);
      if (deletionResult) {
        logger.info('Dossier physique test supprimé', { testId });
      } else {
        logger.warn('Échec suppression dossier physique test', { testId });
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      logger.error('Erreur suppression dossier physique test', { 
        testId, 
        error: physicalDeleteError.message 
      });
    }
    
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
 * @param {Array|Object} sections - Sections du rapport à inclure
 * @returns {Promise<Object>} Données formatées pour le rapport
 */
const getTestReportData = async (testId, sections = []) => {
  return reportService.getTestReportData(testId, sections);
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
