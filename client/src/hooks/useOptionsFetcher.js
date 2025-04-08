import { useState, useEffect, useCallback } from 'react';
import enumService from '../services/enumService';
import steelService from '../services/steelService';

/**
 * Hook pour récupérer différentes options à partir des services 
 * @param {Function} setLoading - Fonction pour gérer l'état de chargement
 * @param {Object} options - Options de configuration (propriétés optionnelles à charger)
 * @returns {Object} - Ensemble des options et fonctions utilitaires
 */
const useOptionsFetcher = (setLoading, options = {}) => {
  // Options pour les clients
  const [countryOptions, setCountryOptions] = useState([]);
  
  // Options pour les aciers
  const [steelFamilyOptions, setSteelFamilyOptions] = useState([]);
  const [steelStandardOptions, setSteelStandardOptions] = useState([]);
  const [steelGradeOptions, setSteelGradeOptions] = useState([]);
  const [steelOptions, setSteelOptions] = useState([]);
  const [elementOptions, setElementOptions] = useState([]);
  
  // Options pour les pièces
  const [designationOptions, setDesignationOptions] = useState([]);
  
  // Options pour les tests
  const [locationOptions, setLocationOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [mountingTypeOptions, setMountingTypeOptions] = useState([]);
  const [positionTypeOptions, setPositionTypeOptions] = useState([]);
  const [processTypeOptions, setProcessTypeOptions] = useState([]);
  
  // Options pour les fours
  const [furnaceTypeOptions, setFurnaceTypeOptions] = useState([]);
  const [heatingCellOptions, setHeatingCellOptions] = useState([]);
  const [coolingMediaOptions, setCoolingMediaOptions] = useState([]);
  const [furnaceSizeOptions, setFurnaceSizeOptions] = useState([]);
  const [quenchCellOptions, setQuenchCellOptions] = useState([]);
  
  // Options pour les unités
  const [unitOptions, setUnitOptions] = useState([]);
  const [lengthUnitOptions, setLengthUnitOptions] = useState([]);
  const [weightUnitOptions, setWeightUnitOptions] = useState([]);
  const [timeUnitOptions, setTimeUnitOptions] = useState([]);
  const [temperatureUnitOptions, setTemperatureUnitOptions] = useState([]);
  const [pressureUnitOptions, setPressureUnitOptions] = useState([]);
  const [hardnessUnitOptions, setHardnessUnitOptions] = useState([]);
  
  // Options prédéfinies
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
  
  // Fonction utilitaire pour obtenir l'option sélectionnée
  const getSelectedOption = (options, value) => {
    if (!options || !Array.isArray(options)) {
      return null;
    }
    
    if (!value) {
      return null;
    }
    
    return options.find(option => option.value === value) || null;
  };

  // Fonction pour récupérer les aciers
  const fetchSteelOptions = useCallback(async () => {
    try {
      console.log("Récupération des aciers en cours...");
      const response = await steelService.getAllSteels();
      console.log("Réponse API des aciers:", response);
      
      let steelsList = [];
      
      if (response && response.data) {
        if (response.data.steels && Array.isArray(response.data.steels)) {
          steelsList = response.data.steels;
        } else if (Array.isArray(response.data)) {
          steelsList = response.data;
        }
      } else if (Array.isArray(response)) {
        steelsList = response;
      }
      
      console.log("Liste d'aciers extraite:", steelsList);
      
      if (steelsList && steelsList.length > 0) {
        const steelOptions = steelsList.map(steel => {
          const steelData = steel.Steel || steel;
          const grade = steelData.grade || '';
          const standard = steelData.standard || '';
          const label = standard ? `${grade} (${standard})` : grade;
          
          return {
            value: grade,
            label: label,
            nodeId: steel.id,
            id: steel.id,
            family: steelData.family || '',
            standard: standard
          };
        });
        
        console.log("Options d'acier formatées:", steelOptions);
        setSteelOptions(steelOptions);
        
        // Mettre à jour également les grades pour les équivalents
        const gradeOptions = steelsList.map(steel => {
          const steelData = steel.Steel || steel;
          const id = steel.id;
          const grade = steelData.grade || '';
          const standard = steelData.standard || '';
          const label = standard ? `${grade} (${standard})` : grade;
          
          return {
            value: id,
            label: label
          };
        });
        setSteelGradeOptions(gradeOptions);
      } else {
        console.warn('Aucun acier trouvé dans la réponse');
        setSteelOptions([]);
        setSteelGradeOptions([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des aciers:', error);
      setSteelOptions([]);
      setSteelGradeOptions([]);
    }
  }, []);

  // Fonction pour récupérer les unités et les filtrer par type
  const fetchUnits = useCallback(async () => {
    try {
      const unitsResponse = await enumService.getUnits();
      
      let units = [];
      
      if (unitsResponse && unitsResponse.data) {
        units = unitsResponse.data;
      } else if (Array.isArray(unitsResponse)) {
        units = unitsResponse;
      }
      
      if (Array.isArray(units) && units.length > 0) {
        // Convertir toutes les unités au format d'option
        const allUnitOptions = units.map(unit => ({ 
          value: unit.id || unit.value, 
          label: unit.name || unit.label,
          type: unit.type 
        }));
        
        // Stocker toutes les unités
        setUnitOptions(allUnitOptions);
        
        // Filtrer et stocker les unités par type
        setLengthUnitOptions(allUnitOptions.filter(unit => unit.type === 'length'));
        setWeightUnitOptions(allUnitOptions.filter(unit => unit.type === 'weight'));
        setTimeUnitOptions(allUnitOptions.filter(unit => unit.type === 'time'));
        setTemperatureUnitOptions(allUnitOptions.filter(unit => unit.type === 'temperature'));
        setPressureUnitOptions(allUnitOptions.filter(unit => unit.type === 'pressure'));
        setHardnessUnitOptions(allUnitOptions.filter(unit => unit.type === 'hardness'));
      } else {
        console.warn('Format des unités inattendu:', unitsResponse);
        setUnitOptions([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des unités:', error);
      setUnitOptions([]);
    }
  }, []);

  // Récupérer les valeurs d'énumération avec gestion d'erreur
  const fetchEnumValues = useCallback(async (category, field, setter) => {
    try {
      const response = await enumService.getEnumValues(category, field);
      if (response.data && response.data.values) {
        const values = response.data.values || [];
        setter(values.map(value => ({ 
          value: value, 
          label: value 
        })));
      }
    } catch (error) {
      console.error(`Erreur lors de la récupération des options ${category}.${field}:`, error);
      setter([]);
    }
  }, []);

  // Récupérer les désignations de pièces
  const fetchDesignations = useCallback(async () => {
    try {
      const response = await enumService.getDesignations();
      if (response.data && response.data.values) {
        const designations = response.data.values || [];
        setDesignationOptions(designations.map(designation => ({ 
          value: designation, 
          label: designation 
        })));
      } else {
        console.warn('Format de réponse des désignations inattendu:', response);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des désignations:', error);
      setDesignationOptions([]);
    }
  }, []);

  // Charger les données des options selon les besoins
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);

        // Clients
        if (options.fetchCountries !== false) {
          await fetchEnumValues('clients', 'country', setCountryOptions);
        }

        // Aciers
        if (options.fetchSteels !== false) {
          await fetchSteelOptions();
          await fetchEnumValues('steels', 'family', setSteelFamilyOptions);
          await fetchEnumValues('steels', 'standard', setSteelStandardOptions);
          await fetchEnumValues('steels', 'elements', setElementOptions);
        }

        // Pièces
        if (options.fetchDesignations !== false) {
          await fetchDesignations();
        }

        // Tests
        if (options.fetchTestOptions !== false) {
          await fetchEnumValues('tests', 'location', setLocationOptions);
          await fetchEnumValues('tests', 'status', setStatusOptions);
          await fetchEnumValues('tests', 'mounting_type', setMountingTypeOptions);
          await fetchEnumValues('tests', 'position_type', setPositionTypeOptions);
          await fetchEnumValues('tests', 'process_type', setProcessTypeOptions);
        }

        // Fours
        if (options.fetchFurnaceOptions !== false) {
          await fetchEnumValues('furnaces', 'furnace_type', setFurnaceTypeOptions);
          await fetchEnumValues('furnaces', 'heating_cell_type', setHeatingCellOptions);
          await fetchEnumValues('furnaces', 'cooling_media', setCoolingMediaOptions);
          await fetchEnumValues('furnaces', 'furnace_size', setFurnaceSizeOptions);
          await fetchEnumValues('furnaces', 'quench_cell', setQuenchCellOptions);
        }

        // Unités
        if (options.fetchUnits !== false) {
          await fetchUnits();
        }
      } catch (error) {
        console.error('Erreur générale lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [
    setLoading, 
    fetchSteelOptions, 
    fetchUnits, 
    fetchDesignations, 
    fetchEnumValues, 
    options
  ]);

  return {
    // Options clients
    countryOptions,
    
    // Options aciers
    steelFamilyOptions,
    steelStandardOptions,
    steelGradeOptions,
    steelOptions,
    elementOptions,
    
    // Options pièces
    designationOptions,
    
    // Options tests
    locationOptions,
    statusOptions,
    mountingTypeOptions,
    positionTypeOptions,
    processTypeOptions,
    
    // Options fours
    furnaceTypeOptions,
    heatingCellOptions,
    coolingMediaOptions,
    furnaceSizeOptions,
    quenchCellOptions,
    
    // Options unités
    unitOptions,
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,
    
    // Options prédéfinies
    gasOptions,
    rampOptions,
    
    // Styles et utilitaires
    selectStyles,
    getSelectedOption,
    
    // Fonctions de rafraîchissement
    refreshSteelOptions: fetchSteelOptions
  };
};

export default useOptionsFetcher;