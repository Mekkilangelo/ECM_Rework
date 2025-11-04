/**
 * Service de génération de rapports de tests
 * Responsabilité unique : Agréger les données nécessaires pour générer un rapport de test
 */

const { node, test, closure, part, client, file } = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const fileService = require('./fileService');

/**
 * Récupère la hiérarchie d'un test (part → client)
 * @param {number} testId - ID du test
 * @returns {Promise<Object>} { partNode, clientNode }
 */
const getTestHierarchy = async (testId) => {
  try {
    // Rechercher le nœud parent pièce en utilisant la table Closure
    const partClosures = await closure.findAll({
      where: { 
        descendant_id: testId,
        depth: { [Op.gt]: 0 }
      }
    });

    let partNode = null;
    let clientNode = null;

    // Trouver le parent direct (pièce)
    for (const closureEntry of partClosures) {
      const ancestorNode = await node.findByPk(closureEntry.ancestor_id);
      if (ancestorNode && ancestorNode.type === 'part') {
        partNode = await node.findOne({
          where: { id: ancestorNode.id, type: 'part' },
          include: [{ model: part }]
        });
        break;
      }
    }

    // Rechercher le client parent de la pièce
    if (partNode) {
      const clientClosures = await closure.findAll({
        where: { 
          descendant_id: partNode.id,
          depth: { [Op.gt]: 0 }
        }
      });

      for (const closureEntry of clientClosures) {
        const ancestorNode = await node.findByPk(closureEntry.ancestor_id);
        if (ancestorNode && ancestorNode.type === 'client') {
          clientNode = await node.findOne({
            where: { id: ancestorNode.id, type: 'client' },
            include: [{ model: client }]
          });
          break;
        }
      }
    }

    return { partNode, clientNode };
  } catch (error) {
    logger.warn('Erreur récupération hiérarchie test', { 
      testId, 
      error: error.message 
    });
    return { partNode: null, clientNode: null };
  }
};

/**
 * Parse les données JSON d'un champ
 * @param {string|Object} data - Données à parser
 * @param {string} fieldName - Nom du champ (pour logs)
 * @returns {Object|null}
 */
const parseJsonField = (data, fieldName) => {
  if (!data) return null;
  
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.warn('Erreur parsing champ JSON', { 
        fieldName, 
        error: error.message 
      });
      return null;
    }
  }
  
  return data;
};

/**
 * Récupère les fichiers associés à une section du rapport
 * @param {number} nodeId - ID du nœud (test ou part)
 * @param {string} category - Catégorie de fichiers
 * @param {string} subcategory - Sous-catégorie de fichiers
 * @returns {Promise<Array>}
 */
const getSectionFiles = async (nodeId, category, subcategory = null) => {
  try {
    const options = { 
      nodeId, 
      category 
    };
    
    if (subcategory) {
      options.subcategory = subcategory;
    }
    
    const result = await fileService.getAllFilesByNode(options);
    return result.files || [];
  } catch (error) {
    logger.warn('Erreur récupération fichiers section', { 
      nodeId, 
      category, 
      subcategory,
      error: error.message 
    });
    return [];
  }
};

/**
 * Configuration des sources de fichiers par section
 */
const FILE_SOURCES_CONFIG = {
  micrography: (testId) => [
    { category: 'micrographs-result-0', subcategory: 'x50' },
    { category: 'micrographs-result-0', subcategory: 'x500' },
    { category: 'micrographs-result-0', subcategory: 'x1000' },
    { category: 'micrographs-result-0', subcategory: 'other' },
    { category: 'micrographs-result-1', subcategory: 'x50' },
    { category: 'micrographs-result-1', subcategory: 'x500' },
    { category: 'micrographs-result-1', subcategory: 'x1000' },
    { category: 'micrographs-result-1', subcategory: 'other' }
  ],
  load: (testId) => [
    { category: 'load_design', subcategory: 'load_design' }
  ],
  identification: (partId) => [
    { category: 'photos_identification', subcategory: 'photos_identification' }
  ],
  recipe: (testId) => [
    { category: 'photos_recette', subcategory: 'photos_recette' }
  ],
  hardness: (testId) => [
    { category: 'photos_durete', subcategory: 'photos_durete' }
  ],
  ecd: (testId) => [
    { category: 'photos_dce', subcategory: 'photos_dce' }
  ]
};

/**
 * Récupère tous les fichiers pour les sections sélectionnées
 * @param {number} testId - ID du test
 * @param {number} partId - ID de la pièce
 * @param {Array<string>} selectedSections - Sections sélectionnées
 * @returns {Promise<Object>} Fichiers par section
 */
const getAllSectionFiles = async (testId, partId, selectedSections) => {
  const sectionFiles = {};
  
  for (const sectionName of selectedSections) {
    if (!FILE_SOURCES_CONFIG[sectionName]) continue;
    
    const sources = FILE_SOURCES_CONFIG[sectionName](
      sectionName === 'identification' ? partId : testId
    );
    
    const nodeId = sectionName === 'identification' ? partId : testId;
    const allFiles = [];
    
    for (const source of sources) {
      const files = await getSectionFiles(
        nodeId, 
        source.category, 
        source.subcategory
      );
      allFiles.push(...files);
    }
    
    sectionFiles[sectionName] = allFiles;
  }
  
  return sectionFiles;
};

/**
 * Construit les données de base du test
 * @param {Object} testNode - Nœud du test avec données test
 * @returns {Object}
 */
const buildBaseTestData = (testNode) => {
  const testData = testNode.test;
  
  return {
    testId: testNode.id,
    testName: testNode.name,
    testDate: testData?.test_date || null,
    testCode: testData?.test_code || null,
    loadNumber: testData?.load_number || null,
    status: testData?.status || null,
    location: testData?.location || null
  };
};

/**
 * Construit les données de recette
 * @param {Object} testData - Données du test
 * @returns {Object}
 */
const buildRecipeData = (testData) => {
  const recipeData = parseJsonField(testData?.recipe_data, 'recipe_data');
  
  return {
    recipeData,
    furnaceData: parseJsonField(testData?.furnace_data, 'furnace_data')
  };
};

/**
 * Construit les données de trempe
 * @param {Object} testData - Données du test
 * @returns {Object}
 */
const buildQuenchData = (testData) => {
  return {
    quenchData: parseJsonField(testData?.quench_data, 'quench_data')
  };
};

/**
 * Construit les données de résultats
 * @param {Object} testData - Données du test
 * @returns {Object}
 */
const buildResultsData = (testData) => {
  return {
    resultsData: parseJsonField(testData?.results_data, 'results_data')
  };
};

/**
 * Génère les données complètes d'un rapport de test
 * @param {number} testId - ID du test
 * @param {Array<string>} selectedSections - Sections à inclure dans le rapport
 * @returns {Promise<Object>} Données du rapport
 */
const getTestReportData = async (testId, selectedSections = []) => {
  try {
    // 1. Récupérer le test
    const testNode = await node.findOne({
      where: { id: testId, type: 'test' },
      include: [{ model: test }]
    });
    
    if (!testNode || !testNode.test) {
      throw new NotFoundError('Test non trouvé');
    }

    // 2. Normaliser les sections sélectionnées
    let sections = [];
    if (Array.isArray(selectedSections)) {
      sections = selectedSections;
    } else if (typeof selectedSections === 'object' && selectedSections !== null) {
      // Convertir objet { identification: true, recipe: false } en tableau
      sections = Object.keys(selectedSections).filter(key => selectedSections[key] === true);
    }

    // 3. Récupérer la hiérarchie (part → client)
    const { partNode, clientNode } = await getTestHierarchy(testId);

    // 4. Construire les données de base
    const reportData = buildBaseTestData(testNode);

    // 5. Ajouter les données de hiérarchie
    if (partNode) {
      reportData.partId = partNode.id;
      reportData.partName = partNode.name;
      reportData.partData = partNode.part;
    }

    if (clientNode) {
      reportData.clientId = clientNode.id;
      reportData.clientName = clientNode.name;
      reportData.clientData = clientNode.client;
    }

    // 6. Ajouter les données selon les sections sélectionnées
    if (sections.includes('recipe')) {
      Object.assign(reportData, buildRecipeData(testNode.test));
    }

    if (sections.includes('quench') || sections.includes('recipe')) {
      Object.assign(reportData, buildQuenchData(testNode.test));
    }

    if (sections.includes('results') || sections.includes('hardness') || sections.includes('ecd')) {
      Object.assign(reportData, buildResultsData(testNode.test));
    }

    // 7. Récupérer les fichiers des sections sélectionnées
    if (sections.length > 0 && partNode) {
      reportData.sectionFiles = await getAllSectionFiles(
        testId, 
        partNode.id, 
        sections
      );
    }

    logger.info('Données rapport générées', { 
      testId, 
      sectionsCount: sections.length 
    });

    return reportData;

  } catch (error) {
    logger.error('Erreur génération rapport test', { 
      testId, 
      error: error.message 
    });
    throw error;
  }
};

module.exports = {
  getTestReportData,
  getTestHierarchy,
  getSectionFiles,
  // Export des fonctions utilitaires pour tests unitaires
  parseJsonField,
  buildBaseTestData,
  buildRecipeData,
  buildQuenchData,
  buildResultsData
};
