import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useApiSubmission = (
  formData, 
  setFormData, 
  validate, 
  parentId, 
  setLoading, 
  setMessage, 
  onTestCreated, 
  onClose
) => {
  // Préparation des données pour l'API
  const formatDataForApi = () => {
    // Formatage des données pour l'API
    const furnaceData = {
      furnace_type: formData.furnaceData.furnaceType || null,
      heating_cell: formData.furnaceData.heatingCell || null,
      cooling_media: formData.furnaceData.coolingMedia || null,
      furnace_size: formData.furnaceData.furnaceSize || null,
      quench_cell: formData.furnaceData.quenchCell || null
    };
    
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
        }
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
    
    const quenchData = {
      gas_quench: {
        speed_parameters: gasQuenchSpeedData,
        pressure_parameters: gasQuenchPressureData,
        tolerance: {
          min: formData.quenchData.gasToleranceMin || null,
          max: formData.quenchData.gasToleranceMax || null
        }
      },
      oil_quench: {
        speed_parameters: oilQuenchSpeedData,
        temperature: {
          value: formData.quenchData.oilTemperature || null,
          unit: formData.quenchData.oilTempUnit || null
        },
        tolerance: {
          min: formData.quenchData.oilToleranceMin || null,
          max: formData.quenchData.oilToleranceMax || null
        },
        pressure: formData.quenchData.oilPressure || null,
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
    
    return {
      parent_id: parentId,
      name: formData.name,
      location: formData.location || null,
      status: formData.status || null,
      description: formData.description || null,
      mounting_type: formData.mountingType || null,
      position_type: formData.positionType || null,
      process_type: formData.processType || null,
      furnace_data: furnaceData,
      load_data: loadData,
      recipe_data: recipeData,
      quench_data: quenchData
    };
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const testData = formatDataForApi();
      
      const response = await axios.post(`${API_URL}/tests`, testData);
      
      setMessage({
        type: 'success',
        text: 'Test créé avec succès!'
      });
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        location: '',
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
          gasToleranceMin: '',
          gasToleranceMax: '',
          oilQuenchSpeed: [{ step: 1, duration: '', speed: '' }],
          oilTemperature: '',
          oilTempUnit: '',
          oilToleranceMin: '',
          oilToleranceMax: '',
          oilPressure: '',
          oilInertingDelay: '',
          oilInertingDelayUnit: '',
          oilDrippingTime: '',
          oilDrippingTimeUnit: ''
        }
      });
      
      // Notifier le parent
      if (onTestCreated) {
        onTestCreated(response.data);
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la création du test:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Une erreur est survenue lors de la création du test'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formatDataForApi,
    handleSubmit
  };
};

export default useApiSubmission;