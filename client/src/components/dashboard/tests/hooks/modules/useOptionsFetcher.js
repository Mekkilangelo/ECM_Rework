import { useState, useEffect, useCallback } from 'react';
import enumService from '../../../../../services/enumService';

const useOptionsFetcher = (setLoading) => {
  // État pour suivre le dernier rafraîchissement
  const [refreshCounter, setRefreshCounter] = useState(0);

  // États pour les options des select
  const [locationOptions, setLocationOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [mountingTypeOptions, setMountingTypeOptions] = useState([]);
  const [positionTypeOptions, setPositionTypeOptions] = useState([]);
  const [preoxMediaOptions, setPreoxMediaOptions] = useState([]);
  const [processTypeOptions, setProcessTypeOptions] = useState([]);
  const [furnaceTypeOptions, setFurnaceTypeOptions] = useState([]);
  const [heatingCellOptions, setHeatingCellOptions] = useState([]);
  const [coolingMediaOptions, setCoolingMediaOptions] = useState([]);
  const [furnaceSizeOptions, setFurnaceSizeOptions] = useState([]);
  const [quenchCellOptions, setQuenchCellOptions] = useState([]);
  
  // États pour toutes les unités et les unités filtrées par type
  const [unitOptions, setUnitOptions] = useState([]);
  const [lengthUnitOptions, setLengthUnitOptions] = useState([]);
  const [weightUnitOptions, setWeightUnitOptions] = useState([]);
  const [timeUnitOptions, setTimeUnitOptions] = useState([]);
  const [temperatureUnitOptions, setTemperatureUnitOptions] = useState([]);
  const [pressureUnitOptions, setPressureUnitOptions] = useState([]);
  const [hardnessUnitOptions, setHardnessUnitOptions] = useState([]);
  
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
  
  // Fonctions de récupération pour chaque type d'option
  const fetchLocationOptions = useCallback(async () => {
    try {
      const locationResponse = await enumService.getEnumValues('tests', 'location');
      if (locationResponse.data && locationResponse.data.values) {
        const locations = locationResponse.data.values || [];
        setLocationOptions(locations.map(location => ({ 
          value: location, 
          label: location 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de localisation:', error);
    }
  }, []);

  const fetchStatusOptions = useCallback(async () => {
    try {
      const statusResponse = await enumService.getEnumValues('tests', 'status');
      if (statusResponse.data && statusResponse.data.values) {
        const statuses = statusResponse.data.values || [];
        setStatusOptions(statuses.map(status => ({ 
          value: status, 
          label: status 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de statut:', error);
    }
  }, []);

  const fetchMountingTypeOptions = useCallback(async () => {
    try {
      const mountingTypeResponse = await enumService.getEnumValues('tests', 'mounting_type');
      if (mountingTypeResponse.data && mountingTypeResponse.data.values) {
        const mountingTypes = mountingTypeResponse.data.values || [];
        setMountingTypeOptions(mountingTypes.map(type => ({ 
          value: type, 
          label: type 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de type de montage:', error);
    }
  }, []);

  const fetchPositionTypeOptions = useCallback(async () => {
    try {
      const positionTypeResponse = await enumService.getEnumValues('tests', 'position_type');
      if (positionTypeResponse.data && positionTypeResponse.data.values) {
        const positionTypes = positionTypeResponse.data.values || [];
        setPositionTypeOptions(positionTypes.map(type => ({ 
          value: type, 
          label: type 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de type de position:', error);
    }
  }, []);

  const fetchProcessTypeOptions = useCallback(async () => {
    try {
      const processTypeResponse = await enumService.getEnumValues('tests', 'process_type');
      if (processTypeResponse.data && processTypeResponse.data.values) {
        const processTypes = processTypeResponse.data.values || [];
        setProcessTypeOptions(processTypes.map(type => ({ 
          value: type, 
          label: type 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de type de processus:', error);
    }
  }, []);

  const fetchPreoxMediaOptions = useCallback(async () => {
    try {
      const preoxMediaResponse = await enumService.getEnumValues('tests', 'preox_media');
      if (preoxMediaResponse.data && preoxMediaResponse.data.values) {
        const preoxMedias = preoxMediaResponse.data.values || [];
        setPreoxMediaOptions(preoxMedias.map(media => ({ 
          value: media, 
          label: media 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de média de préoxydation:', error);
    }
  }, []);

  const fetchFurnaceTypeOptions = useCallback(async () => {
    try {
      const furnaceTypeResponse = await enumService.getEnumValues('furnaces', 'furnace_type');
      if (furnaceTypeResponse.data && furnaceTypeResponse.data.values) {
        const furnaceTypes = furnaceTypeResponse.data.values || [];
        setFurnaceTypeOptions(furnaceTypes.map(type => ({ 
          value: type, 
          label: type 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de type de four:', error);
    }
  }, []);

  const fetchHeatingCellOptions = useCallback(async () => {
    try {
      const heatingCellResponse = await enumService.getEnumValues('furnaces', 'heating_cell_type');
      if (heatingCellResponse.data && heatingCellResponse.data.values) {
        const heatingCells = heatingCellResponse.data.values || [];
        setHeatingCellOptions(heatingCells.map(cell => ({ 
          value: cell, 
          label: cell 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de cellule de chauffage:', error);
    }
  }, []);

  const fetchCoolingMediaOptions = useCallback(async () => {
    try {
      const coolingMediaResponse = await enumService.getEnumValues('furnaces', 'cooling_media');
      if (coolingMediaResponse.data && coolingMediaResponse.data.values) {
        const coolingMedias = coolingMediaResponse.data.values || [];
        setCoolingMediaOptions(coolingMedias.map(media => ({ 
          value: media, 
          label: media 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de média de refroidissement:', error);
    }
  }, []);

  const fetchFurnaceSizeOptions = useCallback(async () => {
    try {
      const furnaceSizeResponse = await enumService.getEnumValues('furnaces', 'furnace_size');
      if (furnaceSizeResponse.data && furnaceSizeResponse.data.values) {
        const furnaceSizes = furnaceSizeResponse.data.values || [];
        setFurnaceSizeOptions(furnaceSizes.map(size => ({ 
          value: size, 
          label: size 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de taille de four:', error);
    }
  }, []);

  const fetchQuenchCellOptions = useCallback(async () => {
    try {
      const quenchCellResponse = await enumService.getEnumValues('furnaces', 'quench_cell');
      if (quenchCellResponse.data && quenchCellResponse.data.values) {
        const quenchCells = quenchCellResponse.data.values || [];
        setQuenchCellOptions(quenchCells.map(cell => ({ 
          value: cell, 
          label: cell 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des options de cellule de trempe:', error);
    }
  }, []);

  const fetchUnitOptions = useCallback(async () => {
    try {
      const units = await enumService.getUnits();
      console.log('Units retrieved:', units);
      
      if (Array.isArray(units) && units.length > 0) {
        // Convertir toutes les unités au format d'option
        const allUnitOptions = units.map(unit => ({ 
          value: unit.id, 
          label: unit.name,
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
        
        // Log pour déboguer
        console.log('Length units:', allUnitOptions.filter(unit => unit.type === 'length'));
        console.log('Temperature units:', allUnitOptions.filter(unit => unit.type === 'temperature'));
        console.log('Hardness units:', allUnitOptions.filter(unit => unit.type === 'hardness'));
      } else {
        console.warn('Units data is not in expected format:', units);
        setUnitOptions([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des unités:', error);
      setUnitOptions([]);
    }
  }, []);

  // Fonction de rafraîchissement général des options
  const refreshAllOptions = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);
  
  // Charger les options pour les selects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Récupérer les options d'énumération pour les tests
        await fetchLocationOptions();
        await fetchStatusOptions();
        await fetchMountingTypeOptions();
        await fetchPositionTypeOptions();
        await fetchProcessTypeOptions();
        await fetchPreoxMediaOptions();
        
        // Récupérer les options d'énumération pour les fours
        await fetchFurnaceTypeOptions();
        await fetchHeatingCellOptions();
        await fetchCoolingMediaOptions();
        await fetchFurnaceSizeOptions();
        await fetchQuenchCellOptions();
        
        // Récupérer les unités
        await fetchUnitOptions();
        
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [
    setLoading, 
    fetchLocationOptions, 
    fetchStatusOptions, 
    fetchMountingTypeOptions, 
    fetchPositionTypeOptions,
    fetchProcessTypeOptions,
    fetchPreoxMediaOptions,
    fetchFurnaceTypeOptions,
    fetchHeatingCellOptions,
    fetchCoolingMediaOptions,
    fetchFurnaceSizeOptions,
    fetchQuenchCellOptions,
    fetchUnitOptions,
    refreshCounter // Dépendance ajoutée pour le rafraîchissement
  ]);
  
  return {
    // Toutes les options existantes
    locationOptions,
    statusOptions,
    mountingTypeOptions,
    positionTypeOptions,
    processTypeOptions,
    preoxMediaOptions,
    furnaceTypeOptions,
    heatingCellOptions,
    coolingMediaOptions,
    furnaceSizeOptions,
    quenchCellOptions,
    unitOptions,
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,
    gasOptions,
    rampOptions,
    selectStyles,
    getSelectedOption,
    
    // Fonctions de rafraîchissement
    refreshLocationOptions: fetchLocationOptions,
    refreshStatusOptions: fetchStatusOptions,
    refreshMountingTypeOptions: fetchMountingTypeOptions,
    refreshPositionTypeOptions: fetchPositionTypeOptions,
    refreshProcessTypeOptions: fetchProcessTypeOptions,
    refreshPreoxMediaOptions: fetchPreoxMediaOptions,
    refreshFurnaceTypeOptions: fetchFurnaceTypeOptions,
    refreshHeatingCellOptions: fetchHeatingCellOptions,
    refreshCoolingMediaOptions: fetchCoolingMediaOptions,
    refreshFurnaceSizeOptions: fetchFurnaceSizeOptions,
    refreshQuenchCellOptions: fetchQuenchCellOptions,
    refreshUnitOptions: fetchUnitOptions,
    refreshAllOptions
  };
};

export default useOptionsFetcher;