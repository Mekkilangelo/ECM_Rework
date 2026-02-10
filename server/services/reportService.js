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
              },
              {
                model: db.ref_units,
                as: 'weightUnit',
                required: false
              },
              {
                model: db.ref_units,
                as: 'rectUnit',
                required: false
              },
              {
                model: db.ref_units,
                as: 'circUnit',
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
  // Préparer toutes les requêtes de fichiers en parallèle
  const sectionPromises = selectedSections
    .filter(sectionName => FILE_SOURCES_CONFIG[sectionName])
    .map(async (sectionName) => {
      const sources = FILE_SOURCES_CONFIG[sectionName](
        sectionName === 'identification' ? partId : testId
      );
      const nodeId = sectionName === 'identification' ? partId : testId;

      // Toutes les sources d'une section en parallèle
      const filesArrays = await Promise.all(
        sources.map(source => getSectionFiles(nodeId, source.category, source.subcategory))
      );

      let allFiles = filesArrays.flat();

      // Pour l'identification, on ne veut que les images
      if (sectionName === 'identification') {
        allFiles = allFiles.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
      }

      // Déduplication par ID
      const uniqueFiles = Array.from(new Map(allFiles.map(item => [item.id, item])).values());

      return { sectionName, uniqueFiles };
    });

  // Toutes les sections en parallèle
  const results = await Promise.all(sectionPromises);

  const sectionFiles = {};
  for (const { sectionName, uniqueFiles } of results) {
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
    location: trialData?.location || null,
    trialData: {
      ...(trialData?.get ? trialData.get({ plain: true }) : trialData),
      observation: trialData?.observation,
      conclusion: trialData?.conclusion
    } // Ajouter les données complètes du trial avec observation et conclusion explicites
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

    // Température cellule
    cell_temp: recipe.chemicalCycle?.cell_temp_value ? {
      value: recipe.chemicalCycle.cell_temp_value,
      unit: recipe.chemicalCycle.cell_temp_unit || '°C'
    } : null,

    // Wait gas et wait flow
    wait_gas: recipe.chemicalCycle?.wait_gas || null,
    wait_flow: recipe.chemicalCycle?.wait_flow ? {
      value: recipe.chemicalCycle.wait_flow,
      unit: 'Nl/h'
    } : null
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
 * Construit les données de charge (load_data)
 * @param {Object} trialData - Données du trial avec relations
 * @returns {Object} Données de charge formatées
 */
const buildLoadData = (trialData) => {
  if (!trialData) return { loadData: null };

  const loadData = {
    weight: {
      value: trialData.load_weight_value,
      unit: trialData.load_weight_unit || trialData.weightUnit?.name || 'kg'
    },
    // Dimensions
    size: {
      width: {
        value: trialData.load_size_width_value,
        unit: trialData.load_size_width_unit
      },
      height: {
        value: trialData.load_size_height_value,
        unit: trialData.load_size_height_unit
      },
      length: {
        value: trialData.load_size_length_value,
        unit: trialData.load_size_length_unit
      }
    },
    // Quantités
    counts: {
      parts: trialData.load_part_count,
      floors: trialData.load_floor_count
    },
    // Métadonnées
    mounting: trialData.mounting_type,
    position: trialData.position_type,
    comments: trialData.load_comments
  };

  return { loadData };
};

const buildResultsData = (testData) => {
  if (!testData?.resultSteps || !Array.isArray(testData.resultSteps)) {
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
          location: position.location,
          hardness: position.hardness,
          hardnessUnit: position.hardness_unit
        })),

        // Nouveau format curveData au lieu de curveSeries
        curveData: curveData
      };
    })
  }));

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
    logger.info('🔍 getTrialReportData appelé (Optimized)', { trialId, selectedSections });

    // 1. Normaliser les sections sélectionnées
    let sections = [];
    if (Array.isArray(selectedSections)) {
      sections = selectedSections;
    } else if (typeof selectedSections === 'object' && selectedSections !== null) {
      sections = Object.keys(selectedSections).filter(key => selectedSections[key] === true);
    }

    // 2. Récupérer le trial de base (sans les grosses relations)
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
            model: db.ref_units,
            as: 'weightUnit',
            required: false
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

    const trialData = trialNode.trial;

    // 3. Préparer les requêtes parallèles pour les données lourdes (Recipe, Results, Furnace)
    const promises = {
      // Hiérarchie (toujours nécessaire pour le header)
      hierarchy: getTestHierarchy(trialId)
    };

    // Recipe & Furnace (si section recipe demandée)
    if (sections.includes('recipe')) {
      if (trialData.recipe_id) {
        promises.recipe = db.recipe.findByPk(trialData.recipe_id, {
          include: [
            { model: db.recipe_preox_cycle, as: 'preoxCycle', required: false },
            { model: db.recipe_thermal_cycle, as: 'thermalCycle', required: false },
            {
              model: db.recipe_chemical_cycle,
              as: 'chemicalCycle',
              required: false,
              include: [{
                model: db.recipe_chemical_step,
                as: 'steps',
                required: false,
                include: [{ model: db.recipe_chemical_gas, as: 'gases', required: false }]
              }]
            },
            {
              model: db.recipe_gas_quench,
              as: 'gasQuench',
              required: false,
              include: [
                { model: db.recipe_gas_quench_speed, as: 'speedSteps', required: false },
                { model: db.recipe_gas_quench_pressure, as: 'pressureSteps', required: false }
              ]
            },
            {
              model: db.recipe_oil_quench,
              as: 'oilQuench',
              required: false,
              include: [{ model: db.recipe_oil_quench_speed, as: 'speedSteps', required: false }]
            }
          ]
        });
      } else {
        promises.recipe = Promise.resolve(null);
      }

      if (trialData.furnace_id) {
        promises.furnace = db.furnace.findByPk(trialData.furnace_id);
      } else {
        promises.furnace = Promise.resolve(null);
      }
    }

    // Results (si sections liées aux résultats demandées)
    if (sections.includes('results') || sections.includes('hardness') || sections.includes('ecd') || sections.includes('control')) {
      promises.resultsCallback = db.results_step.findAll({
        where: { trial_node_id: trialId },
        include: [{
          model: db.results_sample,
          as: 'samples',
          required: false,
          include: [
            { model: db.results_hardness_point, as: 'hardnessPoints', required: false },
            { model: db.results_ecd_position, as: 'ecdPositions', required: false },
            {
              model: db.results_curve_series,
              as: 'curveSeries',
              required: false,
              include: [{ model: db.results_curve_point, as: 'points', required: false }]
            }
          ]
        }],
        order: [
          ['step_number', 'ASC'],
          [{ model: db.results_sample, as: 'samples' }, 'sample_number', 'ASC'],
          [{ model: db.results_sample, as: 'samples' }, { model: db.results_hardness_point, as: 'hardnessPoints' }, 'hardness_point_id', 'ASC'],
          [{ model: db.results_sample, as: 'samples' }, { model: db.results_ecd_position, as: 'ecdPositions' }, 'ecd_position_id', 'ASC']
        ]
      });
    }

    // 4. Exécuter les requêtes en parallèle
    logger.info('🚀 Lancement des requêtes parallèles...', { keys: Object.keys(promises) });

    // Attendre que tout soit résolu
    const resolvedData = {};
    const keys = Object.keys(promises);
    const results = await Promise.all(Object.values(promises));

    keys.forEach((key, index) => {
      resolvedData[key] = results[index];
    });

    logger.info('✅ Requêtes parallèles terminées');

    // 5. Construire le rapport final

    // a. Données de base
    const reportData = buildBaseTestData(trialNode);

    // b. Hiérarchie
    const { partNode, clientNode } = resolvedData.hierarchy;
    if (partNode) {
      reportData.partId = partNode.id;
      reportData.partName = partNode.name;
      reportData.partDescription = partNode.description; // Added description
      if (partNode.part) {
        const plainPartData = partNode.part.get ? partNode.part.get({ plain: true }) : partNode.part;
        reportData.partData = {
          ...plainPartData,
          dim_weight_unit: partNode.part.dim_weight_unit,
          dim_rect_unit: partNode.part.dim_rect_unit,
          dim_circ_unit: partNode.part.dim_circ_unit
        };
      } else {
        reportData.partData = null;
      }
    }

    if (clientNode) {
      reportData.clientId = clientNode.id;
      reportData.clientName = clientNode.name;
      reportData.clientData = clientNode.client;
    }

    // c. Recipe & Furnace
    if (sections.includes('recipe')) {
      // Reconstituer un objet trialData "virtuel" avec recipe et furnace pour utiliser buildRecipeData existant
      const virtualTrialData = {
        ...trialData.get({ plain: true }),
        recipe: resolvedData.recipe,
        furnace: resolvedData.furnace
      };

      const recipeAndQuenchData = buildRecipeData(virtualTrialData);
      Object.assign(reportData, recipeAndQuenchData);
    }

    // d. Results
    if (sections.includes('results') || sections.includes('hardness') || sections.includes('ecd') || sections.includes('control')) {
      // Reconstituer un objet trialData "virtuel" avec resultSteps pour utiliser buildResultsData existant
      const virtualTrialData = {
        ...trialData.get({ plain: true }),
        resultSteps: resolvedData.resultsCallback || []
      };

      Object.assign(reportData, buildResultsData(virtualTrialData));
    }

    // e. Load data
    if (sections.includes('load')) {
      const loadData = buildLoadData(trialData);
      Object.assign(reportData, loadData);
    }

    // f. Fichiers
    if (sections.length > 0 && partNode) {
      reportData.sectionFiles = await getAllSectionFiles(
        trialId,
        partNode.id,
        sections
      );
    }

    logger.info('Données rapport générées (Optimized)', {
      trialId,
      sectionsCount: sections.length,
      hasPartData: !!reportData.partData,
      hasClientData: !!reportData.clientData,
      partName: reportData.partName,
      clientName: reportData.clientName
    });

    return reportData;

  } catch (error) {
    logger.warn('Erreur génération rapport (Optimized)', {
      trialId,
      error: error.message,
      stack: error.stack
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
