import useApiSubmission from '../../../../../hooks/useApiSubmission';
import testService from '../../../../../services/testService';
import i18next from 'i18next';
import { useState } from 'react';

/**
 * Hook spécifique pour gérer les soumissions de tests
 * @param {Object} formData - Données du formulaire de test
 * @param {Function} setFormData - Fonction pour mettre à jour formData
 * @param {Function} validate - Fonction de validation
 * @param {string} parentId - ID de la commande parente
 * @param {Object} test - Test existant (pour le mode édition)
 * @param {Function} setLoading - Fonction pour définir l'état de chargement
 * @param {Function} setMessage - Fonction pour définir les messages
 * @param {Function} onTestCreated - Callback après création * @param {Function} onTestUpdated - Callback après mise à jour
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} fileAssociationCallback - Callback pour associer des fichiers
 * @param {boolean} viewMode - Mode lecture seule
 * @param {Function} flushAllCurveData - Fonction pour flusher les données de courbe avant soumission
 */
const useTestSubmission = (
  formData, 
  setFormData, 
  validate, 
  parentId,
  test,
  setLoading, 
  setMessage, 
  onTestCreated,
  onTestUpdated, 
  onClose,
  fileAssociationCallback,
  viewMode = false,
  flushAllCurveData = null
) => {const defaultFormState = {
    name: '',
    location: '',
    loadNumber: '',
    testDate: '',
    status: '',
    description: '',
    mountingType: '',
    positionType: '',
    processType: '',
    furnaceData: {
      furnaceType: '',
      heatingCell: '',
      coolingMedia: '',
      furnaceSize: '',
      quenchCell: '',
    },
    loadData: {
      length: '',
      width: '',
      height: '',
      sizeUnit: '',
      floorCount: '',
      partCount: '',
      weight: '',
      weightUnit: '',
      loadComments: '',
    },
    recipeData: {
      recipeNumber: '',
      preoxTemp: '',
      preoxTempUnit: '',
      preoxDuration: '',
      preoxDurationUnit: '',
      thermalCycle: [{ step: 1, ramp: 'up', setpoint: '', duration: '' }],
      chemicalCycle: [{ step: 1, time: '', gas: '', debit: '', pressure: '' }],
      waitTime: '',
      waitTimeUnit: '',
      programDuration: '',
      programDurationUnit: '',
      cellTemp: '',
      cellTempUnit: '',
      waitPressure: '',
      waitPressureUnit: '',
    },
    quenchData: {
      gasQuenchSpeed: [{ step: 1, duration: '', speed: '' }],
      gasQuenchPressure: [{ step: 1, duration: '', pressure: '' }],
      oilQuenchSpeed: [{ step: 1, duration: '', speed: '' }],
      oilTemperature: '',
      oilTempUnit: '',
      oilInertingPressure: '',
      oilInertingDelay: '',
      oilInertingDelayUnit: '',
      oilDrippingTime: '',
      oilDrippingTimeUnit: ''
    },    resultsData: {
      results: [
        {
          step: 1,
          description: '',
          samples: [
            {
              step: 1,
              description: '',
              hardnessPoints: [{ location: '', value: '', unit: ''}],
              ecd: { 
                hardnessValue: '', 
                hardnessUnit: '', 
                ecdPoints: [{ position: '', distance: '' }]
              },
              hardnessUnit: 'HV',
              curveData: { points: [] }
            }
          ]
        }
      ]
    }};
  
  // État local pour suivre si une soumission est en cours
  const [loading, setLoadingState] = useState(false);
  
  // Formatage des données pour l'API
  const formatDataForApi = () => {
    // Formatage du four
    const furnaceData = {
      furnace_type: formData.furnaceData.furnaceType || null,
      heating_cell: formData.furnaceData.heatingCell || null,
      cooling_media: formData.furnaceData.coolingMedia || null,
      furnace_size: formData.furnaceData.furnaceSize || null,
      quench_cell: formData.furnaceData.quenchCell || null
    };
    
    // Formatage des données de charge
    const loadData = {
      size: {
        length: {
          value: formData.loadData.length || null,
          unit: formData.loadData.sizeUnit || null
        },
        width: {
          value: formData.loadData.width || null,
          unit: formData.loadData.sizeUnit || null
        },
        height: {
          value: formData.loadData.height || null,
          unit: formData.loadData.sizeUnit || null
        }
      },
      floor_count: formData.loadData.floorCount || null,
      part_count: formData.loadData.partCount || null,
      weight: {
        value: formData.loadData.weight || null,
        unit: formData.loadData.weightUnit || null
      },
      comments: formData.loadData.loadComments || null
    };
    
    // Formatage du cycle thermique
    const thermalCycleData = formData.recipeData.thermalCycle.length > 0 && formData.recipeData.thermalCycle.some(
      cycle => cycle.setpoint || cycle.duration
    ) ? formData.recipeData.thermalCycle.map((cycle, index) => ({
      step: index + 1,
      ramp: cycle.ramp,
      setpoint: cycle.setpoint || null,
      duration: cycle.duration || null
    })) : null;
    
    // Formatage du cycle chimique
    const chemicalCycleData = formData.recipeData.chemicalCycle.length > 0 && formData.recipeData.chemicalCycle.some(
      cycle => cycle.time || cycle.debit1 || cycle.debit2 || cycle.debit3 || cycle.pressure || cycle.turbine === true
    ) ? formData.recipeData.chemicalCycle.map((cycle, index) => {
      // Préparer les gaz pour chaque étape, mais maintenir la structure exacte
      const gases = [];
      
      // Important: préserver les indices exacts des gaz, ne pas réorganiser
      if (formData.recipeData.selectedGas1) {
        gases.push({
          gas: formData.recipeData.selectedGas1,
          debit: cycle.debit1 || null,
          index: 1 // On ajoute un indice pour pouvoir reconstruire correctement
        });
      }
      
      if (formData.recipeData.selectedGas2) {
        gases.push({
          gas: formData.recipeData.selectedGas2,
          debit: cycle.debit2 || null,
          index: 2 // On ajoute un indice pour pouvoir reconstruire correctement
        });
      }
      
      if (formData.recipeData.selectedGas3) {
        gases.push({
          gas: formData.recipeData.selectedGas3,
          debit: cycle.debit3 || null,
          index: 3 // On ajoute un indice pour pouvoir reconstruire correctement
        });
      }
      
      return {
        step: index + 1,
        time: cycle.time || null,
        gases: gases.length > 0 ? gases : null,
        pressure: cycle.pressure || null,
        turbine: cycle.turbine === true
      };
    }) : null;
    
    // Formatage des données de recette
    const recipeData = {
      number: formData.recipeData.recipeNumber || null,
      
      selected_gas1: formData.recipeData.selectedGas1 || null,
      selected_gas2: formData.recipeData.selectedGas2 || null,
      selected_gas3: formData.recipeData.selectedGas3 || null,

      preox: {
        temperature: {
          value: formData.recipeData.preoxTemp || null,
          unit: formData.recipeData.preoxTempUnit || null
        },
        duration: {
          value: formData.recipeData.preoxDuration || null,
          unit: formData.recipeData.preoxDurationUnit || null
        },
        media: formData.recipeData.preoxMedia || null
      },
      thermal_cycle: thermalCycleData,
      chemical_cycle: chemicalCycleData,      wait_time: {
        value: formData.recipeData.waitTime || null,
        unit: 'minutes' // Stocker directement en minutes
      },
      cell_temp: {
        value: formData.recipeData.cellTemp || null,
        unit: formData.recipeData.cellTempUnit || null
      },
      wait_pressure: {
        value: formData.recipeData.waitPressure || null,
        unit: formData.recipeData.waitPressureUnit || null
      }
    };
    
    // Formatage des données de trempe au gaz
    const gasQuenchSpeedData = formData.quenchData.gasQuenchSpeed.length > 0 && formData.quenchData.gasQuenchSpeed.some(
      speed => speed.duration || speed.speed
    ) ? formData.quenchData.gasQuenchSpeed.map((speed, index) => ({
      step: index + 1,
      duration: speed.duration || null,
      speed: speed.speed || null
    })) : null;
    
    // Formatage des données de pression de trempe au gaz
    const gasQuenchPressureData = formData.quenchData.gasQuenchPressure.length > 0 && formData.quenchData.gasQuenchPressure.some(
      pressure => pressure.duration || pressure.pressure
    ) ? formData.quenchData.gasQuenchPressure.map((pressure, index) => ({
      step: index + 1,
      duration: pressure.duration || null,
      pressure: pressure.pressure || null
    })) : null;
    
    // Formatage des données de trempe à l'huile
    const oilQuenchSpeedData = formData.quenchData.oilQuenchSpeed.length > 0 && formData.quenchData.oilQuenchSpeed.some(
      speed => speed.duration || speed.speed
    ) ? formData.quenchData.oilQuenchSpeed.map((speed, index) => ({
      step: index + 1,
      duration: speed.duration || null,
      speed: speed.speed || null
    })) : null;
    
    // Formatage des données de trempe
    const quenchData = {
      gas_quench: {
        speed_parameters: gasQuenchSpeedData,
        pressure_parameters: gasQuenchPressureData
      },
      oil_quench: {
        speed_parameters: oilQuenchSpeedData,
        temperature: {
          value: formData.quenchData.oilTemperature || null,
          unit: formData.quenchData.oilTempUnit || null
        },
        pressure: formData.quenchData.oilInertingPressure || null,
        inerting_delay: {
          value: formData.quenchData.oilInertingDelay || null,
          unit: formData.quenchData.oilInertingDelayUnit || null
        },
        dripping_time: {
          value: formData.quenchData.oilDrippingTime || null,
          unit: formData.quenchData.oilDrippingTimeUnit || null
        }
      }
    };
      // Formatage des données de résultat - NOUVELLE STRUCTURE AVEC ÉCHANTILLONS
    const resultsData = formData.resultsData && formData.resultsData.results?.length > 0 && 
    formData.resultsData.results.some(result => 
      result.description || 
      (result.samples && result.samples.some(sample =>
        sample.description ||
        (sample.hardnessPoints && sample.hardnessPoints.some(p => p.value || p.location || p.unit)) ||
        (sample.ecd && sample.ecd.ecdPoints && sample.ecd.ecdPoints.some(p => p.distance || p.position)) ||
        (sample.curveData && (
          (sample.curveData.points && sample.curveData.points.length > 0) ||
          (sample.curveData.distances && sample.curveData.series && 
           sample.curveData.distances.length > 0 && sample.curveData.series.length > 0)
        ))
      ))
    ) ? {
      results: formData.resultsData.results.map(result => {
        // Formatage des échantillons
        const samples = result.samples && result.samples.length > 0 ? 
          result.samples.map((sample, sampleIdx) => {
            // Formatage des points de dureté
            const hardnessPoints = sample.hardnessPoints?.length > 0 && 
              sample.hardnessPoints.some(p => p.value || p.location || p.unit) ? 
              sample.hardnessPoints.map(point => ({
                location: point.location || null,
                value: point.value || null,
                unit: point.unit || null
              })) : null;
            
            // Formatage des données ECD
            const ecdData = sample.ecd ? {
              hardness_value: sample.ecd.hardnessValue || null,
              hardness_unit: sample.ecd.hardnessUnit || null,
              positions: Array.isArray(sample.ecd.ecdPoints) && sample.ecd.ecdPoints.length > 0 ? 
                sample.ecd.ecdPoints.map(point => ({
                  position: point.position || null,
                  distance: point.distance || null
                })) : null
            } : null;
            
            // Formatage des données de courbe
            // NOUVEAU : Enregistrer directement au format moderne {distances, series}
            let curveData = null;
            
            if (sample.curveData) {
              // Nouveau format avec distances et series - GARDER TEL QUEL
              if (sample.curveData.distances && sample.curveData.series) {
                // Nettoyer les données : convertir les valeurs vides en 0
                const cleanedSeries = sample.curveData.series.map(serie => ({
                  name: serie.name || '',
                  values: serie.values.map(value => 
                    (value === '' || value === null || value === undefined) ? 0 : parseFloat(value) || 0
                  )
                }));
                
                curveData = {
                  distances: sample.curveData.distances,
                  series: cleanedSeries
                };
              }
              // Ancien format avec points - CONVERTIR vers le nouveau format
              else if (sample.curveData.points && sample.curveData.points.length > 0) {
                console.log('🔄 Conversion ancien format vers nouveau format pour sauvegarde');
                
                // Extraire les distances uniques
                const distances = [...new Set(sample.curveData.points.map(p => p.distance))].sort((a, b) => a - b);
                const seriesNames = new Set();
                
                // Découvrir tous les noms de séries
                sample.curveData.points.forEach(point => {
                  Object.keys(point).forEach(key => {
                    if (key !== 'distance') {
                      seriesNames.add(key);
                    }
                  });
                });
                
                // Créer les séries
                const series = Array.from(seriesNames).map(seriesName => ({
                  name: seriesName,
                  values: distances.map(distance => {
                    const point = sample.curveData.points.find(p => p.distance === distance);
                    const value = point && point[seriesName] !== undefined ? point[seriesName] : 0;
                    return parseFloat(value) || 0;
                  })
                }));
                
                curveData = { distances, series };
              }
            }
            
            // DEBUG LOG pour visualiser la donnée courbe importée et mappée
            if (process.env.NODE_ENV === 'development') {
              console.log(`=== FORMATAGE SOUMISSION [Result ${result.step}][Sample ${sample.step}] ===`);
              console.log('sample.curveData:', sample.curveData);
              
              if (sample.curveData?.distances && sample.curveData?.series) {
                console.log('Format détecté: NOUVEAU (distances + series)');
                console.log('Distances:', sample.curveData.distances?.length || 0);
                console.log('Séries:', sample.curveData.series?.length || 0);
                if (sample.curveData.series?.length > 0) {
                  console.log('Première série:', sample.curveData.series[0]);
                }
              } else if (sample.curveData?.points) {
                console.log('Format détecté: ANCIEN (points)');
                console.log('Points dans curveData:', sample.curveData.points?.length || 0);
                if (sample.curveData.points?.length > 0) {
                  console.log('Premier point curveData:', sample.curveData.points[0]);
                  console.log('Clés premier point:', Object.keys(sample.curveData.points[0]));
                }
              }
              
              console.log('Données formatées pour API (curve_data):', curveData);
              if (curveData?.distances && curveData?.series) {
                console.log('✅ Format MODERNE pour API - distances + series:', {
                  distancesCount: curveData.distances.length,
                  seriesCount: curveData.series.length,
                  firstDistance: curveData.distances[0],
                  firstSeries: curveData.series[0]
                });
              } else if (curveData?.points?.length > 0) {
                console.log('⚠️ Format ANCIEN pour API - points (rétrocompatibilité):', curveData.points[0]);
              }
            }
            return {
              step: sample.step,
              description: sample.description || null,
              hardness_points: hardnessPoints,
              ecd: ecdData,
              curve_data: curveData // snake_case pour l'API
            };
          }) : null;        return {
          step: result.step,
          description: result.description || null,
          samples: samples
        };
      })
    } : null;
    
    return {
      parent_id: parentId,
      name: formData.name,
      location: formData.location || null,
      status: formData.status || null,
      load_number: formData.loadNumber || null,
      test_date: formData.testDate || null,
      description: formData.description || null,
      mounting_type: formData.mountingType || null,
      position_type: formData.positionType || null,
      process_type: formData.processType || null,
      preox_media: formData.preoxMedia || null,
      furnace_data: furnaceData,
      load_data: loadData,
      recipe_data: recipeData,
      quench_data: quenchData,
      results_data: resultsData
    };
    
    // DEBUG LOG pour vérifier les données finales envoyées à l'API
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 DONNEES FINALES POUR API (useTestSubmission):', {
        hasResultsData: !!resultsData,
        resultsDataStructure: resultsData ? {
          hasResults: !!resultsData.results,
          resultsCount: resultsData.results?.length || 0
        } : null
      });
      
      if (resultsData?.results) {
        resultsData.results.forEach((result, rIndex) => {
          console.log(`📋 Result ${rIndex}:`, {
            step: result.step,
            samplesCount: result.samples?.length || 0
          });
          
          if (result.samples) {
            result.samples.forEach((sample, sIndex) => {
              console.log(`🧪 Sample [${rIndex}][${sIndex}]:`, {
                step: sample.step,
                hasCurveData: !!sample.curve_data,
                curveDataFormat: sample.curve_data ? 
                  (sample.curve_data.distances && sample.curve_data.series ? 
                    'NOUVEAU (distances+series)' : 
                    sample.curve_data.points ? 'ancien (points)' : 'format inconnu'
                  ) : 'pas de curveData'
              });
              
              if (sample.curve_data?.distances && sample.curve_data?.series) {
                console.log(`📊 Données MODERNES dans curve_data [${rIndex}][${sIndex}]:`, {
                  distancesCount: sample.curve_data.distances.length,
                  seriesCount: sample.curve_data.series.length,
                  firstDistance: sample.curve_data.distances[0],
                  firstSeries: sample.curve_data.series[0]
                });
              } else if (sample.curve_data?.points) {
                console.log(`📊 Points dans curve_data [${rIndex}][${sIndex}]:`, {
                  pointsCount: sample.curve_data.points.length,
                  firstPoint: sample.curve_data.points[0],
                  pointKeys: sample.curve_data.points.length > 0 ? Object.keys(sample.curve_data.points[0]) : []
                });
              }
            });
          }
        });
      }
    }
  };
  
  // Wrap le callback d'association de fichiers pour le faire fonctionner avec useApiSubmission
  const wrappedFileAssociationCallback = fileAssociationCallback ? 
    async (nodeId) => {
      if (typeof fileAssociationCallback === 'function') {
        console.log(`Associant les fichiers au test ${nodeId}...`);
        try {
          const result = await fileAssociationCallback(nodeId);
          console.log(`Résultat de l'association de fichiers:`, result);
          return result;
        } catch (error) {
          console.error(`Erreur lors de l'association de fichiers:`, error);
          return false;
        }
      }      return true;
    } : null;
  
  const handleSubmit = async (e, isCloseAfterSave = false) => {
    if (e) {
      e.preventDefault();
    }

    console.log('=== DÉBUT SOUMISSION TEST ===');
    
    // ÉTAPE 1 : FLUSHER LES DONNÉES DE COURBE AVANT VALIDATION
    if (flushAllCurveData && typeof flushAllCurveData === 'function') {
      console.log('Flushing curve data before submission...');
      try {
        const flushed = flushAllCurveData();
        if (flushed) {
          console.log('Curve data flushed successfully');
          // Délai pour permettre la mise à jour du formData
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          console.warn('Failed to flush curve data');
        }
      } catch (error) {
        console.error('Error flushing curve data:', error);
      }
    } else {
      console.log('No curve data flush function provided');
    }

    // Empêcher les soumissions multiples
    if (loading) return;
    
    // Valider le formulaire
    const validationResults = validate(formData);

    // DEBUG: Afficher la structure complète de formData juste avant soumission
    console.log('[DEBUG][handleSubmit] formData juste avant soumission:', JSON.parse(JSON.stringify(formData)));

    if (!validationResults.isValid) {
      console.log("Validation errors:", validationResults.errors);
      return;
    }
    
    setLoading(true);
      try {
      // Préparer les données pour l'API
      const testData = formatDataForApi();
      
      let response;
      
      if (test) {
        // Mode édition
        response = await testService.updateTest(test.id, testData);
        console.log("Test updated:", response);
        
        // Associer les fichiers temporaires au nœud
        if (fileAssociationCallback) {
          const associationResult = await fileAssociationCallback(test.id);
          console.log("File association result:", associationResult);
        }
        
        setMessage({
          type: 'success',
          text: i18next.t('api.success.updated', { entityType: i18next.t('tests.title') })
        });
        
        // Appeler le callback de mise à jour si fourni
        if (onTestUpdated) {
          onTestUpdated(response.data);
        }
        
        // Si c'est une sauvegarde avant fermeture, fermer le formulaire
        if (isCloseAfterSave && onClose) {
          onClose();
        }      } else {
        // Mode création
        response = await testService.createTest(testData);
        console.log("Test created:", response);
        
        // Réinitialiser le formulaire
        setFormData(defaultFormState);
        
        setMessage({
          type: 'success',
          text: i18next.t('api.success.created', { entityType: i18next.t('tests.title') })
        });
        
        // Associer les fichiers temporaires au nœud nouvellement créé
        if (fileAssociationCallback && response.data && response.data.id) {
          const associationResult = await fileAssociationCallback(response.data.id);
          console.log("File association result:", associationResult);
        }
        
        // Appeler le callback de création si fourni
        if (onTestCreated) {
          onTestCreated(response.data);
        }
        
        // Fermer le formulaire après création réussie même sans isCloseAfterSave
        if (onClose) {
          onClose();
        }
      }    } catch (error) {
      console.error("Error submitting test:", error);
      setMessage({
        type: 'danger',
        text: i18next.t('api.error.' + (test ? 'update' : 'create'), { entityType: i18next.t('tests.title') })
      });
      
      // If available, show more specific error message from the API
      if (error.response && error.response.data && error.response.data.message) {
        setMessage({
          type: 'danger',
          text: error.response.data.message
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return useApiSubmission({
    formData,
    setFormData,
    validate,
    entity: test,
    setLoading,
    setMessage,
    onCreated: onTestCreated,
    onUpdated: onTestUpdated,
    onClose,
    formatDataForApi,
    customApiService: {
      create: testService.createTest,      update: testService.updateTest
    },    entityType: 'Test',
    initialFormState: defaultFormState,
    fileAssociationCallback: wrappedFileAssociationCallback,  // Utiliser le wrapper ici
    parentId,
    viewMode
  });
};

export default useTestSubmission;