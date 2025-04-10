import useApiSubmission from '../../../../../hooks/useApiSubmission';
import testService from '../../../../../services/testService';

/**
 * Hook spécifique pour gérer les soumissions de tests
 * @param {Object} formData - Données du formulaire de test
 * @param {Function} setFormData - Fonction pour mettre à jour formData
 * @param {Function} validate - Fonction de validation
 * @param {string} parentId - ID de la commande parente
 * @param {Object} test - Test existant (pour le mode édition)
 * @param {Function} setLoading - Fonction pour définir l'état de chargement
 * @param {Function} setMessage - Fonction pour définir les messages
 * @param {Function} onTestCreated - Callback après création
 * @param {Function} onTestUpdated - Callback après mise à jour
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} fileAssociationCallback - Callback pour associer des fichiers
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
  fileAssociationCallback
) => {
  const initialFormState = {
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
    },
    resultsData: {
      results: [
        {
          step: 1,
          description: '',
          hardnessPoints: [{ location: '', value: '', unit: ''}],
          ecd: { hardnessValue: '', hardnessUnit: '', toothFlank: { distance: '', unit: '' }, toothRoot: { distance: '', unit: '' }},
          comment: '',
          hardnessUnit: 'HV', curveData: { points: [] }
        }
      ]
    }
  };
  
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
      cycle => cycle.time || cycle.gas || cycle.debit || cycle.pressure
    ) ? formData.recipeData.chemicalCycle.map((cycle, index) => ({
      step: index + 1,
      time: cycle.time || null,
      gas: cycle.gas || null,
      debit: cycle.debit || null,
      pressure: cycle.pressure || null
    })) : null;
    
    // Formatage des données de recette
    const recipeData = {
      number: formData.recipeData.recipeNumber || null,
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
      chemical_cycle: chemicalCycleData,
      wait_time: {
        value: formData.recipeData.waitTime || null,
        unit: formData.recipeData.waitTimeUnit || null
      },
      program_duration: {
        value: formData.recipeData.programDuration || null,
        unit: formData.recipeData.programDurationUnit || null
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
    
    // Formatage des données de résultat
    const resultsData = formData.resultsData && formData.resultsData.results?.length > 0 && 
    formData.resultsData.results.some(result => 
      result.description || 
      (result.hardnessPoints && result.hardnessPoints.some(p => p.value || p.location || p.unit)) ||
      (result.ecd && (result.ecd.toothFlank?.distance || result.ecd.toothRoot?.distance)) ||
      (result.curveData && result.curveData.points && result.curveData.points.length > 0) ||
      result.comment
    ) ? {
      results: formData.resultsData.results.map(result => {
        // Formatage des points de dureté
        const hardnessPoints = result.hardnessPoints?.length > 0 && 
          result.hardnessPoints.some(p => p.value || p.location || p.unit) ? 
          result.hardnessPoints.map(point => ({
            location: point.location || null,
            value: point.value || null,
            unit: point.unit || null
          })) : null;
        
        // Formatage des données ECD
        const ecdData = result.ecd ? {
          hardness_value: result.ecd.hardnessValue || null,
          hardness_unit: result.ecd.hardnessUnit || null,
          tooth_flank: {
            distance: result.ecd.toothFlank?.distance || null,
            unit: result.ecd.toothFlank?.unit || null
          },
          tooth_root: {
            distance: result.ecd.toothRoot?.distance || null,
            unit: result.ecd.toothRoot?.unit || null
          }
        } : null;
        
        // Formatage des données de courbe
        const curveData = result.curveData && result.curveData.points && result.curveData.points.length > 0 ? {
          points: result.curveData.points.map(point => ({
            distance: point.distance || null,
            flank_hardness: point.flankHardness || null,
            root_hardness: point.rootHardness || null
          }))
        } : null;
        
        return {
          step: result.step,
          description: result.description || null,
          hardness_points: hardnessPoints,
          ecd: ecdData,
          curve_data: curveData,
          hardness_unit: result.hardnessUnit || null,
          comment: result.comment || null
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
      furnace_data: furnaceData,
      load_data: loadData,
      recipe_data: recipeData,
      quench_data: quenchData,
      results_data: resultsData
    };
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
      create: testService.createTest,
      update: testService.updateTest
    },
    entityType: 'Test',
    initialFormState,
    fileAssociationCallback,
    parentId
  });
};

export default useTestSubmission;