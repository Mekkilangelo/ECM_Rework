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
    additional_info
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
      additional_info
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
          console.log('=== DEBUG SERVICE - RESULTS DATA UPDATE ===');
          console.log('Field:', field);
          console.log('Type of data:', typeof testData[field]);
          
          if (testData[field] && testData[field].results) {
            console.log('Number of results:', testData[field].results.length);
            
            testData[field].results.forEach((result, resultIndex) => {
              if (result.samples) {
                result.samples.forEach((sample, sampleIndex) => {
                  if (sample.curveData) {
                    console.log(`Result ${resultIndex}, Sample ${sampleIndex} - CurveData found:`, {
                      hasPoints: !!sample.curveData.points,
                      pointsCount: sample.curveData.points ? sample.curveData.points.length : 0,
                      pointsStructure: sample.curveData.points ? sample.curveData.points[0] : 'No points'
                    });
                  } else {
                    console.log(`Result ${resultIndex}, Sample ${sampleIndex} - No curveData found`);
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
        console.log(`Dossier physique du test ${testId} supprimé avec succès`);
      } else {
        console.warn(`Échec de la suppression du dossier physique du test ${testId}`);
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      console.error(`Erreur lors de la suppression du dossier physique du test ${testId}:`, physicalDeleteError);
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
 * @param {Array} sections - Sections du rapport à inclure
 * @returns {Promise<Object>} Données formatées pour le rapport
 */
const getTestReportData = async (testId, sections = []) => {
  try {
    // Rechercher le test avec toutes les données nécessaires
    const testNode = await node.findOne({
      where: { id: testId, type: 'test' },
      include: [{
        model: test
      }]
    });
    
    if (!testNode) {
      throw new NotFoundError('Test non trouvé');
    }

    // Normaliser les sections: convertir objet en tableau si nécessaire
    let selectedSections = [];
    if (Array.isArray(sections)) {
      selectedSections = sections;
    } else if (typeof sections === 'object' && sections !== null) {
      // Convertir l'objet { identification: true, recipe: false, ... } en tableau
      selectedSections = Object.keys(sections).filter(key => sections[key] === true);
    }    // Trouver le nœud parent (pièce) pour récupérer les données client et de pièce
    let partNode = null;
    let clientNode = null;
    
    try {
      // Rechercher le nœud parent pièce en utilisant la table Closure
      const partClosures = await closure.findAll({
        where: { 
          descendant_id: testId,
          depth: { [Op.gt]: 0 } // Exclure la relation avec soi-même
        }
      });

      // Trouver le parent direct (pièce)
      let partId = null;
      for (const closure of partClosures) {
        const ancestorNode = await node.findByPk(closure.ancestor_id);
        if (ancestorNode && ancestorNode.type === 'part') {
          partId = ancestorNode.id;
          break;
        }
      }

      if (partId) {
        partNode = await node.findOne({
          where: { id: partId, type: 'part' },
          include: [{
            model: part
          }]
        });

        // Rechercher le client parent de la pièce
        const clientClosures = await closure.findAll({
          where: { 
            descendant_id: partId,
            depth: { [Op.gt]: 0 }
          }
        });

        for (const closure of clientClosures) {
          const ancestorNode = await node.findByPk(closure.ancestor_id);
          if (ancestorNode && ancestorNode.type === 'client') {
            clientNode = await node.findOne({
              where: { id: ancestorNode.id, type: 'client' },
              include: [{
                model: client
              }]
            });
            break;
          }
        }
      }
    } catch (hierarchyError) {
      logger.warn(`Impossible de récupérer la hiérarchie pour le test #${testId}: ${hierarchyError.message}`);
    }    // Préparer les données selon les sections demandées
    const reportData = {
      testId: testNode.id,
      testName: testNode.name,
      testDate: testNode.test ? testNode.test.test_date : null,
      testCode: testNode.test ? testNode.test.test_code : null,
      // Ajouter toutes les données du test
      loadNumber: testNode.test ? testNode.test.load_number : null,
      status: testNode.test ? testNode.test.status : null,      location: testNode.test ? testNode.test.location : null,
      furnaceData: testNode.test ? (() => {
        try {
          let furnaceData = testNode.test.furnace_data;
          logger.info(`Raw furnace_data pour test #${testId}:`, furnaceData);
          logger.info(`Type de furnace_data:`, typeof furnaceData);
          
          if (typeof furnaceData === 'string') {
            const parsed = JSON.parse(furnaceData);
            logger.info(`Furnace_data parsé:`, parsed);
            return parsed;
          }
          
          logger.info(`Furnace_data retourné tel quel:`, furnaceData);
          return furnaceData;
        } catch (parseError) {
          logger.warn(`Erreur lors du parsing des données de four pour le test #${testId}: ${parseError.message}`);
          logger.warn(`Données brutes:`, test.test.furnace_data);
          return test.test.furnace_data;
        }
      })() : null,      loadData: test.test ? (() => {
        try {
          let loadData = test.test.load_data;
          logger.info(`Raw load_data pour test #${testId}:`, loadData);
          logger.info(`Type de load_data:`, typeof loadData);
          
          if (typeof loadData === 'string') {
            const parsed = JSON.parse(loadData);
            logger.info(`Load_data parsé:`, parsed);
            return parsed;
          }
          
          logger.info(`Load_data retourné tel quel:`, loadData);
          return loadData;
        } catch (parseError) {
          logger.warn(`Erreur lors du parsing des données de charge pour le test #${testId}: ${parseError.message}`);
          logger.warn(`Données brutes:`, test.test.load_data);
          return test.test.load_data;
        }
      })() : null,      recipeData: test.test ? (() => {
        try {
          let recipeData = test.test.recipe_data;
          logger.info(`Raw recipe_data pour test #${testId}:`, recipeData);
          logger.info(`Type de recipe_data:`, typeof recipeData);
          
          if (typeof recipeData === 'string') {
            const parsed = JSON.parse(recipeData);
            logger.info(`Recipe_data parsé:`, parsed);
            return parsed;
          }
          
          logger.info(`Recipe_data retourné tel quel:`, recipeData);
          return recipeData;
        } catch (parseError) {
          logger.warn(`Erreur lors du parsing des données de recette pour le test #${testId}: ${parseError.message}`);
          logger.warn(`Données brutes:`, test.test.recipe_data);
          return test.test.recipe_data;
        }
      })() : null,
      quenchData: test.test ? (() => {
        try {
          let quenchData = test.test.quench_data;
          logger.info(`Raw quench_data pour test #${testId}:`, quenchData);
          logger.info(`Type de quench_data:`, typeof quenchData);
          
          if (typeof quenchData === 'string') {
            const parsed = JSON.parse(quenchData);
            logger.info(`Quench_data parsé:`, parsed);
            return parsed;
          }
          
          logger.info(`Quench_data retourné tel quel:`, quenchData);
          return quenchData;
        } catch (parseError) {
          logger.warn(`Erreur lors du parsing des données de trempe pour le test #${testId}: ${parseError.message}`);
          logger.warn(`Données brutes:`, test.test.quench_data);
          return test.test.quench_data;
        }
      })() : null,
      resultsData: test.test ? (() => {
        try {
          let resultsData = test.test.results_data;
          logger.info(`Raw results_data pour test #${testId}:`, resultsData);
          logger.info(`Type de results_data:`, typeof resultsData);
          
          if (typeof resultsData === 'string') {
            const parsed = JSON.parse(resultsData);
            logger.info(`Results_data parsé:`, parsed);
            return parsed;
          }
          
          logger.info(`Results_data retourné tel quel:`, resultsData);
          return resultsData;
        } catch (parseError) {
          logger.warn(`Erreur lors du parsing des données de résultats pour le test #${testId}: ${parseError.message}`);
          logger.warn(`Données brutes:`, test.test.results_data);
          return test.test.results_data;
        }
      })() : null,
      mountingType: test.test ? test.test.mounting_type : null,
      positionType: test.test ? test.test.position_type : null,
      processType: test.test ? test.test.process_type : null,
      preoxMedia: test.test ? test.test.preox_media : null,// Ajouter les données de la pièce
      part: partNode ? {
        id: partNode.id,
        name: partNode.name,
        designation: partNode.part ? partNode.part.designation : null,
        client_designation: partNode.part ? partNode.part.client_designation : null,
        reference: partNode.part ? partNode.part.reference : null,
        quantity: partNode.part ? partNode.part.quantity : null,
        steel: partNode.part ? partNode.part.steel : null,
        material: partNode.part ? partNode.part.material : null,
        specifications: partNode.part && partNode.part.specifications ? 
          (() => {
            try {
              let specs = null;
              if (typeof partNode.part.specifications === 'string') {
                specs = JSON.parse(partNode.part.specifications);
                logger.info(`Spécifications parsées avec succès pour la pièce #${partNode.id}`);
              } else if (typeof partNode.part.specifications === 'object') {
                specs = partNode.part.specifications;
                logger.info(`Spécifications déjà sous forme d'objet pour la pièce #${partNode.id}`);
              }
              
              // Restructurer les spécifications selon le format attendu par usepartSubmission
              // Format: { hardnessSpecs: [], ecdSpecs: [] }
              if (specs) {
                // Si c'est déjà dans le bon format
                if (specs.hardnessSpecs !== undefined || specs.ecdSpecs !== undefined) {
                  return specs;
                }
                // Si c'est l'ancien format, le convertir
                const convertedSpecs = {
                  hardnessSpecs: [],
                  ecdSpecs: []
                };                // Convertir chaque spécification
                Object.entries(specs).forEach(([key, value]) => {
                  logger.info(`Traitement de la spécification: ${key}`, value);
                  
                  const spec = {
                    parameter: key,
                    target_value: value.target || value.value || '',
                    min_value: value.min !== undefined ? value.min : '',
                    max_value: value.max !== undefined ? value.max : '',
                    unit: value.unit || ''
                  };
                  
                  // Classer les spécifications par type
                  // Les spécifications ECD ont une structure différente avec depth/hardness
                  if (key.toLowerCase().includes('ecd') || 
                      key.toLowerCase().includes('pdd') ||
                      key.toLowerCase().includes('case') ||
                      key.toLowerCase().includes('depth') ||
                      (typeof value === 'object' && (value.depthMin !== undefined || value.depthMax !== undefined || value.hardness !== undefined))) {
                    
                    // Pour les spécifications ECD, restructurer les données
                    const ecdSpec = {
                      parameter: key,
                      hardness: value.hardness || value.target || value.value || '',
                      depthMin: value.depthMin || value.min || '',
                      depthMax: value.depthMax || value.max || '',
                      hardnessUnit: value.hardnessUnit || value.unit || 'HV',
                      depthUnit: 'mm'
                    };
                    convertedSpecs.ecdSpecs.push(ecdSpec);
                    logger.info(`Spécification ECD ajoutée:`, ecdSpec);
                  } else {
                    // Spécifications de dureté standard
                    convertedSpecs.hardnessSpecs.push(spec);
                    logger.info(`Spécification de dureté ajoutée:`, spec);
                  }
                });
                
                logger.info(`Conversion terminée - Dureté: ${convertedSpecs.hardnessSpecs.length}, ECD: ${convertedSpecs.ecdSpecs.length}`);
                
                return convertedSpecs;
              }
              
              return null;
            } catch (parseError) {
              logger.warn(`Erreur lors du parsing des spécifications de la pièce #${partNode.id}: ${parseError.message}`);
              return partNode.part.specifications;
            }
          })() : null,
        dimensions: partNode.part && partNode.part.dimensions ? 
          (() => {
            try {
              if (typeof partNode.part.dimensions === 'string') {
                const parsed = JSON.parse(partNode.part.dimensions);
                logger.info(`Dimensions parsées avec succès pour la pièce #${partNode.id}`);
                return parsed;
              } else if (typeof partNode.part.dimensions === 'object') {
                logger.info(`Dimensions déjà sous forme d'objet pour la pièce #${partNode.id}`);
                return partNode.part.dimensions;
              } else {
                logger.warn(`Type de dimensions inattendu pour la pièce #${partNode.id}: ${typeof partNode.part.dimensions}`);
                return partNode.part.dimensions;
              }
            } catch (parseError) {
              logger.warn(`Erreur lors du parsing des dimensions de la pièce #${partNode.id}: ${parseError.message}`);
              return partNode.part.dimensions;
            }
          })() : null,
        description: partNode.part ? partNode.part.description : null,
        drawing_number: partNode.part ? partNode.part.drawing_number : null,
        revision: partNode.part ? partNode.part.revision : null,
        weight: partNode.part ? partNode.part.weight : null
      } : null,
      
      // Ajouter les données du client
      client: clientNode ? {
        id: clientNode.id,
        name: clientNode.name,
        address: clientNode.Client ? clientNode.Client.address : null,
        city: clientNode.Client ? clientNode.Client.city : null,
        country: clientNode.Client ? clientNode.Client.country : null,
        phone: clientNode.Client ? clientNode.Client.phone : null,
        email: clientNode.Client ? clientNode.Client.email : null
      } : null,
      
      data: {}
    };

    // Ajouter les données structurées selon les sections demandées
    if (selectedSections.includes('identification') || selectedSections.length === 0) {
      reportData.data.identification = {
        testId: test.id,
        testName: test.name,
        testCode: test.test ? test.test.test_code : null,
        testDate: test.test ? test.test.test_date : null,
        status: test.test ? test.test.status : null,
        location: test.test ? test.test.location : null
      };
    }

    if (selectedSections.includes('recipe') || selectedSections.length === 0) {
      reportData.data.recipe = test.test ? test.test.recipe_data : null;
    }    if (selectedSections.includes('load') || selectedSections.length === 0) {
      // Parser aussi les données de charge dans data.load pour cohérence
      reportData.data.load = test.test ? (() => {
        try {
          let loadData = test.test.load_data;
          if (typeof loadData === 'string') {
            return JSON.parse(loadData);
          }
          return loadData;
        } catch (parseError) {
          logger.warn(`Erreur lors du parsing des données de charge (data.load) pour le test #${testId}: ${parseError.message}`);
          return test.test.load_data;
        }
      })() : null;
    }

    if (selectedSections.includes('curves') || selectedSections.length === 0) {
      reportData.data.curves = {
        furnaceData: test.test ? test.test.furnace_data : null,
        processType: test.test ? test.test.process_type : null
      };
    }    if (selectedSections.includes('control') || selectedSections.length === 0) {
      reportData.data.results = test.test ? test.test.results_data : [];
    }    // Récupérer les fichiers associés organisés par sections comme dans SectionPhotoManager
    try {
      logger.info(`Tentative de récupération des fichiers pour le test #${testId}`);
      
      // Configuration des sources de fichiers par section (identique à SectionPhotoManager)
      const sectionFileConfig = {
        micrography: {
          nodeId: testId,
          sources: [
            { category: 'micrographs-result-0', subcategory: 'x50' },
            { category: 'micrographs-result-0', subcategory: 'x500' },
            { category: 'micrographs-result-0', subcategory: 'x1000' },
            { category: 'micrographs-result-0', subcategory: 'other' },
            { category: 'micrographs-result-1', subcategory: 'x50' },
            { category: 'micrographs-result-1', subcategory: 'x500' },
            { category: 'micrographs-result-1', subcategory: 'x1000' },
            { category: 'micrographs-result-1', subcategory: 'other' }
          ]
        },
        load: {
          nodeId: testId,
          sources: [
            { category: 'load_design', subcategory: 'load_design' }
          ]
        },
        curves: {
          nodeId: testId,
          sources: [
            { category: 'furnace_report', subcategory: 'heating' },
            { category: 'furnace_report', subcategory: 'cooling' },
            { category: 'furnace_report', subcategory: 'datapaq' },
            { category: 'furnace_report', subcategory: 'alarms' }
          ]
        }
      };

      // Si partNode existe, ajouter la configuration pour identification
      if (partNode) {
        sectionFileConfig.identification = {
          nodeId: partNode.id,
          sources: [
            { category: 'photos', subcategory: 'front' },
            { category: 'photos', subcategory: 'profile' },
            { category: 'photos', subcategory: 'quarter' },
            { category: 'photos', subcategory: 'other' }
          ]
        };
      }
        logger.info(`=== CONFIGURATION DES SECTIONS ===`);
      logger.info('Sections configurées:', Object.keys(sectionFileConfig));
      if (partNode) {
        logger.info(`partNode trouvé: ID=${partNode.id}, nom="${partNode.name}"`);
      } else {
        logger.warn('Aucun partNode trouvé - la section identification ne sera pas configurée');
      }
      
      // Organiser les fichiers par catégorie et sous-catégorie pour chaque section
      const filesByCategory = {};
        for (const [sectionType, config] of Object.entries(sectionFileConfig)) {
        logger.info(`=== SECTION ${sectionType.toUpperCase()} ===`);
        logger.info(`Configuration pour ${sectionType}:`, { nodeId: config.nodeId, sourcesCount: config.sources.length });
        
        for (const source of config.sources) {
          try {            logger.info(`Récupération des fichiers pour ${source.category}/${source.subcategory} avec nodeId: ${config.nodeId}`);
            
            const sectionFiles = await fileService.getAllFilesByNode({
              nodeId: config.nodeId,
              category: source.category,
              subcategory: source.subcategory
            });
            
            logger.info(`Résultat getAllFilesByNode: ${sectionFiles && sectionFiles.files ? sectionFiles.files.length : 0} fichiers trouvés`);
            
            if (sectionFiles && sectionFiles.files && sectionFiles.files.length > 0) {
              const category = source.category;
              const subcategory = source.subcategory;
              
              if (!filesByCategory[category]) {
                filesByCategory[category] = {};
              }
              
              if (!filesByCategory[category][subcategory]) {
                filesByCategory[category][subcategory] = [];
              }
              
              const processedFiles = sectionFiles.files.map(file => ({
                id: file.id,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType || file.mime_type,
                path: file.path || file.file_path,
                viewPath: `/api/files/${file.id}`,
                downloadPath: `/api/files/download/${file.id}`,
                category: file.category,
                subcategory: file.subcategory,
                originalName: file.original_name || file.name,
                sectionSource: sectionType,
                sourceCategory: source.category,
                sourceSubcategory: source.subcategory
              }));
              
              filesByCategory[category][subcategory].push(...processedFiles);
              
              logger.info(`Ajouté ${processedFiles.length} fichiers pour ${category}/${subcategory}`);            } else {
              logger.warn(`Aucun fichier trouvé pour ${source.category}/${source.subcategory} avec nodeId: ${config.nodeId}`);
            }
          } catch (err) {
            logger.error(`Erreur lors de la récupération des fichiers pour ${source.category}/${source.subcategory}: ${err.message}`);
          }
        }
      }
        reportData.files = filesByCategory;
      
      logger.info(`=== RÉSUMÉ FINAL ===`);
      const totalFiles = Object.values(filesByCategory).reduce((total, categoryFiles) => {
        return total + Object.values(categoryFiles).reduce((catTotal, subFiles) => catTotal + subFiles.length, 0);
      }, 0);
      logger.info(`Total des fichiers récupérés pour le test #${testId}: ${totalFiles}`);
      logger.info('Structure finale des fichiers:', {
        categories: Object.keys(filesByCategory),
        details: Object.entries(filesByCategory).map(([cat, subs]) => ({
          category: cat,
          subcategories: Object.keys(subs),
          totalFilesInCategory: Object.values(subs).reduce((sum, files) => sum + files.length, 0)
        }))
      });
      
      // Les fichiers de la pièce parente sont déjà inclus dans la configuration sectionFileConfig.identification ci-dessus
    } catch (fileError) {
      logger.warn(`Impossible de récupérer les fichiers pour le test #${testId}: ${fileError.message}`);
      logger.error('Stack trace:', fileError.stack);
      reportData.files = {};
    }    logger.info(`Données de rapport récupérées avec succès pour test #${testId}`);
    logger.info('Structure des données retournées:', {
      testId: reportData.testId,
      testCode: reportData.testCode,
      sectionsIncluded: selectedSections,
      dataKeys: Object.keys(reportData.data),
      haspartData: !!reportData.part,
      hasClientData: !!reportData.client,
      loadDataKeys: reportData.loadData ? Object.keys(reportData.loadData) : 'null',
      rawTestDataKeys: test.test ? Object.keys(test.test.dataValues) : 'null'
    });
    
    // Log spécifique pour les données de charge
    if (test.test && test.test.load_data) {
      logger.info('Données de charge brutes dans test.load_data:', test.test.load_data);
    }
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