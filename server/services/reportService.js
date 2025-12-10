/**
 * Service de génération de rapports de trials
 * Responsabilité unique : Agréger les données nécessaires pour générer un rapport de trial
 */

const { node, trial, closure, part, client, file } = require('../models');
const db = require('../models');
const { Op } = require('sequelize');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');
const fileService = require('./fileService');

/**
 * Récupère la hiérarchie d'un trial (part → client)
 * @param {number} trialId - ID du trial
 * @returns {Promise<Object>} { partNode, clientNode }
 */
const getTestHierarchy = async (trialId) => {
  try {
    // Récupérer tous les ancêtres avec leurs données en une seule requête
    const ancestors = await closure.findAll({
      where: { 
        descendant_id: trialId,
        depth: { [Op.gt]: 0 }
      },
      include: [{
        model: node,
        as: 'ancestor',
        include: [
          { 
            model: part, 
            as: 'part', 
            required: false,
            include: [
              {
                model: db.specs_hardness,
                as: 'hardnessSpecs',
                required: false
              },
              {
                model: db.specs_ecd,
                as: 'ecdSpecs',
                required: false
              },
              {
                model: db.steel,
                as: 'steel',
                required: false
              }
            ]
          },
          { model: client, as: 'client', required: false }
        ]
      }],
      order: [['depth', 'ASC']] // Du plus proche au plus lointain
    });

    let partNode = null;
    let clientNode = null;

    // Parcourir les ancêtres pour trouver la pièce et le client
    for (const ancestorRelation of ancestors) {
      const ancestorNode = ancestorRelation.ancestor;
      
      if (!ancestorNode) continue;

      // Trouver la pièce (parent direct normalement)
      if (!partNode && ancestorNode.type === 'part') {
        partNode = ancestorNode;
        logger.debug('Pièce trouvée', {
          partId: partNode.id,
          partName: partNode.name,
          hasPartData: !!partNode.part
        });
      }

      // Trouver le client
      if (!clientNode && ancestorNode.type === 'client') {
        clientNode = ancestorNode;
        logger.debug('Client trouvé', {
          clientId: clientNode.id,
          clientName: clientNode.name,
          hasClientData: !!clientNode.client
        });
      }

      // Arrêter si on a trouvé les deux
      if (partNode && clientNode) break;
    }

    logger.info('Hiérarchie récupérée', { 
      trialId,
      partFound: !!partNode,
      clientFound: !!clientNode,
      partId: partNode?.id,
      clientId: clientNode?.id,
      totalAncestors: ancestors.length
    });

    return { partNode, clientNode };
  } catch (error) {
    logger.warn('Erreur récupération hiérarchie trial', { 
      trialId, 
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
    // Récupérer TOUS les fichiers de la pièce, on filtrera pour ne garder que les images
    { category: null, subcategory: null }
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
      
      // Pour l'identification, on ne veut que les images
      if (sectionName === 'identification') {
        const images = files.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
        allFiles.push(...images);
      } else {
        allFiles.push(...files);
      }
    }
    
    // Déduplication par ID (au cas où plusieurs sources se chevauchent)
    const uniqueFiles = Array.from(new Map(allFiles.map(item => [item.id, item])).values());
    
    logger.info(`📁 Section ${sectionName}: ${uniqueFiles.length} fichiers trouvés`, {
      section: sectionName,
      nodeId,
      fileIds: uniqueFiles.map(f => f.id),
      samplePaths: uniqueFiles.slice(0, 3).map(f => f.viewPath)
    });
    
    sectionFiles[sectionName] = uniqueFiles;
  }
  
  return sectionFiles;
};

/**
 * Construit les données de base du test
 * @param {Object} trialNode - Nœud du trial avec données trial
 * @returns {Object}
 */
const buildBaseTestData = (trialNode) => {
  const trialData = trialNode.trial;
  
  // Log pour déboguer
  logger.info('🔍 buildBaseTestData - trialData:', {
    process_type: trialData?.process_type,
    processTypeRef: trialData?.processTypeRef,
    hasProcessTypeRef: !!trialData?.processTypeRef
  });
  
  return {
    testId: trialNode.id,
    testName: trialNode.name,
    testDate: trialData?.trial_date || null,
    testCode: trialData?.trial_code || null,
    loadNumber: trialData?.load_number || null,
    status: trialData?.status || null,
    location: trialData?.location || null,
    trialData: trialData // Ajouter les données complètes du trial
  };
};

/**
 * Construit les données de recette depuis les tables normalisées
 * @param {Object} trialData - Données du trial avec relations
 * @returns {Object} Données de recette formatées pour le rapport
 */
const buildRecipeData = (trialData) => {
  if (!trialData?.recipe) {
    logger.debug('Aucune recette associée au trial');
    return { recipeData: null, furnaceData: null };
  }

  const recipe = trialData.recipe;
  
  // Construire l'objet recipeData au format attendu par le PDF
  const recipeData = {
    number: recipe.recipe_number,
    
    // Préoxydation
    preox: recipe.preoxCycle ? {
      temperature: {
        value: recipe.preoxCycle.temperature,
        unit: recipe.preoxCycle.temp_unit
      },
      duration: {
        value: recipe.preoxCycle.duration,
        unit: recipe.preoxCycle.duration_unit
      },
      media: recipe.preoxCycle.media
    } : null,
    
    // Cycle thermique
    thermal_cycle: recipe.thermalCycle?.map(step => ({
      step: step.step,
      ramp: step.ramp,
      setpoint: step.setpoint,
      duration: step.duration
    })) || [],
    
    // Cycle chimique
    chemical_cycle: recipe.chemicalCycle?.steps?.map(step => ({
      step: step.step_number,
      time: step.time,
      gases: step.gases?.map(gas => ({
        gas: gas.gas_name,
        debit: gas.debit
      })) || [],
      pressure: step.pressure,
      turbine: step.turbine
    })) || [],
    
    // Gaz sélectionnés
    selected_gas1: recipe.chemicalCycle?.selected_gas1,
    selected_gas2: recipe.chemicalCycle?.selected_gas2,
    selected_gas3: recipe.chemicalCycle?.selected_gas3,
    
    // Paramètres d'attente (seulement ceux qui existent dans la DB)
    wait_time: recipe.chemicalCycle?.wait_time_value ? {
      value: recipe.chemicalCycle.wait_time_value,
      unit: recipe.chemicalCycle.wait_time_unit
    } : null,
    
    wait_pressure: recipe.chemicalCycle?.wait_pressure_value ? {
      value: recipe.chemicalCycle.wait_pressure_value,
      unit: recipe.chemicalCycle.wait_pressure_unit
    } : null,
    
    // cell_temp n'existe pas dans la table recipe_chemical_cycle
    cell_temp: null
  };
  
  // Construire les données de trempe
  const quenchData = {};
  
  // Trempe gaz
  if (recipe.gasQuench) {
    quenchData.gas_quench = {
      inerting_delay: {
        value: recipe.gasQuench.inerting_delay,
        unit: recipe.gasQuench.inerting_delay_unit
      },
      inerting_pressure: {
        value: recipe.gasQuench.inerting_pressure,
        unit: recipe.gasQuench.inerting_pressure_unit
      },
      speed_parameters: recipe.gasQuench.speedSteps?.map(param => ({
        step: param.step,
        duration: param.duration,
        speed: param.speed
      })) || [],
      pressure_parameters: recipe.gasQuench.pressureSteps?.map(param => ({
        step: param.step,
        duration: param.duration,
        pressure: param.pressure
      })) || []
    };
  }
  
  // Trempe huile
  if (recipe.oilQuench) {
    quenchData.oil_quench = {
      temperature: {
        value: recipe.oilQuench.temperature_value,
        unit: recipe.oilQuench.temperature_unit
      },
      inerting_delay: {
        value: recipe.oilQuench.inerting_delay_value,
        unit: recipe.oilQuench.inerting_delay_unit
      },
      dripping_time: {
        value: recipe.oilQuench.dripping_time_value,
        unit: recipe.oilQuench.dripping_time_unit
      },
      speed_parameters: recipe.oilQuench.speedSteps?.map(param => ({
        step: param.step,
        duration: param.duration,
        speed: param.speed
      })) || []
    };
  }
  
  // Données du four
  const furnaceData = trialData.furnace ? {
    name: trialData.furnace.name,
    type: trialData.furnace.type,
    manufacturer: trialData.furnace.manufacturer,
    model: trialData.furnace.model
  } : null;
  
  logger.debug('Données recette construites', {
    hasRecipe: !!recipe,
    hasThermalCycle: recipeData.thermal_cycle?.length > 0,
    hasChemicalCycle: recipeData.chemical_cycle?.length > 0,
    hasGasQuench: !!quenchData.gas_quench,
    hasOilQuench: !!quenchData.oil_quench,
    hasFurnace: !!furnaceData
  });
  
  return {
    recipeData,
    quenchData,
    furnaceData
  };
};

/**
 * Construit les données de trempe (maintenant intégré dans buildRecipeData)
 * @param {Object} trialData - Données du trial
 * @returns {Object}
 * @deprecated - Les données de trempe sont maintenant dans recipe.gasQuench/oilQuench
 */
const buildQuenchData = (testData) => {
  // Cette fonction n'est plus utilisée car les données de trempe
  // sont maintenant chargées via buildRecipeData depuis recipe.gasQuench/oilQuench
  return { quenchData: null };
};

/**
 * Construit les données de résultats depuis les tables normalisées
 * @param {Object} testData - Données du test avec includes
 * @returns {Object}
 */
const buildResultsData = (testData) => {
  console.log('🔍 buildResultsData - testData.resultSteps:', testData?.resultSteps?.length || 0);
  
  if (!testData?.resultSteps || !Array.isArray(testData.resultSteps)) {
    console.log('⚠️ buildResultsData - Pas de resultSteps trouvés');
    return { resultsData: { results: [] } };
  }

  const results = testData.resultSteps.map(step => ({
    stepNumber: step.step_number,
    description: step.description,
    samples: (step.samples || []).map(sample => {
      // Transformer curveSeries en curveData (format attendu par le frontend)
      let curveData = null;
      if (sample.curveSeries && Array.isArray(sample.curveSeries) && sample.curveSeries.length > 0) {
        // Extraire toutes les distances uniques
        const distancesSet = new Set();
        sample.curveSeries.forEach(series => {
          (series.points || []).forEach(point => {
            if (point.distance != null) {
              distancesSet.add(Number(point.distance));
            }
          });
        });
        
        const distances = Array.from(distancesSet).sort((a, b) => a - b);
        
        // Construire les séries au format curveData
        const series = sample.curveSeries.map(curveSeries => {
          const values = distances.map(distance => {
            const point = (curveSeries.points || []).find(p => Number(p.distance) === distance);
            return point ? point.value : '';
          });
          
          return {
            name: curveSeries.name,
            values: values
          };
        });
        
        curveData = {
          distances: distances,
          series: series
        };
      }
      
      return {
        sampleNumber: sample.sample_number,
        description: sample.description,
        ecdHardnessUnit: sample.ecd_hardness_unit,
        ecdHardnessValue: sample.ecd_hardness_value,
        
        hardnessPoints: (sample.hardnessPoints || []).map(point => ({
          location: point.location,
          value: point.value,
          unit: point.unit
        })),
        
        ecdPositions: (sample.ecdPositions || []).map(position => ({
          distance: position.distance,
          location: position.location
        })),
        
        // Nouveau format curveData au lieu de curveSeries
        curveData: curveData
      };
    })
  }));

  console.log('✅ buildResultsData - results:', JSON.stringify(results, null, 2));
  return { resultsData: { results } };
};

/**
 * Génère les données complètes d'un rapport de test
 * @param {number} testId - ID du test
 * @param {Array} selectedSections - Sections à inclure dans le rapport
 * @returns {Object} Données du rapport
 */
const getTrialReportData = async (trialId, selectedSections = []) => {
  try {
    logger.info('🔍 getTrialReportData appelé', { trialId, selectedSections });
    
    // 1. Récupérer le trial avec recipe et furnace
    const trialNode = await node.findOne({
      where: { id: trialId, type: 'trial' },
      include: [{ 
        model: trial, 
        as: 'trial',
        include: [
          {
            model: db.ref_process_type,
            as: 'processTypeRef',
            required: false
          },
          {
            model: db.recipe,
            as: 'recipe',
            required: false,
            include: [
              { 
                model: db.recipe_preox_cycle, 
                as: 'preoxCycle', 
                required: false 
              },
              { 
                model: db.recipe_thermal_cycle, 
                as: 'thermalCycle', 
                required: false 
              },
              { 
                model: db.recipe_chemical_cycle, 
                as: 'chemicalCycle', 
                required: false,
                include: [
                  { 
                    model: db.recipe_chemical_step, 
                    as: 'steps', 
                    required: false,
                    include: [
                      { 
                        model: db.recipe_chemical_gas, 
                        as: 'gases', 
                        required: false 
                      }
                    ]
                  }
                ]
              },
              { 
                model: db.recipe_gas_quench, 
                as: 'gasQuench', 
                required: false,
                include: [
                  { 
                    model: db.recipe_gas_quench_speed, 
                    as: 'speedSteps', 
                    required: false 
                  },
                  { 
                    model: db.recipe_gas_quench_pressure, 
                    as: 'pressureSteps', 
                    required: false 
                  }
                ]
              },
              { 
                model: db.recipe_oil_quench, 
                as: 'oilQuench', 
                required: false,
                include: [
                  { 
                    model: db.recipe_oil_quench_speed, 
                    as: 'speedSteps', 
                    required: false 
                  }
                ]
              }
            ]
          },
          {
            model: db.furnace,
            as: 'furnace',
            required: false
          },
          {
            model: db.results_step,
            as: 'resultSteps',
            required: false,
            include: [
              {
                model: db.results_sample,
                as: 'samples',
                required: false,
                include: [
                  {
                    model: db.results_hardness_point,
                    as: 'hardnessPoints',
                    required: false
                  },
                  {
                    model: db.results_ecd_position,
                    as: 'ecdPositions',
                    required: false
                  },
                  {
                    model: db.results_curve_series,
                    as: 'curveSeries',
                    required: false,
                    include: [
                      {
                        model: db.results_curve_point,
                        as: 'points',
                        required: false
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }]
    });
    
    if (!trialNode) {
      logger.error('Node introuvable', { trialId, type: 'trial' });
      throw new NotFoundError(`Node ${trialId} de type 'trial' introuvable`);
    }
    
    if (!trialNode.trial) {
      logger.error('Données trial manquantes', { 
        trialId, 
        nodeExists: true,
        nodeName: trialNode.name,
        nodeType: trialNode.type 
      });
      throw new NotFoundError(
        `Le node ${trialId} existe mais n'a pas de données trial associées. ` +
        `Vérifiez que la table 'trials' contient une entrée avec node_id=${trialId}`
      );
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
    const { partNode, clientNode } = await getTestHierarchy(trialId);

    // 4. Construire les données de base
    const reportData = buildBaseTestData(trialNode);

    // Log pour déboguer le process_type
    logger.info('📋 Trial data pour process_type:', {
      trialId,
      process_type: trialNode.trial?.process_type,
      processTypeRef: trialNode.trial?.processTypeRef?.name,
      hasProcessTypeRef: !!trialNode.trial?.processTypeRef
    });

    // 5. Ajouter les données de hiérarchie
    if (partNode) {
      reportData.partId = partNode.id;
      reportData.partName = partNode.name;
      reportData.partData = partNode.part;
      
      logger.debug('Données pièce ajoutées', {
        partId: partNode.id,
        partName: partNode.name,
        hasPartData: !!partNode.part
      });
    } else {
      logger.warn('Aucune pièce trouvée pour le trial', { trialId });
    }

    if (clientNode) {
      reportData.clientId = clientNode.id;
      reportData.clientName = clientNode.name;
      reportData.clientData = clientNode.client;
      
      logger.debug('Données client ajoutées', {
        clientId: clientNode.id,
        clientName: clientNode.name,
        hasClientData: !!clientNode.client
      });
    } else {
      logger.warn('Aucun client trouvé pour le trial', { trialId });
    }

    // 6. Ajouter les données selon les sections sélectionnées
    if (sections.includes('recipe')) {
      const recipeAndQuenchData = buildRecipeData(trialNode.trial);
      Object.assign(reportData, recipeAndQuenchData);
      
      logger.debug('Données recette assignées au rapport', {
        hasRecipeData: !!recipeAndQuenchData.recipeData,
        hasQuenchData: !!recipeAndQuenchData.quenchData,
        hasFurnaceData: !!recipeAndQuenchData.furnaceData
      });
    }

    if (sections.includes('results') || sections.includes('hardness') || sections.includes('ecd') || sections.includes('control')) {
      Object.assign(reportData, buildResultsData(trialNode.trial));
    }

    // 7. Récupérer les fichiers des sections sélectionnées
    if (sections.length > 0 && partNode) {
      reportData.sectionFiles = await getAllSectionFiles(
        trialId, 
        partNode.id, 
        sections
      );
    }

    logger.info('Données rapport générées', { 
      trialId, 
      sectionsCount: sections.length,
      hasPartData: !!reportData.partData,
      hasClientData: !!reportData.clientData,
      partName: reportData.partName,
      clientName: reportData.clientName
    });

    return reportData;

  } catch (error) {
    logger.warn('Erreur récupération hiérarchie trial', { 
      trialId, 
      error: error.message 
    });
    throw error;
  }
};

module.exports = {
  getTrialReportData,
  getTrialHierarchy: getTestHierarchy,
  getSectionFiles,
  // Export des fonctions utilitaires pour tests unitaires
  parseJsonField,
  buildBaseTrialData: buildBaseTestData,
  buildRecipeData,
  buildQuenchData,
  buildResultsData
};
