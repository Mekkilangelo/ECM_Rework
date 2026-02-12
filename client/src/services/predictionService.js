import api from './api';

/**
 * Service pour prédire la recette de carburation via l'API ML
 */
class PredictionService {

  /**
   * Prédire une recette basée sur les paramètres fournis
   * @param {Object} params - Paramètres de prédiction (9 valeurs requises)
   * @returns {Promise<Object>} - {predicted_features: {...}, reconstructed_recipe: [...]}
   */
  async predictRecipe(params) {
    // La simulation CBPWin peut prendre jusqu'à 2 minutes, on augmente le timeout
    const response = await api.post('/recipe/predict', params, {
      timeout: 120000 // 2 minutes
    });
    return response.data;
  }

  /**
   * Valider et préparer les paramètres de prédiction à partir des données du trial et de la pièce
   * @param {Object} trialData - Données complètes du trial
   * @param {Object} parentNode - Node parent (type 'part') avec ses relations
   * @returns {Object} - {valid: boolean, missing: string[], params: Object}
   */
  validateAndPrepareParams(trialData, parentNode) {
    const missing = [];

    // Extraire les données de la pièce depuis le parent node
    const partData = parentNode.part;
    if (!partData) {
      missing.push('Données de la pièce non trouvées dans le nœud parent');
      return { valid: false, missing, params: null };
    }

    // === 1. HARDNESS_VALUE : Dureté depuis specs ECD ===
    const ecdSpecs = partData.ecdSpecs || [];
    const ecdSpec = ecdSpecs.find(spec =>
      spec.hardness &&
      spec.depthMin &&
      spec.depthMax &&
      spec.hardness !== '' &&
      spec.depthMin !== '' &&
      spec.depthMax !== ''
    );

    if (!ecdSpec) {
      missing.push('Spécification ECD avec dureté et profondeurs (min/max) dans la pièce parente');
    }

    const hardnessValue = ecdSpec ? parseFloat(ecdSpec.hardness) : null;
    if (!hardnessValue || isNaN(hardnessValue)) {
      missing.push('Dureté ECD valide (hardness) dans la pièce parente');
    }

    // === 2. TARGET_DEPTH : Médiane de depthMin et depthMax ===
    let targetDepth = null;
    if (ecdSpec) {
      const depthMin = parseFloat(ecdSpec.depthMin);
      const depthMax = parseFloat(ecdSpec.depthMax);

      if (!isNaN(depthMin) && !isNaN(depthMax)) {
        targetDepth = (depthMin + depthMax) / 2;
      } else {
        missing.push('Profondeurs ECD valides (depthMin et depthMax) dans la pièce parente');
      }
    }

    // === 3. LOAD_WEIGHT : Poids de la charge depuis trial.loadData ===
    const loadWeight = trialData.loadData?.weight;
    const loadWeightValue = loadWeight ? parseFloat(loadWeight) : null;

    if (!loadWeightValue || isNaN(loadWeightValue)) {
      missing.push('Poids de la charge (loadData.weight) dans l\'essai');
    }

    // === 4. WEIGHT : Poids de la pièce depuis part.dim_weight_value ===
    // Note: peut être inconnu, c'est géré par is_weight_unknown
    const partWeight = partData.dim_weight_value;
    const partWeightValue = partWeight ? parseFloat(partWeight) : 0;

    // === 5. IS_WEIGHT_UNKNOWN : 0 ou 1 selon disponibilité du poids ===
    const isWeightUnknown = (!partWeight || partWeight === '' || isNaN(partWeightValue)) ? 1 : 0;

    // === 6-8. RECIPE_TEMPERATURE, CARBON_MAX, CARBON_FLOW : Calculés depuis process_temp ===
    const cellTemp = parseFloat(trialData.recipeData?.processTemp);
    if (!cellTemp || isNaN(cellTemp)) {
      missing.push('Température process (Process Temp) dans les paramètres de programme');
    } else if (cellTemp < 880 || cellTemp > 990) {
      missing.push(`Température process doit être entre 880°C et 990°C (actuelle : ${cellTemp}°C)`);
    }

    const recipeTemperature = cellTemp || 950;
    // Cmax = f(T) = 0.0125T - 10.2 (valide 880-990°C)
    const recipeCarbonMax = 0.0125 * recipeTemperature - 10.2;
    // Flux = f(T) = 0.09T - 71.2 (valide 880-980°C)
    const recipeCarbonFlow = 0.09 * recipeTemperature - 71.2;

    // === 9. CARBON_PERCENTAGE : Depuis la composition de l'acier ===
    // L'acier est chargé via la relation steel du part
    const steel = partData.steel;
    let carbonPercentageValue = null;

    // DEBUG: Log steel object to analyze structure
    console.log('PredictionService: Analyzing steel:', steel);
    if (steel && steel.chemistery) {
      console.log('PredictionService: Steel chemistry:', steel.chemistery);
    }
    if (steel && steel.chemistery && Array.isArray(steel.chemistery)) {
      // Chercher l'élément Carbon dans le tableau chemistery
      // L'élément peut être "Carbon", "Carbone", "C", "C - Carbon", "C - Carbone"
      const carbonElement = steel.chemistery.find(chem => {
        const element = (chem.element || '').toLowerCase();
        return element.includes('carbon') ||
          element === 'c' ||
          element.startsWith('c -') ||
          element.startsWith('c-');
      });

      if (carbonElement) {
        let percentageValue = null;

        // Cas 1: Valeur stockée dans 'value' (String ou Number)
        if (carbonElement.value !== undefined && carbonElement.value !== null && carbonElement.value !== '') {
          // Normaliser la chaîne : remplacer virgule par point pour le parsing
          const valueStr = String(carbonElement.value).replace(/,/g, '.').trim();

          // Gérer les fourchettes (ex: "0.15-0.20" ou "0.15 - 0.20")
          if (valueStr.includes('-')) {
            const parts = valueStr.split('-').map(p => parseFloat(p.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              percentageValue = (parts[0] + parts[1]) / 2;
            } else {
              percentageValue = parseFloat(valueStr);
            }
          } else {
            percentageValue = parseFloat(valueStr);
          }
        }
        // Cas 2: Valeurs min_value/max_value (Keys identifiées via logs : max_value, min_value)
        else if (carbonElement.min_value !== undefined && carbonElement.max_value !== undefined) {
          const min = parseFloat(String(carbonElement.min_value).replace(/,/g, '.'));
          const max = parseFloat(String(carbonElement.max_value).replace(/,/g, '.'));
          if (!isNaN(min) && !isNaN(max)) {
            percentageValue = (min + max) / 2;
          }
        }
        // Cas 3: Fallback sur min/max (au cas où, pour compatibilité)
        else if (carbonElement.min !== undefined && carbonElement.max !== undefined) {
          const min = parseFloat(String(carbonElement.min).replace(/,/g, '.'));
          const max = parseFloat(String(carbonElement.max).replace(/,/g, '.'));
          if (!isNaN(min) && !isNaN(max)) {
            percentageValue = (min + max) / 2;
          }
        }

        // Si on a trouvé une valeur valide
        if (percentageValue !== null && !isNaN(percentageValue)) {
          // La valeur est stockée en pourcentage (ex: 0.20 pour 0.20%)
          // Conversion pourcentage -> décimal
          carbonPercentageValue = percentageValue / 100;
        }
      }
    }

    if (!carbonPercentageValue || isNaN(carbonPercentageValue)) {
      missing.push('Pourcentage de carbone initial dans la composition chimique (steel.chemistery) de l\'acier de la pièce parente');
    }

    // === Validation finale ===
    if (missing.length > 0) {
      return {
        valid: false,
        missing,
        params: null
      };
    }

    const params = {
      hardness_value: hardnessValue,
      target_depth: targetDepth,
      load_weight: loadWeightValue,
      weight: partWeightValue,
      is_weight_unknown: isWeightUnknown,
      recipe_temperature: recipeTemperature,
      recipe_carbon_max: recipeCarbonMax,
      recipe_carbon_flow: recipeCarbonFlow,
      carbon_percentage: carbonPercentageValue
    };

    return {
      valid: true,
      missing: [],
      params
    };
  }

  /**
   * Mapper la recette prédite vers le format des cycles chimiques de l'application
   * @param {Array} reconstructedRecipe - [[carb, diff], [carb, diff], ..., [carb, diff, final]]
   * @returns {Array} - Cycles au format {step, time, debit1, debit2, debit3, pressure, turbine}
   */
  mapToChemicalCycles(reconstructedRecipe) {
    if (!reconstructedRecipe || reconstructedRecipe.length === 0) {
      return [];
    }

    const chemicalCycles = [];
    let stepNumber = 1;

    reconstructedRecipe.forEach((cycle, index) => {
      const isLastCycle = index === reconstructedRecipe.length - 1;

      // Chaque cycle de simulation : [carb_time, diff_time, final_time (optionnel)]
      const carbTime = cycle[0] ? Math.round(cycle[0]) : 0;
      const diffTime = cycle[1] ? Math.round(cycle[1]) : 0;
      const finalTime = isLastCycle && cycle[2] ? Math.round(cycle[2]) : null;

      // Step 1: Carburation (utilise selectedGas1 = C2H2)
      chemicalCycles.push({
        step: stepNumber++,
        time: carbTime,
        debit1: '', // À remplir par l'utilisateur
        debit2: '',
        debit3: '',
        pressure: '', // À remplir par l'utilisateur
        turbine: false,
        _predicted: true,
        _phase: 'carburation'
      });

      // Step 2: Diffusion (utilise selectedGas2 = N2)
      chemicalCycles.push({
        step: stepNumber++,
        time: diffTime,
        debit1: '', // À remplir par l'utilisateur
        debit2: '',
        debit3: '',
        pressure: '', // À remplir par l'utilisateur
        turbine: false,
        _predicted: true,
        _phase: 'diffusion'
      });

      // Step 3 (dernier cycle seulement): Phase finale (utilise selectedGas2 = N2)
      if (isLastCycle && finalTime) {
        chemicalCycles.push({
          step: stepNumber++,
          time: finalTime,
          debit1: '', // À remplir par l'utilisateur
          debit2: '',
          debit3: '',
          pressure: '', // À remplir par l'utilisateur
          turbine: false,
          _predicted: true,
          _phase: 'final'
        });
      }
    });

    return chemicalCycles;
  }

  /**
   * Extraire le final_time du dernier cycle prédit
   * @param {Array} reconstructedRecipe - Recette prédite
   * @returns {number|null} - Final time en secondes, ou null
   */
  extractFinalTime(reconstructedRecipe) {
    if (!reconstructedRecipe || reconstructedRecipe.length === 0) {
      return null;
    }

    const lastCycle = reconstructedRecipe[reconstructedRecipe.length - 1];
    // Le dernier cycle a 3 éléments : [carb, diff, final]
    return lastCycle[2] ? Math.round(lastCycle[2]) : null;
  }

  /**
   * Calculer le cycle thermique à partir de la recette chimique prédite
   * Suit la logique du document "HEAT CYCLE"
   * @param {Array} reconstructedRecipe - Recette prédite [[carb, diff], ..., [carb, diff, final]]
   * @param {Object} options - Options de configuration
   *   - rampUpTime: Temps de montée en température (minutes, défaut: 60)
   *   - treatmentTemp: Température de traitement (°C, défaut: 950)
   *   - quenchTemp: Température de trempe optionnelle (°C, défaut: null)
   *   - coolingTime: Temps de refroidissement si quenchTemp défini (minutes, défaut: 20)
   * @returns {Object} - { thermalCycle, adjustedFinalDiff, totalTimeMinutes }
   */
  calculateThermalCycle(reconstructedRecipe, options = {}) {
    const {
      rampUpTime = 60,
      treatmentTemp = 950,
      quenchTemp = null,
      coolingTime = 20
    } = options;

    if (!reconstructedRecipe || reconstructedRecipe.length === 0) {
      return null;
    }

    // 1. Calcul des temps totaux
    let totalCarbTime = 0;
    let totalIntermediateDiff = 0;
    let finalDiffTime = 0;

    reconstructedRecipe.forEach((cycle, index) => {
      const isLastCycle = index === reconstructedRecipe.length - 1;
      const carbTime = cycle[0] || 0;
      const diffTime = cycle[1] || 0;

      totalCarbTime += carbTime;

      if (!isLastCycle) {
        totalIntermediateDiff += diffTime;
      }

      // Le dernier cycle : la diffusion finale est dans cycle[2] (final_time)
      if (isLastCycle && cycle[2]) {
        finalDiffTime = cycle[2];
      }
    });

    // Temps total brut en secondes
    const totalTimeSeconds = totalCarbTime + totalIntermediateDiff + finalDiffTime;

    // 2. Arrondi à la minute supérieure (multiple de 60s)
    const totalTimeMinutes = Math.ceil(totalTimeSeconds / 60);
    const roundedTotalSeconds = totalTimeMinutes * 60;

    // 3. Ajustement de la diffusion finale pour atteindre le total arrondi
    const adjustedFinalDiffSeconds = roundedTotalSeconds - (totalCarbTime + totalIntermediateDiff);

    // 4. Compensation du refroidissement (si trempe à température plus basse)
    let machineReadyFinalDiff = adjustedFinalDiffSeconds;
    if (quenchTemp && quenchTemp < treatmentTemp) {
      const coolingTimeSeconds = coolingTime * 60;
      machineReadyFinalDiff = adjustedFinalDiffSeconds - coolingTimeSeconds;
    }

    // 5. Génération du cycle thermique
    const thermalCycle = [
      {
        step: 1,
        temperature: treatmentTemp,
        duration: rampUpTime, // en minutes
        note: 'Rampe de montée en température',
        _phase: 'ramp'
      },
      {
        step: 2,
        temperature: treatmentTemp,
        duration: totalTimeMinutes, // en minutes
        note: 'Maintien - Cémentation + Diffusion',
        _phase: 'treatment'
      }
    ];

    // Ajout du refroidissement si nécessaire
    if (quenchTemp && quenchTemp < treatmentTemp) {
      thermalCycle.push({
        step: 3,
        temperature: quenchTemp,
        duration: coolingTime, // en minutes
        note: 'Refroidissement avant trempe',
        _phase: 'cooling'
      });
    }

    return {
      thermalCycle,
      adjustedFinalDiffSeconds,
      machineReadyFinalDiffSeconds: machineReadyFinalDiff,
      totalTimeMinutes,
      totalCarbTime,
      totalIntermediateDiff,
      originalFinalDiffTime: finalDiffTime
    };
  }
}

export default new PredictionService();
