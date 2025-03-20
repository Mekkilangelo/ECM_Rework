import { useState, useEffect } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import enumService from '../../../../services/enumService';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useTestForm = (onClose, onTestCreated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.partId;
  
  // État du formulaire
  const [formData, setFormData] = useState({
    // Informations de base
    name: '',
    location: '',
    status: '',
    description: '',
    
    // Types de test
    mountingType: '',
    positionType: '',
    processType: '',
    
    // Données du four
    furnaceType: '',
    heatingCell: '',
    coolingMedia: '',
    furnaceSize: '',
    quenchCell: '',
    
    // Données de charge
    length: '',
    width: '',
    height: '',
    sizeUnit: '',
    floorCount: '',
    partCount: '',
    weight: '',
    weightUnit: '',
    loadComments: '',
    
    // Données de recette
    recipeNumber: '',
    
    // Préoxydation
    preoxTemp: '',
    preoxTempUnit: '',
    preoxDuration: '',
    preoxDurationUnit: '',
    
    // Cycle thermique (tableau dynamique)
    thermalCycle: [
      {
        step: 1,
        ramp: 'up',
        setpoint: '',
        duration: ''
      }
    ],
    
    // Cycle chimique (tableau dynamique)
    chemicalCycle: [
      {
        step: 1,
        time: '',
        gas: '',
        debit: '',
        pressure: ''
      }
    ],
    
    // Autres paramètres de recette
    waitTime: '',
    waitTimeUnit: '',
    programDuration: '',
    programDurationUnit: '',
    cellTemp: '',
    cellTempUnit: '',
    waitPressure: '',
    waitPressureUnit: '',
    
    // Trempe au gaz (tableaux dynamiques)
    gasQuenchSpeed: [
      {
        step: 1,
        duration: '',
        speed: ''
      }
    ],
    gasQuenchPressure: [
      {
        step: 1,
        duration: '',
        pressure: ''
      }
    ],
    gasToleranceMin: '',
    gasToleranceMax: '',
    
    // Trempe à l'huile (tableau dynamique)
    oilQuenchSpeed: [
      {
        step: 1,
        duration: '',
        speed: ''
      }
    ],
    oilTemperature: '',
    oilTempUnit: '',
    oilToleranceMin: '',
    oilToleranceMax: '',
    oilPressure: '',
    oilInertingDelay: '',
    oilInertingDelayUnit: '',
    oilDrippingTime: '',
    oilDrippingTimeUnit: ''
  });
  
  // États pour les options des select
  const [locationOptions, setLocationOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [mountingTypeOptions, setMountingTypeOptions] = useState([]);
  const [positionTypeOptions, setPositionTypeOptions] = useState([]);
  const [processTypeOptions, setProcessTypeOptions] = useState([]);
  const [furnaceTypeOptions, setFurnaceTypeOptions] = useState([]);
  const [heatingCellOptions, setHeatingCellOptions] = useState([]);
  const [coolingMediaOptions, setCoolingMediaOptions] = useState([]);
  const [furnaceSizeOptions, setFurnaceSizeOptions] = useState([]);
  const [quenchCellOptions, setQuenchCellOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [gasOptions] = useState([
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' }
  ]);
  const [rampOptions] = useState([
    { value: 'up', label: 'Ramp Up', icon: 'fa-arrow-up' },
    { value: 'down', label: 'Ramp Down', icon: 'fa-arrow-down' },
    { value: 'continue', label: 'Continue', icon: 'fa-arrow-right' }
  ]);
  
  // États pour la gestion des erreurs et du chargement
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Fonctions utilitaires pour les options de select
  const getLengthUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'length');
  };
  
  const getWeightUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'weight');
  };
  
  const getTimeUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'time');
  };
  
  const getTemperatureUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'temperature');
  };
  
  const getPressureUnitOptions = () => {
    return unitOptions.filter(unit => unit.type === 'pressure');
  };
  
  const getSelectedOption = (options, value) => {
    if (!options || !Array.isArray(options)) {
      return null;
    }
    
    if (!value) {
      return null;
    }
    
    return options.find(option => option.value === value) || null;
  };
  
  // Style pour les composants Select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#ced4da',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#80bdff'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    })
  };
  
  // Gestionnaires d'événements
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleSelectChange = (selectedOption, { name }) => {
    // Handle nested properties (with dot notation)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: selectedOption ? selectedOption.value : null
        }
      }));
    } else {
      // Handle root level properties (current implementation)
      setFormData(prevData => ({
        ...prevData,
        [name]: selectedOption ? selectedOption.value : null
      }));
    }
  };
  
  // Gestion des tableaux dynamiques
  const handleThermalCycleChange = (index, field, value) => {
    const updatedThermalCycle = [...formData.thermalCycle];
    updatedThermalCycle[index] = { ...updatedThermalCycle[index], [field]: value };
    setFormData(prev => ({ ...prev, thermalCycle: updatedThermalCycle }));
  };
  
  const addThermalCycleStep = () => {
    const newStep = {
      step: formData.thermalCycle.length + 1,
      ramp: 'up',
      setpoint: '',
      duration: ''
    };
    setFormData(prev => ({
      ...prev,
      thermalCycle: [...prev.thermalCycle, newStep]
    }));
  };
  
  const removeThermalCycleStep = (index) => {
    if (formData.thermalCycle.length > 1) {
      const updatedThermalCycle = formData.thermalCycle.filter((_, i) => i !== index);
      // Recalculate steps
      updatedThermalCycle.forEach((item, i) => {
        item.step = i + 1;
      });
      setFormData(prev => ({ ...prev, thermalCycle: updatedThermalCycle }));
    }
  };
  
  const handleChemicalCycleChange = (index, field, value) => {
    const updatedChemicalCycle = [...formData.chemicalCycle];
    updatedChemicalCycle[index] = { ...updatedChemicalCycle[index], [field]: value };
    setFormData(prev => ({ ...prev, chemicalCycle: updatedChemicalCycle }));
  };
  
  const addChemicalCycleStep = () => {
    const newStep = {
      step: formData.chemicalCycle.length + 1,
      time: '',
      gas: '',
      debit: '',
      pressure: ''
    };
    setFormData(prev => ({
      ...prev,
      chemicalCycle: [...prev.chemicalCycle, newStep]
    }));
  };
  
  const removeChemicalCycleStep = (index) => {
    if (formData.chemicalCycle.length > 1) {
      const updatedChemicalCycle = formData.chemicalCycle.filter((_, i) => i !== index);
      // Recalculate steps
      updatedChemicalCycle.forEach((item, i) => {
        item.step = i + 1;
      });
      setFormData(prev => ({ ...prev, chemicalCycle: updatedChemicalCycle }));
    }
  };
  
  const handleGasQuenchSpeedChange = (index, field, value) => {
    const updatedGasQuenchSpeed = [...formData.gasQuenchSpeed];
    updatedGasQuenchSpeed[index] = { ...updatedGasQuenchSpeed[index], [field]: value };
    setFormData(prev => ({ ...prev, gasQuenchSpeed: updatedGasQuenchSpeed }));
  };
  
  const addGasQuenchSpeedStep = () => {
    const newStep = {
      step: formData.gasQuenchSpeed.length + 1,
      duration: '',
      speed: ''
    };
    setFormData(prev => ({
      ...prev,
      gasQuenchSpeed: [...prev.gasQuenchSpeed, newStep]
    }));
  };
  
  const removeGasQuenchSpeedStep = (index) => {
    if (formData.gasQuenchSpeed.length > 1) {
      const updatedGasQuenchSpeed = formData.gasQuenchSpeed.filter((_, i) => i !== index);
      // Recalculate steps
      updatedGasQuenchSpeed.forEach((item, i) => {
        item.step = i + 1;
      });
      setFormData(prev => ({ ...prev, gasQuenchSpeed: updatedGasQuenchSpeed }));
    }
  };
  
  const handleGasQuenchPressureChange = (index, field, value) => {
    const updatedGasQuenchPressure = [...formData.gasQuenchPressure];
    updatedGasQuenchPressure[index] = { ...updatedGasQuenchPressure[index], [field]: value };
    setFormData(prev => ({ ...prev, gasQuenchPressure: updatedGasQuenchPressure }));
  };
  
  const addGasQuenchPressureStep = () => {
    const newStep = {
      step: formData.gasQuenchPressure.length + 1,
      duration: '',
      pressure: ''
    };
    setFormData(prev => ({
      ...prev,
      gasQuenchPressure: [...prev.gasQuenchPressure, newStep]
    }));
  };
  
  const removeGasQuenchPressureStep = (index) => {
    if (formData.gasQuenchPressure.length > 1) {
      const updatedGasQuenchPressure = formData.gasQuenchPressure.filter((_, i) => i !== index);
      // Recalculate steps
      updatedGasQuenchPressure.forEach((item, i) => {
        item.step = i + 1;
      });
      setFormData(prev => ({ ...prev, gasQuenchPressure: updatedGasQuenchPressure }));
    }
  };
  
  const handleOilQuenchSpeedChange = (index, field, value) => {
    const updatedOilQuenchSpeed = [...formData.oilQuenchSpeed];
    updatedOilQuenchSpeed[index] = { ...updatedOilQuenchSpeed[index], [field]: value };
    setFormData(prev => ({ ...prev, oilQuenchSpeed: updatedOilQuenchSpeed }));
  };
  
  const addOilQuenchSpeedStep = () => {
    const newStep = {
      step: formData.oilQuenchSpeed.length + 1,
      duration: '',
      speed: ''
    };
    setFormData(prev => ({
      ...prev,
      oilQuenchSpeed: [...prev.oilQuenchSpeed, newStep]
    }));
  };
  
  const removeOilQuenchSpeedStep = (index) => {
    if (formData.oilQuenchSpeed.length > 1) {
      const updatedOilQuenchSpeed = formData.oilQuenchSpeed.filter((_, i) => i !== index);
      // Recalculate steps
      updatedOilQuenchSpeed.forEach((item, i) => {
        item.step = i + 1;
      });
      setFormData(prev => ({ ...prev, oilQuenchSpeed: updatedOilQuenchSpeed }));
    }
  };
  
  // Validation du formulaire
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!parentId) newErrors.parent = 'Commande parente non identifiée';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Préparation des données pour l'API
  const formatDataForApi = () => {
    // Formatage des données pour l'API
    const furnaceData = {
      furnace_type: formData.furnaceType || null,
      heating_cell: formData.heatingCell || null,
      cooling_media: formData.coolingMedia || null,
      furnace_size: formData.furnaceSize || null,
      quench_cell: formData.quenchCell || null
    };
    
    const loadData = {
      size: {
        length: {
          value: formData.length || null,
          unit: formData.sizeUnit || null
        },
        width: {
          value: formData.width || null,
          unit: formData.sizeUnit || null
        },
        height: {
          value: formData.height || null,
          unit: formData.sizeUnit || null
        }
      },
      floor_count: formData.floorCount || null,
      part_count: formData.partCount || null,
      weight: {
        value: formData.weight || null,
        unit: formData.weightUnit || null
      },
      comments: formData.loadComments || null
    };
    
    // Formatage du cycle thermique
    const thermalCycleData = formData.thermalCycle.length > 0 && formData.thermalCycle.some(
      cycle => cycle.setpoint || cycle.duration
    ) ? formData.thermalCycle.map((cycle, index) => ({
      step: index + 1,
      ramp: cycle.ramp,
      setpoint: cycle.setpoint || null,
      duration: cycle.duration || null
    })) : null;
    
    // Formatage du cycle chimique
    const chemicalCycleData = formData.chemicalCycle.length > 0 && formData.chemicalCycle.some(
      cycle => cycle.time || cycle.gas || cycle.debit || cycle.pressure
    ) ? formData.chemicalCycle.map((cycle, index) => ({
      step: index + 1,
      time: cycle.time || null,
      gas: cycle.gas || null,
      debit: cycle.debit || null,
      pressure: cycle.pressure || null
    })) : null;
    
    const recipeData = {
      number: formData.recipeNumber || null,
      preox: {
        temperature: {
          value: formData.preoxTemp || null,
          unit: formData.preoxTempUnit || null
        },
        duration: {
          value: formData.preoxDuration || null,
          unit: formData.preoxDurationUnit || null
        }
      },
      thermal_cycle: thermalCycleData,
      chemical_cycle: chemicalCycleData,
      wait_time: {
        value: formData.waitTime || null,
        unit: formData.waitTimeUnit || null
      },
      program_duration: {
        value: formData.programDuration || null,
        unit: formData.programDurationUnit || null
      },
      cell_temp: {
        value: formData.cellTemp || null,
        unit: formData.cellTempUnit || null
      },
      wait_pressure: {
        value: formData.waitPressure || null,
        unit: formData.waitPressureUnit || null
      }
    };
    
    // Formatage des données de trempe au gaz
    const gasQuenchSpeedData = formData.gasQuenchSpeed.length > 0 && formData.gasQuenchSpeed.some(
      speed => speed.duration || speed.speed
    ) ? formData.gasQuenchSpeed.map((speed, index) => ({
      step: index + 1,
      duration: speed.duration || null,
      speed: speed.speed || null
    })) : null;
    
    // Formatage des données de pression de trempe au gaz
    const gasQuenchPressureData = formData.gasQuenchPressure.length > 0 && formData.gasQuenchPressure.some(
      pressure => pressure.duration || pressure.pressure
    ) ? formData.gasQuenchPressure.map((pressure, index) => ({
      step: index + 1,
      duration: pressure.duration || null,
      pressure: pressure.pressure || null
    })) : null;
    
    // Formatage des données de trempe à l'huile
    const oilQuenchSpeedData = formData.oilQuenchSpeed.length > 0 && formData.oilQuenchSpeed.some(
      speed => speed.duration || speed.speed
    ) ? formData.oilQuenchSpeed.map((speed, index) => ({
      step: index + 1,
      duration: speed.duration || null,
      speed: speed.speed || null
    })) : null;
    
    const quenchData = {
      gas_quench: {
        speed_parameters: gasQuenchSpeedData,
        pressure_parameters: gasQuenchPressureData,
        tolerance: {
          min: formData.gasToleranceMin || null,
          max: formData.gasToleranceMax || null
        }
      },
      oil_quench: {
        speed_parameters: oilQuenchSpeedData,
        temperature: {
          value: formData.oilTemperature || null,
          unit: formData.oilTempUnit || null
        },
        tolerance: {
          min: formData.oilToleranceMin || null,
          max: formData.oilToleranceMax || null
        },
        pressure: formData.oilPressure || null,
        inerting_delay: {
          value: formData.oilInertingDelay || null,
          unit: formData.oilInertingDelayUnit || null
        },
        dripping_time: {
          value: formData.oilDrippingTime || null,
          unit: formData.oilDrippingTimeUnit || null
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
        furnaceType: '',
        heatingCell: '',
        coolingMedia: '',
        furnaceSize: '',
        quenchCell: '',
        length: '',
        width: '',
        height: '',
        sizeUnit: '',
        floorCount: '',
        partCount: '',
        weight: '',
        weightUnit: '',
        loadComments: '',
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
  
  // Charger les options pour les selects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Récupérer les options d'énumération pour les tests
        try {
          // Récupérer les options de localisation
          const locationResponse = await enumService.getEnumValues('tests', 'location');
          if (locationResponse.data && locationResponse.data.values) {
            const locations = locationResponse.data.values || [];
            setLocationOptions(locations.map(location => ({ 
              value: location, 
              label: location 
            })));
          }
          
          // Récupérer les options de statut
          const statusResponse = await enumService.getEnumValues('tests', 'status');
          if (statusResponse.data && statusResponse.data.values) {
            const statuses = statusResponse.data.values || [];
            setStatusOptions(statuses.map(status => ({ 
              value: status, 
              label: status 
            })));
          }
          
          // Récupérer les options de type de montage
          const mountingTypeResponse = await enumService.getEnumValues('tests', 'mounting_type');
          if (mountingTypeResponse.data && mountingTypeResponse.data.values) {
            const mountingTypes = mountingTypeResponse.data.values || [];
            setMountingTypeOptions(mountingTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
          
          // Récupérer les options de type de position
          const positionTypeResponse = await enumService.getEnumValues('tests', 'position_type');
          if (positionTypeResponse.data && positionTypeResponse.data.values) {
            const positionTypes = positionTypeResponse.data.values || [];
            setPositionTypeOptions(positionTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
          
          // Récupérer les options de type de processus
          const processTypeResponse = await enumService.getEnumValues('tests', 'process_type');
          if (processTypeResponse.data && processTypeResponse.data.values) {
            const processTypes = processTypeResponse.data.values || [];
            setProcessTypeOptions(processTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des options de test:', error);
        }
        
        // Récupérer les options d'énumération pour les fours
        try {
          // Récupérer les options de type de four
          const furnaceTypeResponse = await enumService.getEnumValues('furnaces', 'furnace_type');
          if (furnaceTypeResponse.data && furnaceTypeResponse.data.values) {
            const furnaceTypes = furnaceTypeResponse.data.values || [];
            setFurnaceTypeOptions(furnaceTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
          
          // Récupérer les options de cellule de chauffage
          const heatingCellResponse = await enumService.getEnumValues('furnaces', 'heating_cell_type');
          if (heatingCellResponse.data && heatingCellResponse.data.values) {
            const heatingCells = heatingCellResponse.data.values || [];
            setHeatingCellOptions(heatingCells.map(cell => ({ 
              value: cell, 
              label: cell 
            })));
          }
          
          // Récupérer les options de média de refroidissement
          const coolingMediaResponse = await enumService.getEnumValues('furnaces', 'cooling_media');
          if (coolingMediaResponse.data && coolingMediaResponse.data.values) {
            const coolingMedias = coolingMediaResponse.data.values || [];
            setCoolingMediaOptions(coolingMedias.map(media => ({ 
              value: media, 
              label: media 
            })));
          }
          
          // Récupérer les options de taille de four
          const furnaceSizeResponse = await enumService.getEnumValues('furnaces', 'furnace_size');
          if (furnaceSizeResponse.data && furnaceSizeResponse.data.values) {
            const furnaceSizes = furnaceSizeResponse.data.values || [];
            setFurnaceSizeOptions(furnaceSizes.map(size => ({ 
              value: size, 
              label: size 
            })));
          }
          
          // Récupérer les options de cellule de trempe
          const quenchCellResponse = await enumService.getEnumValues('furnaces', 'quench_cell');
          if (quenchCellResponse.data && quenchCellResponse.data.values) {
            const quenchCells = quenchCellResponse.data.values || [];
            setQuenchCellOptions(quenchCells.map(cell => ({ 
              value: cell, 
              label: cell 
            })));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des options de four:', error);
        }
        
        // Récupérer les unités
        try {
          const units = await enumService.getUnits();
          setUnitOptions(units.map(unit => ({ 
            value: unit.id, 
            label: unit.name,
            type: unit.type 
          })));
        } catch (error) {
          console.error('Erreur lors de la récupération des unités:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, []);
  
  return {
    formData,
    errors,
    loading,
    message,
    parentId,
    locationOptions,
    statusOptions,
    mountingTypeOptions,
    positionTypeOptions,
    processTypeOptions,
    furnaceTypeOptions,
    heatingCellOptions,
    coolingMediaOptions,
    furnaceSizeOptions,
    quenchCellOptions,
    gasOptions,
    rampOptions,
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getTimeUnitOptions,
    getTemperatureUnitOptions,
    getPressureUnitOptions,
    selectStyles,
    // Thermal cycle
    handleThermalCycleChange,
    addThermalCycleStep,
    removeThermalCycleStep,
    // Chemical cycle
    handleChemicalCycleChange,
    addChemicalCycleStep,
    removeChemicalCycleStep,
    // Gas quench speed
    handleGasQuenchSpeedChange,
    addGasQuenchSpeedStep,
    removeGasQuenchSpeedStep,
    // Gas quench pressure
    handleGasQuenchPressureChange,
    addGasQuenchPressureStep,
    removeGasQuenchPressureStep,
    // Oil quench speed
    handleOilQuenchSpeedChange,
    addOilQuenchSpeedStep,
    removeOilQuenchSpeedStep
  };
};

export default useTestForm;