/**
 * Service de gestion des trials
 * Contient la logique métier liée aux opérations sur les trials
 */

const { node, trial, closure, part, client, file, sequelize } = require('../models');
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
 * Crée une recette (recipes + sous-tables) à partir d'un objet recipeData
 * Retourne recipe_id ou null
 */
const createRecipeFromData = async (recipeData, transaction) => {
  if (!recipeData) return null;

  const RecipeModel = sequelize.models.recipe;
  const PreoxModel = sequelize.models.recipe_preox_cycle;
  const ThermalModel = sequelize.models.recipe_thermal_cycle;
  const ChemicalModel = sequelize.models.recipe_chemical_cycle;
  const ChemicalStepModel = sequelize.models.recipe_chemical_step;
  const ChemicalGasModel = sequelize.models.recipe_chemical_gas;
  const GasQuenchModel = sequelize.models.recipe_gas_quench;
  const GasQuenchSpeed = sequelize.models.recipe_gas_quench_speed;
  const GasQuenchPressure = sequelize.models.recipe_gas_quench_pressure;
  const OilQuenchModel = sequelize.models.recipe_oil_quench;
  const OilQuenchSpeed = sequelize.models.recipe_oil_quench_speed;

  // Création d'une nouvelle recette à chaque fois (pas de déduplication par numéro)
  let recipe = await RecipeModel.create({ recipe_number: recipeData.number || null }, { transaction });

  // Pré-oxydation
  if (recipeData.preox) {
    await PreoxModel.create({
      recipe_id: recipe.recipe_id,
      media: recipeData.preox.media || null,
      temperature_value: recipeData.preox.temperature?.value || null,
      temperature_unit: recipeData.preox.temperature?.unit || null,
      duration_value: recipeData.preox.duration?.value || null,
      duration_unit: recipeData.preox.duration?.unit || null
    }, { transaction });
  }

  // Cycle thermique (bulkCreate)
  if (Array.isArray(recipeData.thermal_cycle) && recipeData.thermal_cycle.length > 0) {
    await ThermalModel.bulkCreate(
      recipeData.thermal_cycle.map(step => ({
        recipe_id: recipe.recipe_id,
        ramp: step.ramp || null,
        setpoint: step.setpoint || null,
        duration: step.duration || null
      })),
      { transaction }
    );
  }

  // Cycle chimique
  if (Array.isArray(recipeData.chemical_cycle) && recipeData.chemical_cycle.length > 0) {
    // Créer l'enregistrement chemical_cycle avec les métadonnées
    const chemical = await ChemicalModel.create({
      recipe_id: recipe.recipe_id,
      selected_gas1: recipeData.selected_gas1 || null,
      selected_gas2: recipeData.selected_gas2 || null,
      selected_gas3: recipeData.selected_gas3 || null,
      wait_time_value: recipeData.wait_time?.value || null,
      wait_time_unit: recipeData.wait_time?.unit || null,
      wait_pressure_value: recipeData.wait_pressure?.value || null,
      wait_pressure_unit: recipeData.wait_pressure?.unit || null,
      wait_gas: recipeData.wait_gas || null,
      wait_flow: recipeData.wait_flow || null,
      cell_temp_value: recipeData.cell_temp?.value || null,
      cell_temp_unit: recipeData.cell_temp?.unit || null
    }, { transaction });

    // Créer les steps du cycle chimique (bulkCreate + retour des IDs)
    const stepRecords = await ChemicalStepModel.bulkCreate(
      recipeData.chemical_cycle.map(step => ({
        chemical_cycle_id: chemical.chemical_cycle_id,
        time: step.time || null,
        pressure: step.pressure || null,
        turbine: step.turbine || null
      })),
      { transaction, returning: true }
    );

    // Créer tous les gaz en une seule opération bulkCreate
    const allGases = [];
    stepRecords.forEach((stepRec, idx) => {
      const step = recipeData.chemical_cycle[idx];
      if (Array.isArray(step.gases) && step.gases.length > 0) {
        for (const g of step.gases) {
          allGases.push({
            step_id: stepRec.step_id,
            gas_name: g.gas || g.gas_name || null,
            debit: g.debit || null,
            gas_index: g.index || g.gas_index || null
          });
        }
      }
    });
    if (allGases.length > 0) {
      await ChemicalGasModel.bulkCreate(allGases, { transaction });
    }
  } else if (recipeData.selected_gas1 || recipeData.selected_gas2 || recipeData.selected_gas3 ||
    recipeData.wait_time || recipeData.wait_pressure || recipeData.cell_temp ||
    recipeData.wait_gas || recipeData.wait_flow) {
    // Si pas de chemical_cycle array mais qu'on a les métadonnées, les enregistrer quand même
    await ChemicalModel.create({
      recipe_id: recipe.recipe_id,
      selected_gas1: recipeData.selected_gas1 || null,
      selected_gas2: recipeData.selected_gas2 || null,
      selected_gas3: recipeData.selected_gas3 || null,
      wait_time_value: recipeData.wait_time?.value || null,
      wait_time_unit: recipeData.wait_time?.unit || null,
      wait_pressure_value: recipeData.wait_pressure?.value || null,
      wait_pressure_unit: recipeData.wait_pressure?.unit || null,
      wait_gas: recipeData.wait_gas || null,
      wait_flow: recipeData.wait_flow || null,
      cell_temp_value: recipeData.cell_temp?.value || null,
      cell_temp_unit: recipeData.cell_temp?.unit || null
    }, { transaction });
  }

  // Trempe (gas/oil) - options: save minimal structures if present
  if (recipeData.quench_data) {
    if (recipeData.quench_data.gas_quench) {
      const gq = await GasQuenchModel.create({ recipe_id: recipe.recipe_id }, { transaction });
      if (Array.isArray(recipeData.quench_data.gas_quench.speed_parameters) && recipeData.quench_data.gas_quench.speed_parameters.length > 0) {
        await GasQuenchSpeed.bulkCreate(
          recipeData.quench_data.gas_quench.speed_parameters.map(s => ({
            gas_quench_id: gq.gas_quench_id,
            duration: s.duration || null,
            speed: s.speed || null
          })),
          { transaction }
        );
      }
      if (Array.isArray(recipeData.quench_data.gas_quench.pressure_parameters) && recipeData.quench_data.gas_quench.pressure_parameters.length > 0) {
        await GasQuenchPressure.bulkCreate(
          recipeData.quench_data.gas_quench.pressure_parameters.map(p => ({
            gas_quench_id: gq.gas_quench_id,
            duration: p.duration || null,
            pressure: p.pressure || null
          })),
          { transaction }
        );
      }
    }

    if (recipeData.quench_data.oil_quench) {
      const oq = await OilQuenchModel.create({
        recipe_id: recipe.recipe_id,
        temperature_value: recipeData.quench_data.oil_quench.temperature?.value || null,
        temperature_unit: recipeData.quench_data.oil_quench.temperature?.unit || null,
        pressure: recipeData.quench_data.oil_quench.inerting_pressure || null,
        inerting_delay_value: recipeData.quench_data.oil_quench.inerting_delay?.value || null,
        inerting_delay_unit: recipeData.quench_data.oil_quench.inerting_delay?.unit || null,
        dripping_time_value: recipeData.quench_data.oil_quench.dripping_time?.value || null
      }, { transaction });

      if (Array.isArray(recipeData.quench_data.oil_quench.speed_parameters) && recipeData.quench_data.oil_quench.speed_parameters.length > 0) {
        await OilQuenchSpeed.bulkCreate(
          recipeData.quench_data.oil_quench.speed_parameters.map(s => ({
            oil_quench_id: oq.oil_quench_id,
            duration: s.duration || null,
            speed: s.speed || null
          })),
          { transaction }
        );
      }
    }
  }

  return recipe.recipe_id;
};

/**
 * Crée les résultats (results_steps + sous-tables) à partir d'un objet resultsData
 */
const createResultsFromData = async (trialNodeId, resultsData, transaction) => {
  if (!resultsData || !Array.isArray(resultsData.results) || resultsData.results.length === 0) {
    return;
  }

  const ResultStepModel = sequelize.models.results_step;
  const ResultSampleModel = sequelize.models.results_sample;
  const HardnessPointModel = sequelize.models.results_hardness_point;
  const EcdPositionModel = sequelize.models.results_ecd_position;
  const CurveSeriesModel = sequelize.models.results_curve_series;
  const CurvePointModel = sequelize.models.results_curve_point;

  // 1. Bulk create tous les steps
  const stepRecords = await ResultStepModel.bulkCreate(
    resultsData.results.map(result => ({
      trial_node_id: trialNodeId,
      step_number: result.step || null,
      description: result.description || null
    })),
    { transaction, returning: true }
  );

  // 2. Préparer et bulk create tous les samples
  const allSamplesData = [];
  const sampleToResultIndex = []; // Pour mapper sample -> result (pour hardness/ecd/curves)
  stepRecords.forEach((stepRec, resultIdx) => {
    const result = resultsData.results[resultIdx];
    if (!Array.isArray(result.samples) || result.samples.length === 0) return;
    for (const sample of result.samples) {
      sampleToResultIndex.push({ resultIdx, sample });
      allSamplesData.push({
        result_step_id: stepRec.result_step_id,
        sample_number: sample.step || null,
        description: sample.description || null,
        ecd_hardness_unit: sample.ecd?.hardness_unit || null,
        ecd_hardness_value: sample.ecd?.hardness_value || null
      });
    }
  });

  if (allSamplesData.length === 0) return;

  const sampleRecords = await ResultSampleModel.bulkCreate(allSamplesData, { transaction, returning: true });

  // 3. Préparer les données enfants (hardness, ecd, curves) par sample
  const allHardnessData = [];
  const allEcdData = [];
  const allCurveSeriesData = [];
  const curveSeriesMeta = []; // Pour mapper chaque série à ses points

  sampleRecords.forEach((sampleRec, idx) => {
    const { sample } = sampleToResultIndex[idx];

    // Hardness points
    if (Array.isArray(sample.hardness_points) && sample.hardness_points.length > 0) {
      for (const hp of sample.hardness_points) {
        allHardnessData.push({
          sample_id: sampleRec.sample_id,
          unit: hp.unit || null,
          value: hp.value || null,
          location: hp.location || null
        });
      }
    }

    // ECD positions
    const ecdPoints = sample.ecd?.positions || sample.ecd?.ecd_points || sample.ecd?.ecdPoints;
    if (ecdPoints && Array.isArray(ecdPoints) && ecdPoints.length > 0) {
      for (const ecd of ecdPoints) {
        allEcdData.push({
          sample_id: sampleRec.sample_id,
          distance: ecd.distance || null,
          location: ecd.position || ecd.location || null,
          hardness: ecd.hardness || null,
          hardness_unit: ecd.hardness_unit || null
        });
      }
    }

    // Curve series
    if (sample.curve_data?.distances && Array.isArray(sample.curve_data.series) && sample.curve_data.series.length > 0) {
      for (const series of sample.curve_data.series) {
        curveSeriesMeta.push({
          sampleId: sampleRec.sample_id,
          distances: sample.curve_data.distances,
          values: series.values || []
        });
        allCurveSeriesData.push({
          sample_id: sampleRec.sample_id,
          name: series.name || null
        });
      }
    }
  });

  // 4. Bulk create hardness, ecd, curve series en parallèle
  const [, , seriesRecords] = await Promise.all([
    allHardnessData.length > 0
      ? HardnessPointModel.bulkCreate(allHardnessData, { transaction })
      : Promise.resolve([]),
    allEcdData.length > 0
      ? EcdPositionModel.bulkCreate(allEcdData, { transaction })
      : Promise.resolve([]),
    allCurveSeriesData.length > 0
      ? CurveSeriesModel.bulkCreate(allCurveSeriesData, { transaction, returning: true })
      : Promise.resolve([])
  ]);

  // 5. Bulk create tous les curve points
  if (seriesRecords.length > 0) {
    const allCurvePoints = [];
    seriesRecords.forEach((seriesRec, idx) => {
      const meta = curveSeriesMeta[idx];
      if (Array.isArray(meta.values) && meta.values.length > 0) {
        for (let i = 0; i < meta.values.length; i++) {
          allCurvePoints.push({
            series_id: seriesRec.series_id,
            distance: meta.distances[i] || null,
            value: meta.values[i] || null
          });
        }
      }
    });
    if (allCurvePoints.length > 0) {
      await CurvePointModel.bulkCreate(allCurvePoints, { transaction });
    }
  }
};

/**
 * Met à jour une recette existante : stratégie simple -> suppression des sous-éléments puis recréation
 */
const updateRecipeFromData = async (recipeId, recipeData, transaction) => {
  if (!recipeId || !recipeData) return null;

  const RecipeModel = sequelize.models.recipe;

  // Supprimer les sous-éléments existants en batch
  // IMPORTANT: Ordre de suppression respectant les FK

  // 1. Supprimer les gaz chimiques via sous-requête (pas de boucle)
  const chemicalCycle = await sequelize.models.recipe_chemical_cycle.findOne({
    where: { recipe_id: recipeId },
    transaction
  });
  if (chemicalCycle) {
    const stepIds = await sequelize.models.recipe_chemical_step.findAll({
      where: { chemical_cycle_id: chemicalCycle.chemical_cycle_id },
      attributes: ['step_id'],
      raw: true,
      transaction
    });
    if (stepIds.length > 0) {
      await sequelize.models.recipe_chemical_gas.destroy({
        where: { step_id: stepIds.map(s => s.step_id) },
        transaction
      });
    }
    await sequelize.models.recipe_chemical_step.destroy({
      where: { chemical_cycle_id: chemicalCycle.chemical_cycle_id },
      transaction
    });
  }
  await sequelize.models.recipe_chemical_cycle.destroy({ where: { recipe_id: recipeId }, transaction });

  // 2. Supprimer trempe gaz (speed + pressure en batch)
  const gasQuench = await sequelize.models.recipe_gas_quench.findOne({
    where: { recipe_id: recipeId },
    transaction
  });
  if (gasQuench) {
    await Promise.all([
      sequelize.models.recipe_gas_quench_speed.destroy({
        where: { gas_quench_id: gasQuench.gas_quench_id },
        transaction
      }),
      sequelize.models.recipe_gas_quench_pressure.destroy({
        where: { gas_quench_id: gasQuench.gas_quench_id },
        transaction
      })
    ]);
  }
  await sequelize.models.recipe_gas_quench.destroy({ where: { recipe_id: recipeId }, transaction });

  // 3. Supprimer trempe huile (speed)
  const oilQuench = await sequelize.models.recipe_oil_quench.findOne({
    where: { recipe_id: recipeId },
    transaction
  });
  if (oilQuench) {
    await sequelize.models.recipe_oil_quench_speed.destroy({
      where: { oil_quench_id: oilQuench.oil_quench_id },
      transaction
    });
  }
  await sequelize.models.recipe_oil_quench.destroy({ where: { recipe_id: recipeId }, transaction });

  // 4. Supprimer cycles simples en parallèle
  await Promise.all([
    sequelize.models.recipe_preox_cycle.destroy({ where: { recipe_id: recipeId }, transaction }),
    sequelize.models.recipe_thermal_cycle.destroy({ where: { recipe_id: recipeId }, transaction })
  ]);

  // Mettre à jour le numéro
  // await RecipeModel.update({ recipe_number: recipeData.number || null }, { where: { recipe_id: recipeId }, transaction });

  // Recreate sub-entities manually (targeting existing recipeId)
  if (recipeData.preox) {
    await sequelize.models.recipe_preox_cycle.create({
      recipe_id: recipeId,
      media: recipeData.preox.media || null,
      temperature_value: recipeData.preox.temperature?.value || null,
      temperature_unit: recipeData.preox.temperature?.unit || null,
      duration_value: recipeData.preox.duration?.value || null,
      duration_unit: recipeData.preox.duration?.unit || null
    }, { transaction });
  }

  if (Array.isArray(recipeData.thermal_cycle) && recipeData.thermal_cycle.length > 0) {
    await sequelize.models.recipe_thermal_cycle.bulkCreate(
      recipeData.thermal_cycle.map(step => ({
        recipe_id: recipeId,
        ramp: step.ramp || null,
        setpoint: step.setpoint || null,
        duration: step.duration || null
      })),
      { transaction }
    );
  }

  if (Array.isArray(recipeData.chemical_cycle) && recipeData.chemical_cycle.length > 0) {
    const chemical = await sequelize.models.recipe_chemical_cycle.create({
      recipe_id: recipeId,
      selected_gas1: recipeData.selected_gas1 || null,
      selected_gas2: recipeData.selected_gas2 || null,
      selected_gas3: recipeData.selected_gas3 || null,
      wait_time_value: recipeData.wait_time?.value || null,
      wait_time_unit: recipeData.wait_time?.unit || null,
      wait_pressure_value: recipeData.wait_pressure?.value || null,
      wait_pressure_unit: recipeData.wait_pressure?.unit || null,
      wait_gas: recipeData.wait_gas || null,
      wait_flow: recipeData.wait_flow || null,
      cell_temp_value: recipeData.cell_temp?.value || null,
      cell_temp_unit: recipeData.cell_temp?.unit || null
    }, { transaction });

    // Bulk create steps puis gaz
    const stepRecords = await sequelize.models.recipe_chemical_step.bulkCreate(
      recipeData.chemical_cycle.map(step => ({
        chemical_cycle_id: chemical.chemical_cycle_id,
        time: step.time || null,
        pressure: step.pressure || null,
        turbine: step.turbine || null
      })),
      { transaction, returning: true }
    );

    const allGases = [];
    stepRecords.forEach((stepRec, idx) => {
      const step = recipeData.chemical_cycle[idx];
      if (Array.isArray(step.gases) && step.gases.length > 0) {
        for (const g of step.gases) {
          allGases.push({
            step_id: stepRec.step_id,
            gas_name: g.gas || g.gas_name || null,
            debit: g.debit || null,
            gas_index: g.index || g.gas_index || null
          });
        }
      }
    });
    if (allGases.length > 0) {
      await sequelize.models.recipe_chemical_gas.bulkCreate(allGases, { transaction });
    }
  } else if (recipeData.selected_gas1 || recipeData.selected_gas2 || recipeData.selected_gas3 ||
    recipeData.wait_time || recipeData.wait_pressure || recipeData.cell_temp ||
    recipeData.wait_gas || recipeData.wait_flow) {
    // Si pas de chemical_cycle array mais qu'on a les métadonnées, les enregistrer quand même
    await sequelize.models.recipe_chemical_cycle.create({
      recipe_id: recipeId,
      selected_gas1: recipeData.selected_gas1 || null,
      selected_gas2: recipeData.selected_gas2 || null,
      selected_gas3: recipeData.selected_gas3 || null,
      wait_time_value: recipeData.wait_time?.value || null,
      wait_time_unit: recipeData.wait_time?.unit || null,
      wait_pressure_value: recipeData.wait_pressure?.value || null,
      wait_pressure_unit: recipeData.wait_pressure?.unit || null,
      wait_gas: recipeData.wait_gas || null,
      wait_flow: recipeData.wait_flow || null,
      cell_temp_value: recipeData.cell_temp?.value || null,
      cell_temp_unit: recipeData.cell_temp?.unit || null
    }, { transaction });
  }

  if (recipeData.quench_data) {
    if (recipeData.quench_data.gas_quench) {
      const gq = await sequelize.models.recipe_gas_quench.create({ recipe_id: recipeId }, { transaction });
      if (Array.isArray(recipeData.quench_data.gas_quench.speed_parameters) && recipeData.quench_data.gas_quench.speed_parameters.length > 0) {
        await sequelize.models.recipe_gas_quench_speed.bulkCreate(
          recipeData.quench_data.gas_quench.speed_parameters.map(s => ({
            gas_quench_id: gq.gas_quench_id,
            duration: s.duration || null,
            speed: s.speed || null
          })),
          { transaction }
        );
      }
      if (Array.isArray(recipeData.quench_data.gas_quench.pressure_parameters) && recipeData.quench_data.gas_quench.pressure_parameters.length > 0) {
        await sequelize.models.recipe_gas_quench_pressure.bulkCreate(
          recipeData.quench_data.gas_quench.pressure_parameters.map(p => ({
            gas_quench_id: gq.gas_quench_id,
            duration: p.duration || null,
            pressure: p.pressure || null
          })),
          { transaction }
        );
      }
    }

    if (recipeData.quench_data.oil_quench) {
      const oq = await sequelize.models.recipe_oil_quench.create({
        recipe_id: recipeId,
        temperature_value: recipeData.quench_data.oil_quench.temperature?.value || null,
        temperature_unit: recipeData.quench_data.oil_quench.temperature?.unit || null,
        pressure: recipeData.quench_data.oil_quench.inerting_pressure || null,
        inerting_delay_value: recipeData.quench_data.oil_quench.inerting_delay?.value || null,
        inerting_delay_unit: recipeData.quench_data.oil_quench.inerting_delay?.unit || null,
        dripping_time_value: recipeData.quench_data.oil_quench.dripping_time?.value || null
      }, { transaction });

      if (Array.isArray(recipeData.quench_data.oil_quench.speed_parameters) && recipeData.quench_data.oil_quench.speed_parameters.length > 0) {
        await sequelize.models.recipe_oil_quench_speed.bulkCreate(
          recipeData.quench_data.oil_quench.speed_parameters.map(s => ({
            oil_quench_id: oq.oil_quench_id,
            duration: s.duration || null,
            speed: s.speed || null
          })),
          { transaction }
        );
      }
    }
  }

  return recipeId;
};

/**
 * Met à jour les résultats existants (supprime tout et recrée)
 */
const updateResultsFromData = async (trialNodeId, resultsData, transaction) => {
  if (!trialNodeId) return;

  // ⚠️ FIX: Si resultsData est null/undefined, on ne touche PAS aux fichiers existants
  // Cela signifie que l'utilisateur n'a pas modifié les résultats, il a juste sauvegardé le trial
  // Supprimer les fichiers dans ce cas serait une erreur catastrophique !
  if (!resultsData) {
    logger.info('Pas de resultsData fourni, conservation des fichiers existants', { trialNodeId });
    return; // Ne pas supprimer les résultats existants ni les fichiers
  }

  // Calculer les résultats et samples conservés pour nettoyer les fichiers orphelins
  const keptContextKeys = new Set();
  if (Array.isArray(resultsData.results)) {
    resultsData.results.forEach(result => {
      const resultIndex = result.step;
      if (resultIndex !== undefined && resultIndex !== null && Array.isArray(result.samples)) {
        result.samples.forEach(sample => {
          const sampleNumber = sample.step;
          if (sampleNumber !== undefined && sampleNumber !== null) {
            // IMPORTANT: Convertir les step (base-1) en index (base-0) pour matcher le contexte des fichiers
            // Les fichiers sont uploadés avec result_index/sample_number en base-0
            // Les résultats en BDD utilisent step en base-1
            const fileResultIndex = String(resultIndex - 1);
            const fileSampleNumber = String(sampleNumber - 1);
            keptContextKeys.add(`${fileResultIndex}-${fileSampleNumber}`);
          }
        });
      }
    });
  }

  // ⚠️ FIX CRITIQUE: Si keptContextKeys est vide, on ne supprime AUCUN fichier
  // Cela arrive quand:
  // 1. resultsData.results est vide/absent
  // 2. resultsData.results contient des éléments MAIS sans step/samples valides
  // Dans les deux cas, supprimer tous les fichiers contextuels serait une erreur !
  // Les fichiers uploadés AVANT la création des résultats doivent être conservés
  if (keptContextKeys.size === 0) {
    logger.info('Aucun contexte de résultat valide, conservation de tous les fichiers existants', {
      trialNodeId,
      hasResultsArray: Array.isArray(resultsData.results),
      resultsLength: resultsData.results?.length || 0
    });
    return;
  }

  logger.info('Nettoyage des fichiers orphelins après mise à jour des résultats', {
    trialNodeId,
    keptCount: keptContextKeys.size,
    keptContexts: Array.from(keptContextKeys)  // Debug: voir les contextes conservés
  });

  // Supprimer les fichiers dont le contexte (sample/result) ne correspond plus à rien
  await fileService.deleteFilesByContext(trialNodeId, (context) => {
    // Si le fichier n'a pas de contexte de résultat/sample, on le garde
    if (!context || context.result_index === undefined || context.result_index === null ||
      context.sample_number === undefined || context.sample_number === null) {
      return false;
    }

    // Vérifier si la paire result-sample est conservée
    const key = `${context.result_index}-${context.sample_number}`;
    const shouldDelete = !keptContextKeys.has(key);

    // Debug: log pour comprendre les suppressions
    logger.debug('Vérification fichier pour suppression', {
      contextKey: key,
      isKept: !shouldDelete,
      keptContexts: Array.from(keptContextKeys)
    });

    return shouldDelete;
  }, transaction);

  // Supprimer les résultats existants en batch (pas de boucles)
  // 1. Récupérer les IDs nécessaires pour les suppressions en cascade
  const existingSteps = await sequelize.models.results_step.findAll({
    where: { trial_node_id: trialNodeId },
    attributes: ['result_step_id'],
    raw: true,
    transaction
  });
  const stepIds = existingSteps.map(s => s.result_step_id);

  if (stepIds.length > 0) {
    const existingSamples = await sequelize.models.results_sample.findAll({
      where: { result_step_id: stepIds },
      attributes: ['sample_id'],
      raw: true,
      transaction
    });
    const sampleIds = existingSamples.map(s => s.sample_id);

    if (sampleIds.length > 0) {
      // Récupérer les series IDs pour supprimer les points
      const existingSeries = await sequelize.models.results_curve_series.findAll({
        where: { sample_id: sampleIds },
        attributes: ['series_id'],
        raw: true,
        transaction
      });
      const seriesIds = existingSeries.map(s => s.series_id);

      // 2. Supprimer les feuilles en batch (points, hardness, ecd, series)
      await Promise.all([
        seriesIds.length > 0
          ? sequelize.models.results_curve_point.destroy({ where: { series_id: seriesIds }, transaction })
          : Promise.resolve(),
        sequelize.models.results_curve_series.destroy({ where: { sample_id: sampleIds }, transaction }),
        sequelize.models.results_hardness_point.destroy({ where: { sample_id: sampleIds }, transaction }),
        sequelize.models.results_ecd_position.destroy({ where: { sample_id: sampleIds }, transaction })
      ]);

      // 3. Supprimer les samples
      await sequelize.models.results_sample.destroy({ where: { result_step_id: stepIds }, transaction });
    }

    // 4. Supprimer les steps
    await sequelize.models.results_step.destroy({ where: { trial_node_id: trialNodeId }, transaction });
  }

  // Recréer tous les résultats
  await createResultsFromData(trialNodeId, resultsData, transaction);
};

/**
 * Trouve ou crée un furnace basé sur sa configuration
 * @param {Object} furnaceData - Données du furnace
 * @param {Object} transaction - Transaction Sequelize
 * @returns {Promise<number|null>} furnace_id ou null
 */
const findOrCreateFurnace = async (furnaceData, transaction) => {
  if (!furnaceData) return null;

  const { furnace_type, furnace_size, heating_cell, cooling_media, quench_cell } = furnaceData;

  // Si toutes les valeurs sont nulles ou vides, ne pas créer de furnace
  if (!furnace_type && !furnace_size && !heating_cell && !cooling_media && !quench_cell) {
    return null;
  }

  // Chercher un furnace existant avec cette configuration exacte
  const [furnace, created] = await sequelize.models.furnace.findOrCreate({
    where: {
      furnace_type: furnace_type || null,
      furnace_size: furnace_size || null,
      heating_cell: heating_cell || null,
      cooling_media: cooling_media || null,
      quench_cell: quench_cell || null
    },
    defaults: {
      furnace_type: furnace_type || null,
      furnace_size: furnace_size || null,
      heating_cell: heating_cell || null,
      cooling_media: cooling_media || null,
      quench_cell: quench_cell || null
    },
    transaction
  });

  return furnace.furnace_id;
};

/**
 * Récupère tous les trials avec pagination et filtrage
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des trials
 */
const getAllTrials = async (options = {}) => {
  const {
    limit = 10,
    offset = 0,
    parent_id = null,
    sortBy = 'modified_at',
    sortOrder = 'DESC',
    search = null
  } = options;

  const whereCondition = { type: 'trial' };

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
      'load_number': [trial, 'load_number', sortOrder],
      'recipe_number': [trial, 'recipe', 'recipe_number', sortOrder],
      'trial_date': [trial, 'trial_date', sortOrder],
      'location': [trial, 'location', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };

    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };

  // Exécuter la requête
  const trials = await node.findAll({
    where: whereCondition,
    include: [
      {
        model: trial,
        as: 'trial',
        attributes: ['trial_code', 'load_number', 'trial_date', 'status', 'location', 'recipe_id', 'observation', 'conclusion'],
        include: [
          {
            model: sequelize.models.recipe,
            as: 'recipe',
            attributes: ['recipe_number']
          }
        ]
      }
    ],
    order: [getOrderClause(sortBy, sortOrder)],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Compter le total pour la pagination
  const total = await node.count({
    where: whereCondition
  });

  return {
    trials,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Récupère un trial par son ID
 * @param {number} trialId - ID du trial
 * @returns {Promise<Object>} Détails du trial
 */
const getTrialById = async (trialId) => {
  const trialNode = await node.findOne({
    where: { id: trialId, type: 'trial' },
    include: [
      {
        model: trial,
        as: 'trial',
        attributes: { exclude: ['node_id'] }
      },
      {
        model: node,
        as: 'parent',
        include: [
          {
            model: sequelize.models.part,
            as: 'part',
            include: [
              {
                model: sequelize.models.specs_ecd,
                as: 'ecdSpecs'
              },
              {
                model: sequelize.models.steel,
                as: 'steel'
              }
            ]
          }
        ]
      }
    ]
  });

  if (!trialNode) {
    throw new NotFoundError('Trial non trouvé');
  }

  // Fusionner les données du nœud et du trial pour simplifier le traitement côté client
  const trialData = {
    id: trialNode.id,
    name: trialNode.name,
    path: trialNode.path,
    type: trialNode.type,
    parent_id: trialNode.parent_id,
    created_at: trialNode.created_at,
    modified_at: trialNode.modified_at,
    data_status: trialNode.data_status,
    description: trialNode.description
  };

  // Ajouter les propriétés du trial si elles existent
  if (trialNode.trial) {
    const trialValues = trialNode.trial.dataValues;

    // Transformer les colonnes plates en structure JSON pour le client
    // Données de base
    trialData.trial_code = trialValues.trial_code;
    trialData.load_number = trialValues.load_number;
    trialData.trial_date = trialValues.trial_date;
    trialData.status = trialValues.status;
    trialData.location = trialValues.location;
    trialData.mounting_type = trialValues.mounting_type;
    trialData.position_type = trialValues.position_type;
    trialData.process_type = trialValues.process_type;
    trialData.observation = trialValues.observation;
    trialData.conclusion = trialValues.conclusion;

    // Données de charge (load_data) - structure imbriquée
    trialData.load_data = {
      weight: {
        value: trialValues.load_weight_value || '',
        unit: trialValues.load_weight_unit || ''
      },
      size: {
        length: {
          value: trialValues.load_size_length_value || '',
          unit: trialValues.load_size_length_unit || ''
        },
        width: {
          value: trialValues.load_size_width_value || '',
          unit: trialValues.load_size_width_unit || ''
        },
        height: {
          value: trialValues.load_size_height_value || '',
          unit: trialValues.load_size_height_unit || ''
        }
      },
      part_count: trialValues.load_part_count,
      floor_count: trialValues.load_floor_count,
      comments: trialValues.load_comments
    };

    // Récupérer furnace, recipe et results en parallèle
    const [furnaceRecord, recipe, resultsSteps] = await Promise.all([
      // Furnace
      trialValues.furnace_id
        ? sequelize.models.furnace.findByPk(trialValues.furnace_id)
        : Promise.resolve(null),
      // Recipe
      trialValues.recipe_id
        ? sequelize.models.recipe.findByPk(trialValues.recipe_id, {
            include: [
              { model: sequelize.models.recipe_preox_cycle, as: 'preoxCycle' },
              { model: sequelize.models.recipe_thermal_cycle, as: 'thermalCycle' },
              {
                model: sequelize.models.recipe_chemical_cycle,
                as: 'chemicalCycle',
                include: [{
                  model: sequelize.models.recipe_chemical_step,
                  as: 'steps',
                  include: [{ model: sequelize.models.recipe_chemical_gas, as: 'gases' }]
                }]
              },
              {
                model: sequelize.models.recipe_gas_quench,
                as: 'gasQuench',
                include: [
                  { model: sequelize.models.recipe_gas_quench_speed, as: 'speedSteps' },
                  { model: sequelize.models.recipe_gas_quench_pressure, as: 'pressureSteps' }
                ]
              },
              {
                model: sequelize.models.recipe_oil_quench,
                as: 'oilQuench',
                include: [{ model: sequelize.models.recipe_oil_quench_speed, as: 'speedSteps' }]
              }
            ]
          })
        : Promise.resolve(null),
      // Results
      sequelize.models.results_step.findAll({
        where: { trial_node_id: trialId },
        include: [{
          model: sequelize.models.results_sample,
          as: 'samples',
          include: [
            { model: sequelize.models.results_hardness_point, as: 'hardnessPoints' },
            { model: sequelize.models.results_ecd_position, as: 'ecdPositions' },
            {
              model: sequelize.models.results_curve_series,
              as: 'curveSeries',
              include: [{ model: sequelize.models.results_curve_point, as: 'points' }]
            }
          ]
        }],
        order: [
          ['step_number', 'ASC'],
          [{ model: sequelize.models.results_sample, as: 'samples' }, 'sample_number', 'ASC'],
          [{ model: sequelize.models.results_sample, as: 'samples' }, { model: sequelize.models.results_hardness_point, as: 'hardnessPoints' }, 'hardness_point_id', 'ASC'],
          [{ model: sequelize.models.results_sample, as: 'samples' }, { model: sequelize.models.results_ecd_position, as: 'ecdPositions' }, 'ecd_position_id', 'ASC']
        ]
      })
    ]);

    // Données de four
    if (furnaceRecord) {
      trialData.furnace_data = {
        furnace_type: furnaceRecord.furnace_type,
        furnace_size: furnaceRecord.furnace_size,
        heating_cell: furnaceRecord.heating_cell,
        cooling_media: furnaceRecord.cooling_media,
        quench_cell: furnaceRecord.quench_cell
      };
    }

    // Données de recette
    if (recipe) {
        // Construction de recipe_data
        trialData.recipe_data = {
          number: recipe.recipe_number
        };

        // Préoxydation
        if (recipe.preoxCycle) {
          trialData.recipe_data.preox = {
            media: recipe.preoxCycle.media,
            temperature: {
              value: recipe.preoxCycle.temperature_value,
              unit: recipe.preoxCycle.temperature_unit
            },
            duration: {
              value: recipe.preoxCycle.duration_value,
              unit: recipe.preoxCycle.duration_unit
            }
          };
        }

        // Cycle thermique
        if (recipe.thermalCycle && recipe.thermalCycle.length > 0) {
          trialData.recipe_data.thermal_cycle = recipe.thermalCycle.map(step => ({
            ramp: step.ramp,
            setpoint: step.setpoint,
            duration: step.duration
          }));
        }

        // Cycle chimique
        if (recipe.chemicalCycle && recipe.chemicalCycle.steps && recipe.chemicalCycle.steps.length > 0) {
          trialData.recipe_data.selected_gas1 = recipe.chemicalCycle.selected_gas1 || '';
          trialData.recipe_data.selected_gas2 = recipe.chemicalCycle.selected_gas2 || '';
          trialData.recipe_data.selected_gas3 = recipe.chemicalCycle.selected_gas3 || '';
          trialData.recipe_data.wait_time = {
            value: recipe.chemicalCycle.wait_time_value,
            unit: recipe.chemicalCycle.wait_time_unit
          };
          trialData.recipe_data.wait_pressure = {
            value: recipe.chemicalCycle.wait_pressure_value,
            unit: recipe.chemicalCycle.wait_pressure_unit
          };
          trialData.recipe_data.wait_gas = recipe.chemicalCycle.wait_gas || '';
          trialData.recipe_data.wait_flow = recipe.chemicalCycle.wait_flow || '';
          trialData.recipe_data.cell_temp = {
            value: recipe.chemicalCycle.cell_temp_value,
            unit: recipe.chemicalCycle.cell_temp_unit
          };

          trialData.recipe_data.chemical_cycle = recipe.chemicalCycle.steps.map(step => ({
            time: step.time,
            pressure: step.pressure,
            turbine: step.turbine,
            gases: step.gases ? step.gases.map(gas => ({
              gas: gas.gas_name,
              debit: gas.debit,
              index: gas.gas_index
            })) : []
          }));
        } else if (recipe.chemicalCycle) {
          // Même sans steps, récupérer les métadonnées du cycle chimique incluant cell_temp
          trialData.recipe_data.selected_gas1 = recipe.chemicalCycle.selected_gas1 || '';
          trialData.recipe_data.selected_gas2 = recipe.chemicalCycle.selected_gas2 || '';
          trialData.recipe_data.selected_gas3 = recipe.chemicalCycle.selected_gas3 || '';
          trialData.recipe_data.wait_time = {
            value: recipe.chemicalCycle.wait_time_value,
            unit: recipe.chemicalCycle.wait_time_unit
          };
          trialData.recipe_data.wait_pressure = {
            value: recipe.chemicalCycle.wait_pressure_value,
            unit: recipe.chemicalCycle.wait_pressure_unit
          };
          trialData.recipe_data.wait_gas = recipe.chemicalCycle.wait_gas || '';
          trialData.recipe_data.wait_flow = recipe.chemicalCycle.wait_flow || '';
          trialData.recipe_data.cell_temp = {
            value: recipe.chemicalCycle.cell_temp_value,
            unit: recipe.chemicalCycle.cell_temp_unit
          };
        }

        // Données de trempe
        trialData.quench_data = {};

        if (recipe.gasQuench) {
          trialData.quench_data.gas_quench = {
            speed_parameters: recipe.gasQuench.speedSteps ? recipe.gasQuench.speedSteps.map(sp => ({
              duration: sp.duration,
              speed: sp.speed
            })) : [],
            pressure_parameters: recipe.gasQuench.pressureSteps ? recipe.gasQuench.pressureSteps.map(pp => ({
              duration: pp.duration,
              pressure: pp.pressure
            })) : []
          };
        }

        if (recipe.oilQuench) {
          trialData.quench_data.oil_quench = {
            temperature: {
              value: recipe.oilQuench.temperature_value,
              unit: recipe.oilQuench.temperature_unit
            },
            inerting_pressure: recipe.oilQuench.pressure,
            inerting_delay: {
              value: recipe.oilQuench.inerting_delay_value,
              unit: recipe.oilQuench.inerting_delay_unit
            },
            dripping_time: {
              value: recipe.oilQuench.dripping_time_value,
              unit: recipe.oilQuench.dripping_time_unit
            },
            speed_parameters: recipe.oilQuench.speedSteps ? recipe.oilQuench.speedSteps.map(sp => ({
              duration: sp.duration,
              speed: sp.speed
            })) : []
          };
        }
      }

    // Données de résultats (results_data) - déjà récupérées en parallèle ci-dessus
    if (resultsSteps && resultsSteps.length > 0) {
      trialData.results_data = {
        results: resultsSteps.map(resultStep => ({
          step: resultStep.step_number,
          description: resultStep.description,
          samples: resultStep.samples ? resultStep.samples.map(sample => ({
            step: sample.sample_number,
            description: sample.description,
            hardness_unit: sample.hardness_unit,
            hardness_points: sample.hardnessPoints ? sample.hardnessPoints.map(hp => ({
              location: hp.location,
              value: hp.value,
              unit: hp.unit
            })) : [],
            ecd: {
              hardness_value: sample.ecd_hardness_value,
              hardness_unit: sample.ecd_hardness_unit,
              positions: sample.ecdPositions ? sample.ecdPositions.map(ecd => ({
                position: ecd.location,
                distance: ecd.distance,
                hardness: ecd.hardness,
                hardness_unit: ecd.hardness_unit
              })) : []
            },
            curve_data: sample.curveSeries && sample.curveSeries.length > 0 ? {
              distances: sample.curveSeries[0].points ? [...new Set(sample.curveSeries[0].points.map(p => p.distance))].sort((a, b) => a - b) : [],
              series: sample.curveSeries.map(series => ({
                name: series.name,
                values: series.points ? series.points.sort((a, b) => a.distance - b.distance).map(p => p.value) : []
              }))
            } : { distances: [], series: [] }
          })) : []
        }))
      }
    }
  }

  // Ajouter le node avec le parent pour la prédiction de recette
  if (trialNode.parent) {
    trialData.node = {
      id: trialNode.id,
      parent_id: trialNode.parent_id,
      parent: trialNode.parent
    };
  }

  return trialData;
};

/**
 * Récupère les spécifications d'un trial
 * @param {number} trialId - ID du trial
 * @param {number} parent_id - ID du parent (optionnel)
 * @returns {Promise<Object>} Spécifications du trial
 */
const getTrialSpecs = async (trialId, parent_id) => {
  try {
    logger.info(`Récupération des spécifications pour trial #${trialId}, parent_id=${parent_id || 'non spécifié'}`);

    // Construire la clause WHERE
    const whereClause = {
      id: trialId,
      type: 'trial'
    };

    // Ajouter le filtrage par parent_id si fourni et non nul
    if (parent_id && parent_id !== 'undefined' && parent_id !== 'null') {
      whereClause.parent_id = parent_id;
    }

    logger.info(`Recherche de trial avec les critères:`, whereClause);

    // Rechercher le trial avec ces critères
    const trialNode = await node.findOne({
      where: whereClause,
      include: [{
        model: trial,
        as: 'trial',
        attributes: { exclude: ['node_id'] }
      }]
    });

    // Si le trial n'existe pas, retourner une erreur
    if (!trialNode) {
      logger.warn(`Trial non trouvé avec ID ${trialId} et parent_id ${parent_id || 'non spécifié'}`);
      throw new NotFoundError('Trial non trouvé');
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
          as: 'part',
          include: [
            {
              model: sequelize.models.specs_hardness,
              as: 'hardnessSpecs',
              required: false
            },
            {
              model: sequelize.models.specs_ecd,
              as: 'ecdSpecs',
              required: false
            }
          ]
        }]
      });

      if (parentNode && parentNode.part) {
        specifications = {
          hardnessSpecs: parentNode.part.hardnessSpecs || [],
          ecdSpecs: parentNode.part.ecdSpecs || []
        };

        logger.info(`Spécifications de la pièce parente récupérées pour le trial #${trialId}`, {
          hardnessCount: specifications.hardnessSpecs.length,
          ecdCount: specifications.ecdSpecs.length
        });
      } else {
        logger.warn(`Aucune spécification trouvée pour la pièce parente #${parent_id}`);
        specifications = { hardnessSpecs: [], ecdSpecs: [] };
      }
    } else {
      logger.warn(`Aucun parent_id fourni, initialisation avec spécifications vides`);
      specifications = { hardnessSpecs: [], ecdSpecs: [] };
    }

    const result = {
      trialId: trialNode.id,
      trialName: trialNode.name,
      specifications: specifications
    };

    logger.info(`Spécifications récupérées avec succès pour trial #${trialId}`);
    return result;
  } catch (error) {
    logger.error(`Erreur dans getTrialSpecs pour trial #${trialId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Crée un nouveau trial
 * @param {Object} trialData - Données du trial
 * @returns {Promise<Object>} Trial créé
 */
const createTrial = async (trialData) => {
  // Validation des données (à implémenter dans les validators)
  // const validationResult = validateTestData(trialData);
  // if (!validationResult.isValid) {
  //   throw new ValidationError('Données de trial invalides', validationResult.errors);
  // }

  const {
    parent_id,
    name,
    description,
    trial_code,
    load_number,
    trial_date,
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
    preox_media,
    observation,
    conclusion
  } = trialData;

  // Vérifier si le parent existe
  const parentNode = await node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Nœud parent introuvable');
  }
  // Démarrer une transaction
  const transaction = await sequelize.transaction();

  try {
    // Créer d'abord le nœud de trial pour obtenir l'ID
    const trialNode = await node.create({
      name: 'temp', // Nom temporaire, sera mis à jour ci-dessous
      path: 'temp', // Chemin temporaire, sera mis à jour ci-dessous
      type: 'trial',
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
      finalName = `TRIAL_${trialNode.id}`;
    }

    // Mettre à jour le nom et le chemin avec les valeurs définitives
    await trialNode.update({
      name: name || finalName,
      path: `${parentNode.path}/${finalName}`
    }, { transaction });

    // Générer la référence basée sur l'ID du nœud si non fournie
    const trialCodeToUse = trial_code || `TRIAL_${trialNode.id}`;

    // Gérer furnace_data : trouver ou créer un furnace
    const furnaceId = await findOrCreateFurnace(furnace_data, transaction);

    // Extraire les données de load_data pour les colonnes individuelles
    const loadDataFlat = {};
    if (load_data) {
      loadDataFlat.load_weight_unit = load_data.weight?.unit || null;
      loadDataFlat.load_weight_value = load_data.weight?.value || null;
      loadDataFlat.load_size_length_unit = load_data.size?.length?.unit || null;
      loadDataFlat.load_size_length_value = load_data.size?.length?.value || null;
      loadDataFlat.load_size_width_unit = load_data.size?.width?.unit || null;
      loadDataFlat.load_size_width_value = load_data.size?.width?.value || null;
      loadDataFlat.load_size_height_unit = load_data.size?.height?.unit || null;
      loadDataFlat.load_size_height_value = load_data.size?.height?.value || null;
      loadDataFlat.load_part_count = load_data.part_count || null;
      loadDataFlat.load_floor_count = load_data.floor_count || null;
      loadDataFlat.load_comments = load_data.comments || null;
    }

    // Créer l'enregistrement de trial avec les données plates
    const trialRecord = await trial.create({
      node_id: trialNode.id,
      trial_code: trialCodeToUse,
      load_number,
      trial_date,
      location,
      status: status || 'Pending',
      furnace_id: furnaceId,
      ...loadDataFlat,
      mounting_type,
      position_type,
      process_type,
      observation: observation || null,
      conclusion: conclusion || null
    }, { transaction });

    // Gérer recipe_data : créer la recette et lier recipe_id au trial
    if (recipe_data || quench_data) {
      try {
        // Fusionner quench_data dans recipe_data si fourni séparément
        const completeRecipeData = recipe_data ? { ...recipe_data } : {};
        if (quench_data) {
          completeRecipeData.quench_data = quench_data;
        }

        const newRecipeId = await createRecipeFromData(completeRecipeData, transaction);
        if (newRecipeId) {
          await trialRecord.update({ recipe_id: newRecipeId }, { transaction });
        }
      } catch (rErr) {
        logger.error('Erreur lors de la création de la recette depuis recipe_data', rErr);
        throw rErr;
      }
    }

    // Gérer results_data : créer les résultats
    if (results_data) {
      try {
        await createResultsFromData(trialNode.id, results_data, transaction);
      } catch (resErr) {
        logger.error('Erreur lors de la création des résultats depuis results_data', resErr);
        throw resErr;
      }
    }

    // Créer les enregistrements de fermeture (closure table)
    await closure.create({
      ancestor_id: trialNode.id,
      descendant_id: trialNode.id,
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
        descendant_id: trialNode.id,
        depth: cp.depth + 1
      }, { transaction });
    }

    // Valider la transaction
    await transaction.commit();

    // Mettre à jour le modified_at du trial et de ses ancêtres après commit
    await updateAncestorsModifiedAt(trialNode.id);

    // Récupérer le trial complet
    const createdTrial = await getTrialById(trialNode.id);
    return createdTrial;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    logger.error(`Erreur lors de la création du trial: ${error.message}`, error);
    throw error;
  }
};

/**
 * Met à jour un trial existant
 * @param {number} trialId - ID du trial
 * @param {Object} trialData - Nouvelles données
 * @returns {Promise<Object>} Trial mis à jour
 */
const updateTrial = async (trialId, trialData) => {
  // Récupérer le trial existant
  const trialNode = await node.findOne({
    where: { id: trialId, type: 'trial' },
    include: [{ model: trial, as: 'trial' }]
  });

  if (!trialNode) {
    throw new NotFoundError('Trial non trouvé');
  }

  // Démarrer une transaction
  const transaction = await sequelize.transaction();
  try {
    // Mettre à jour le nœud
    const nodeUpdates = {};

    // Gérer la mise à jour du nom basé sur load_number
    // Si le load_number change, mettre à jour automatiquement le nom
    if (trialData.load_number !== undefined) {
      const currentName = trialNode.name;
      const currentTrialCode = trialNode.trial ? trialNode.trial.trial_code : null;
      const currentLoadNumber = trialNode.trial ? trialNode.trial.load_number : null;

      // Détecter si le nom actuel est auto-généré (soit trial_code, soit ancien load_number, soit TRIAL_X)
      const isAutoGeneratedName = currentName === currentTrialCode ||
        currentName === currentLoadNumber ||
        /^TRIAL_\d+$/.test(currentName);

      // Si le nom est auto-généré ou si un nom spécifique n'est pas fourni différent du nom actuel
      if (isAutoGeneratedName || !trialData.name || trialData.name === currentName) {
        if (trialData.load_number && trialData.load_number.trim()) {
          // Si on a un load_number, l'utiliser comme nom
          nodeUpdates.name = trialData.load_number.trim();
        } else {
          // Si le load_number est vide, revenir au nom basé sur le test_code ou l'ID
          nodeUpdates.name = currentTestCode || `TRIAL_${testNode.id}`;
        }
      }
    }

    // Si un nom spécifique est fourni et différent du nom actuel, l'utiliser
    if (trialData.name && trialData.name !== trialNode.name && !nodeUpdates.name) {
      nodeUpdates.name = trialData.name;
    }

    // Gérer la description
    if (trialData.description !== undefined) {
      nodeUpdates.description = trialData.description;
    }

    // Toujours mettre à jour la date de modification
    nodeUpdates.modified_at = new Date();

    // S'assurer que la mise à jour est toujours appliquée pour mettre à jour modified_at
    await trialNode.update(nodeUpdates, { transaction });

    // Mettre à jour les données de trial
    const trialUpdates = {};

    // Gérer furnace_data : trouver ou créer un furnace
    if (trialData.furnace_data !== undefined) {
      const furnaceId = await findOrCreateFurnace(trialData.furnace_data, transaction);
      trialUpdates.furnace_id = furnaceId;
    }

    // Gérer load_data : extraire les valeurs individuelles
    if (trialData.load_data !== undefined) {
      const loadData = trialData.load_data;
      trialUpdates.load_weight_unit = loadData.weight?.unit || null;
      trialUpdates.load_weight_value = loadData.weight?.value || null;
      trialUpdates.load_size_length_unit = loadData.size?.length?.unit || null;
      trialUpdates.load_size_length_value = loadData.size?.length?.value || null;
      trialUpdates.load_size_width_unit = loadData.size?.width?.unit || null;
      trialUpdates.load_size_width_value = loadData.size?.width?.value || null;
      trialUpdates.load_size_height_unit = loadData.size?.height?.unit || null;
      trialUpdates.load_size_height_value = loadData.size?.height?.value || null;
      trialUpdates.load_part_count = loadData.part_count || null;
      trialUpdates.load_floor_count = loadData.floor_count || null;
      trialUpdates.load_comments = loadData.comments || null;
    }

    // Gérer les champs simples du trial
    const simpleFields = [
      'trial_code', 'load_number', 'trial_date', 'location', 'status',
      'mounting_type', 'position_type', 'process_type', 'observation', 'conclusion'
    ];

    for (const field of simpleFields) {
      if (trialData[field] !== undefined) {
        trialUpdates[field] = trialData[field];
      }
    }

    // Note: recipe_data, quench_data, results_data sont gérés via des tables séparées
    // Ils ne doivent PAS être stockés dans la table trials

    if (Object.keys(trialUpdates).length > 0) {
      await trialNode.trial.update(trialUpdates, { transaction });
    }

    // Gérer recipe_data: si fourni, créer ou mettre à jour la recette liée
    if (trialData.recipe_data !== undefined || trialData.quench_data !== undefined) {
      try {
        // Fusionner quench_data dans recipe_data si fourni séparément
        const completeRecipeData = trialData.recipe_data ? { ...trialData.recipe_data } : {};
        if (trialData.quench_data) {
          completeRecipeData.quench_data = trialData.quench_data;
        }

        if (trialNode.trial && trialNode.trial.recipe_id) {
          // Mise à jour in-place : supprime les sous-éléments et recrée (même recipe_id, pas d'orphelins)
          await updateRecipeFromData(trialNode.trial.recipe_id, completeRecipeData, transaction);
        } else {
          // Création
          const createdId = await createRecipeFromData(completeRecipeData, transaction);
          if (createdId) {
            await trialNode.trial.update({ recipe_id: createdId }, { transaction });
          }
        }
      } catch (rErr) {
        logger.error('Erreur lors de la création/mise à jour de la recette depuis recipe_data', rErr);
        throw rErr;
      }
    }

    // Gérer results_data : si fourni, créer ou mettre à jour les résultats
    if (trialData.results_data !== undefined) {
      try {
        await updateResultsFromData(trialNode.id, trialData.results_data, transaction);
      } catch (resErr) {
        logger.error('Erreur lors de la création/mise à jour des résultats depuis results_data', resErr);
        throw resErr;
      }
    }

    // Valider la transaction
    await transaction.commit();

    // Mettre à jour le modified_at du trial et de ses ancêtres après commit
    await updateAncestorsModifiedAt(trialId);

    // Récupérer le trial mis à jour
    const updatedTrial = await getTrialById(trialId);
    return updatedTrial;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await transaction.rollback();
    logger.error(`Erreur lors de la mise à jour du trial #${trialId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Supprime un trial
 * @param {number} trialId - ID du trial à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteTrial = async (trialId) => {
  // Récupérer le trial
  const trialNode = await node.findOne({
    where: { id: trialId, type: 'trial' }
  });

  if (!trialNode) {
    throw new NotFoundError('Trial non trouvé');
  }

  // Stocker le chemin physique du trial pour la suppression
  const trialPhysicalPath = trialNode.path;

  // Récupérer tous les descendants de ce trial
  const descendants = await closure.findAll({
    where: { ancestor_id: trialId },
    order: [['depth', 'DESC']] // Important: supprimer les plus profonds d'abord
  });

  // Démarrer une transaction
  const transaction = await sequelize.transaction();

  try {
    // Supprimer physiquement et logiquement tous les fichiers attachés au trial et ses descendants
    await fileService.deleteFilesRecursively(trialId, transaction);

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

    // 2. Supprimer les données liées au trial (results, recipe) avant de supprimer le trial
    //    Respecter l'ordre des FK : curve_points → curve_series/hardness/ecd → samples → steps
    const trialDescIds = descendantIds.filter(id => id !== undefined);

    // Récupérer les result_step IDs pour ce trial
    const existingSteps = await sequelize.models.results_step.findAll({
      where: { trial_node_id: trialDescIds },
      attributes: ['result_step_id'],
      raw: true,
      transaction
    });
    const stepIds = existingSteps.map(s => s.result_step_id);

    if (stepIds.length > 0) {
      const existingSamples = await sequelize.models.results_sample.findAll({
        where: { result_step_id: stepIds },
        attributes: ['sample_id'],
        raw: true,
        transaction
      });
      const sampleIds = existingSamples.map(s => s.sample_id);

      if (sampleIds.length > 0) {
        const existingSeries = await sequelize.models.results_curve_series.findAll({
          where: { sample_id: sampleIds },
          attributes: ['series_id'],
          raw: true,
          transaction
        });
        const seriesIds = existingSeries.map(s => s.series_id);

        await Promise.all([
          seriesIds.length > 0
            ? sequelize.models.results_curve_point.destroy({ where: { series_id: seriesIds }, transaction })
            : Promise.resolve(),
          sequelize.models.results_curve_series.destroy({ where: { sample_id: sampleIds }, transaction }),
          sequelize.models.results_hardness_point.destroy({ where: { sample_id: sampleIds }, transaction }),
          sequelize.models.results_ecd_position.destroy({ where: { sample_id: sampleIds }, transaction })
        ]);

        await sequelize.models.results_sample.destroy({ where: { result_step_id: stepIds }, transaction });
      }

      await sequelize.models.results_step.destroy({ where: { trial_node_id: trialDescIds }, transaction });
    }

    // Supprimer les données trial (table trials) pour tous les descendants de type trial
    for (const desc of descendants) {
      const nodeToDelete = await node.findByPk(desc.descendant_id, { transaction });
      if (nodeToDelete && (nodeToDelete.type === 'trial' || nodeToDelete.type === 'test')) {
        await trial.destroy({
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

    // NOUVELLE FONCTIONNALITÉ : Supprimer le dossier physique du trial
    // Cette opération se fait après la validation de la transaction pour éviter
    // de supprimer les fichiers si la transaction échoue
    // IMPORTANT: Les erreurs ici ne doivent PAS faire échouer l'opération car la transaction est déjà commitée
    try {
      const deletionResult = await deletePhysicalDirectory(trialPhysicalPath);
      if (deletionResult) {
        logger.info('Dossier physique trial supprimé', { trialId });
      } else {
        logger.warn('Échec suppression dossier physique trial', { trialId });
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      logger.error('Erreur suppression dossier physique trial', {
        trialId,
        error: physicalDeleteError.message
      });
    }

    return true;
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    // IMPORTANT: Vérifier que la transaction n'est pas déjà terminée avant le rollback
    if (!transaction.finished) {
      await transaction.rollback();
    }
    logger.error(`Erreur lors de la suppression du trial #${trialId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Récupère les données pour le rapport de trial
 * @param {number} trialId - ID du trial
 * @param {Array|Object} sections - Sections du rapport à inclure
 * @returns {Promise<Object>} Données formatées pour le rapport
 */
const getTrialReportData = async (trialId, sections = []) => {
  return reportService.getTrialReportData(trialId, sections);
};

module.exports = {
  getAllTrials,
  getTrialById,
  getTrialSpecs,
  createTrial,
  updateTrial,
  deleteTrial,
  getTrialReportData
};
