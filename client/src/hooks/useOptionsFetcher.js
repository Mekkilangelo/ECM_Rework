// Hook unifié pour récupérer toutes les options nécessaires aux formulaires
import { useState, useEffect, useCallback, useMemo } from 'react';
import enumService from '../services/enumService';
import steelService from '../services/steelService';

/**
 * Hook unifié pour récupérer différentes options à partir des services
 * @param {Function} setLoading - Fonction pour gérer l'état de chargement
 * @param {Object} options - Options de configuration pour spécifier quelles données charger
 * @returns {Object} - Ensemble des options et fonctions utilitaires
 */
const useOptionsFetcher = (setLoading, options = {}) => {
  // ------ ÉTATS ------
  
  // État pour suivre le dernier rafraîchissement
  const [refreshCounter, setRefreshCounter] = useState(0);
  
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
  const [preoxMediaOptions, setPreoxMediaOptions] = useState([]);
  
  // Options pour les fours
  const [furnaceTypeOptions, setFurnaceTypeOptions] = useState([]);
  const [heatingCellOptions, setHeatingCellOptions] = useState([]);
  const [coolingMediaOptions, setCoolingMediaOptions] = useState([]);
  const [furnaceSizeOptions, setFurnaceSizeOptions] = useState([]);
  const [quenchCellOptions, setQuenchCellOptions] = useState([]);
  
  // Options pour les unités
  const [unitOptions, setUnitOptions] = useState([]);
  
  // Options dérivées pour les types d'unités spécifiques
  const lengthUnitOptions = useMemo(() => 
    unitOptions.filter(unit => unit.type === 'length'), 
    [unitOptions]
  );
  
  const weightUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.type === 'weight'),
    [unitOptions]
  );
  
  const timeUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.type === 'time'),
    [unitOptions]
  );
  
  const temperatureUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.type === 'temperature'),
    [unitOptions]
  );
  
  const pressureUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.type === 'pressure'),
    [unitOptions]
  );
  
  const hardnessUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.type === 'hardness'),
    [unitOptions]
  );
  
  // Options prédéfinies (ne changent jamais)
  const gasOptions = useMemo(() => [
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' }
  ], []);
  
  const rampOptions = useMemo(() => [
    { value: 'up', label: 'Ramp Up', icon: 'fa-arrow-up' },
    { value: 'down', label: 'Ramp Down', icon: 'fa-arrow-down' },
    { value: 'continue', label: 'Continue', icon: 'fa-arrow-right' }
  ], []);

  // ------ UTILITAIRES & STYLES ------
  
  // Style pour les composants Select
  const selectStyles = useMemo(() => ({
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
  }), []);
  
  // Fonction utilitaire pour obtenir l'option sélectionnée
  const getSelectedOption = useCallback((options, value) => {
    if (!options || !Array.isArray(options)) {
      return null;
    }
    
    if (!value) {
      return null;
    }
    
    return options.find(option => option.value === value) || null;
  }, []);

  // ------ FONCTIONS DE RÉCUPÉRATION INDIVIDUELLES ------    // Récupérer les valeurs d'énumération génériques avec gestion d'erreur
  const fetchEnumValues = useCallback(async (category, field, setter) => {
    try {
      const enumData = await enumService.getEnumValues(category, field);
      
      // Adaptation au nouveau format de réponse
      let values = [];
      if (enumData && enumData.values) {
        // Format direct: { values: [...] }
        values = enumData.values;
      } else if (enumData && enumData.data && enumData.data.values) {
        // Format avec success: { success: true, data: { values: [...] } }
        values = enumData.data.values;
      } else if (Array.isArray(enumData)) {
        // Format direct tableau
        values = enumData;
      }
      
      setter(values.map(value => ({ 
        value: value, 
        label: value 
      })));
    } catch (error) {
      console.error(`Erreur lors de la récupération des options ${category}.${field}:`, error);
      setter([]);
    }
  }, []);

  // Récupérer les options des clients
  const fetchCountryOptions = useCallback(async () => {
    await fetchEnumValues('clients', 'country', setCountryOptions);
  }, [fetchEnumValues]);

  // Récupérer les options des aciers
  const fetchSteelFamilyOptions = useCallback(async () => {
    await fetchEnumValues('steels', 'family', setSteelFamilyOptions);
  }, [fetchEnumValues]);
  
  const fetchSteelStandardOptions = useCallback(async () => {
    await fetchEnumValues('steels', 'standard', setSteelStandardOptions);
  }, [fetchEnumValues]);
  
  const fetchElementOptions = useCallback(async () => {
    await fetchEnumValues('steels', 'elements', setElementOptions);
  }, [fetchEnumValues]);  // Fonction pour récupérer les aciers
  const fetchSteelOptions = useCallback(async () => {
    try {
      // Log condensé uniquement en mode debug
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log("⚙️ Fetching steels...");
      }
      
      // Utilisation de la méthode renommée getSteels au lieu de getAllSteels
      const response = await steelService.getSteels();
      
      let steelsList = [];
      
      if (response && response.steels) {
        // Nouveau format de réponse: response.steels
        steelsList = response.steels;
      } else if (response && response.data) {
        if (response.data.steels && Array.isArray(response.data.steels)) {
          steelsList = response.data.steels;
        } else if (Array.isArray(response.data)) {
          steelsList = response.data;
        }
      } else if (Array.isArray(response)) {
        steelsList = response;
      }
      
      if (steelsList && steelsList.length > 0) {
        // Options générales d'acier
        const steelOpts = steelsList.map(steel => {
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
        setSteelOptions(steelOpts);
        
        // Options de grade pour les équivalents (basées sur l'ID)
        const gradeOpts = steelsList.map(steel => {
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
        setSteelGradeOptions(gradeOpts);
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
  // Récupérer les désignations de pièces
  const fetchDesignationOptions = useCallback(async () => {
    try {
      // Utiliser la méthode correcte pour récupérer les désignations
      const enumData = await enumService.getEnumValues('parts', 'designation');
      
      // Adaptation au nouveau format de réponse
      let designations = [];
      if (enumData && enumData.values) {
        designations = enumData.values;
      } else if (enumData && enumData.data && enumData.data.values) {
        designations = enumData.data.values;
      }
      
      setDesignationOptions(designations.map(designation => ({ 
        value: designation, 
        label: designation 
      })));
    } catch (error) {
      console.error('Erreur lors de la récupération des désignations:', error);
      setDesignationOptions([]);
    }
  }, []);

  // Récupérer les options des tests
  const fetchLocationOptions = useCallback(async () => {
    await fetchEnumValues('tests', 'location', setLocationOptions);
  }, [fetchEnumValues]);
  
  const fetchStatusOptions = useCallback(async () => {
    await fetchEnumValues('tests', 'status', setStatusOptions);
  }, [fetchEnumValues]);
  
  const fetchMountingTypeOptions = useCallback(async () => {
    await fetchEnumValues('tests', 'mounting_type', setMountingTypeOptions);
  }, [fetchEnumValues]);
  
  const fetchPositionTypeOptions = useCallback(async () => {
    await fetchEnumValues('tests', 'position_type', setPositionTypeOptions);
  }, [fetchEnumValues]);
  
  const fetchProcessTypeOptions = useCallback(async () => {
    await fetchEnumValues('tests', 'process_type', setProcessTypeOptions);
  }, [fetchEnumValues]);
  
  const fetchPreoxMediaOptions = useCallback(async () => {
    await fetchEnumValues('tests', 'preox_media', setPreoxMediaOptions);
  }, [fetchEnumValues]);

  // Récupérer les options des fours
  const fetchFurnaceTypeOptions = useCallback(async () => {
    await fetchEnumValues('furnaces', 'furnace_type', setFurnaceTypeOptions);
  }, [fetchEnumValues]);
  
  const fetchHeatingCellOptions = useCallback(async () => {
    await fetchEnumValues('furnaces', 'heating_cell_type', setHeatingCellOptions);
  }, [fetchEnumValues]);
  
  const fetchCoolingMediaOptions = useCallback(async () => {
    await fetchEnumValues('furnaces', 'cooling_media', setCoolingMediaOptions);
  }, [fetchEnumValues]);
  
  const fetchFurnaceSizeOptions = useCallback(async () => {
    await fetchEnumValues('furnaces', 'furnace_size', setFurnaceSizeOptions);
  }, [fetchEnumValues]);
  
  const fetchQuenchCellOptions = useCallback(async () => {
    await fetchEnumValues('furnaces', 'quench_cell', setQuenchCellOptions);
  }, [fetchEnumValues]);  // Fonction pour récupérer les unités
  const fetchUnitOptions = useCallback(async () => {
    try {
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        console.log("📏 Fetching units...");
      }
      
      let allUnitOptions = [];
      
      // Fonction d'aide pour extraire les valeurs de l'énumération
      const extractEnumValues = (enumData) => {
        if (enumData && enumData.values) {
          return enumData.values;
        } else if (enumData && enumData.data && enumData.data.values) {
          return enumData.data.values;
        }
        return [];
      };
      
      // Récupérer les unités de longueur
      const lengthUnitsResponse = await enumService.getEnumValues('units', 'length_units');
      const lengthUnits = extractEnumValues(lengthUnitsResponse).map(unit => ({
        value: unit,
        label: unit,
        type: 'length'
      }));
      allUnitOptions = [...allUnitOptions, ...lengthUnits];
      
      // Récupérer les unités de poids
      const weightUnitsResponse = await enumService.getEnumValues('units', 'weight_units');
      const weightUnits = extractEnumValues(weightUnitsResponse).map(unit => ({
        value: unit,
        label: unit,
        type: 'weight'
      }));
      allUnitOptions = [...allUnitOptions, ...weightUnits];
      
      // Récupérer les unités de temps
      const timeUnitsResponse = await enumService.getEnumValues('units', 'time_units');
      const timeUnits = extractEnumValues(timeUnitsResponse).map(unit => ({
        value: unit,
        label: unit,
        type: 'time'
      }));
      allUnitOptions = [...allUnitOptions, ...timeUnits];
      
      // Récupérer les unités de température
      const temperatureUnitsResponse = await enumService.getEnumValues('units', 'temperature_units');
      const tempUnits = extractEnumValues(temperatureUnitsResponse).map(unit => ({
        value: unit,
        label: unit,
        type: 'temperature'
      }));
      allUnitOptions = [...allUnitOptions, ...tempUnits];
      
      // Récupérer les unités de pression
      const pressureUnitsResponse = await enumService.getEnumValues('units', 'pressure_units');
      const pressureUnits = extractEnumValues(pressureUnitsResponse).map(unit => ({
        value: unit,
        label: unit,
        type: 'pressure'
      }));
      allUnitOptions = [...allUnitOptions, ...pressureUnits];
      
      // Récupérer les unités de dureté
      const hardnessUnitsResponse = await enumService.getEnumValues('units', 'hardness_units');
      const hardnessUnits = extractEnumValues(hardnessUnitsResponse).map(unit => ({
        value: unit,
        label: unit,
        type: 'hardness'
      }));
      allUnitOptions = [...allUnitOptions, ...hardnessUnits];
        setUnitOptions(allUnitOptions);
      if (isDev && allUnitOptions.length > 0) {
        console.log(`✅ Units loaded: ${allUnitOptions.length} types`);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      setUnitOptions([]);
    }
  }, []);

  // ------ FONCTIONS DE RAFRAÎCHISSEMENT GROUPÉES ------
  
  // Fonction pour rafraîchir toutes les options
  const refreshAllOptions = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);
  
  // Rafraîchir les options par catégories
  const refreshClientOptions = useCallback(async () => {
    try {
      await fetchCountryOptions();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des options client:', error);
    }
  }, [fetchCountryOptions]);
  
  const refreshSteelOptions = useCallback(async () => {
    try {
      await fetchSteelOptions();
      await fetchSteelFamilyOptions();
      await fetchSteelStandardOptions();
      await fetchElementOptions();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des options acier:', error);
    }
  }, [fetchSteelOptions, fetchSteelFamilyOptions, fetchSteelStandardOptions, fetchElementOptions]);
  
  const refreshTestOptions = useCallback(async () => {
    try {
      await fetchLocationOptions();
      await fetchStatusOptions();
      await fetchMountingTypeOptions();
      await fetchPositionTypeOptions();
      await fetchProcessTypeOptions();
      await fetchPreoxMediaOptions();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des options de test:', error);
    }
  }, [
    fetchLocationOptions, 
    fetchStatusOptions, 
    fetchMountingTypeOptions, 
    fetchPositionTypeOptions,
    fetchProcessTypeOptions,
    fetchPreoxMediaOptions
  ]);
  
  const refreshFurnaceOptions = useCallback(async () => {
    try {
      await fetchFurnaceTypeOptions();
      await fetchHeatingCellOptions();
      await fetchCoolingMediaOptions();
      await fetchFurnaceSizeOptions();
      await fetchQuenchCellOptions();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des options de four:', error);
    }
  }, [
    fetchFurnaceTypeOptions,
    fetchHeatingCellOptions,
    fetchCoolingMediaOptions,
    fetchFurnaceSizeOptions,
    fetchQuenchCellOptions
  ]);

  // ------ UTILITÉS POUR LES SÉLECTEURS D'UNITÉS ------
  
  // Fonctions personnalisées pour faciliter l'accès aux unités de type spécifique
  const getLengthUnitOptions = useCallback(() => {
    return lengthUnitOptions;
  }, [lengthUnitOptions]);
  
  const getWeightUnitOptions = useCallback(() => {
    return weightUnitOptions;
  }, [weightUnitOptions]);
  
  const getTimeUnitOptions = useCallback(() => {
    return timeUnitOptions;
  }, [timeUnitOptions]);
  
  const getTemperatureUnitOptions = useCallback(() => {
    return temperatureUnitOptions;
  }, [temperatureUnitOptions]);
  
  const getPressureUnitOptions = useCallback(() => {
    return pressureUnitOptions;
  }, [pressureUnitOptions]);
  
  const getHardnessUnitOptions = useCallback(() => {
    return hardnessUnitOptions;
  }, [hardnessUnitOptions]);

  // ------ EFFET PRINCIPAL DE CHARGEMENT ------
  
  useEffect(() => {
    // Éviter les mises à jour d'état après démontage du composant
    let isMounted = true;
    
    const fetchOptions = async () => {
      if (!isMounted) return;
      
      try {
        // Indiquer que le chargement commence
        if (setLoading) setLoading(true);
        
        // Déterminons quelles options doivent être chargées
        // Par défaut, toutes les options sont chargées sauf si explicitement désactivées
        
        // Clients
        if (options.fetchClientOptions !== false) {
          await refreshClientOptions();
        }
        
        // Aciers
        if (options.fetchSteelOptions !== false) {
          await refreshSteelOptions();
        }
        
        // Pièces (Désignations)
        if (options.fetchPartOptions !== false) {
          await fetchDesignationOptions();
        }
        
        // Tests
        if (options.fetchTestOptions !== false) {
          await refreshTestOptions();
        }
        
        // Fours
        if (options.fetchFurnaceOptions !== false) {
          await refreshFurnaceOptions();
        }
        
        // Unités (presque toujours nécessaires)
        if (options.fetchUnitOptions !== false) {
          await fetchUnitOptions();
        }
      } catch (error) {
        console.error('Erreur générale lors du chargement des options:', error);
      } finally {
        // Indiquer que le chargement est terminé
        if (isMounted && setLoading) {
          setLoading(false);
        }
      }
    };
    
    fetchOptions();
    
    // Nettoyage pour éviter les mises à jour sur les composants démontés
    return () => {
      isMounted = false;
    };
  }, [
    setLoading,
    refreshClientOptions,
    refreshSteelOptions,
    fetchDesignationOptions,
    refreshTestOptions,
    refreshFurnaceOptions,
    fetchUnitOptions,
    refreshCounter,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(options) // Option simplifiée pour comparer les options
  ]);

  // ------ OBJET RETOURNÉ AVEC TOUTES LES OPTIONS ET FONCTIONS ------
  
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
    preoxMediaOptions,
    
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
    
    // Fonctions d'accès aux unités
    getLengthUnitOptions,
    getWeightUnitOptions,
    getTimeUnitOptions,
    getTemperatureUnitOptions,
    getPressureUnitOptions,
    getHardnessUnitOptions,
    
    // Options prédéfinies
    gasOptions,
    rampOptions,
    
    // Styles et utilitaires
    selectStyles,
    getSelectedOption,
    
    // Fonctions de rafraîchissement
    refreshAllOptions,
    refreshClientOptions,
    refreshSteelOptions,
    refreshTestOptions,
    refreshFurnaceOptions,
    refreshUnitOptions: fetchUnitOptions,
    refreshDesignationOptions: fetchDesignationOptions,
    
    // Fonctions individuelles pour un rafraîchissement spécifique
    fetchCountryOptions,
    fetchSteelFamilyOptions,
    fetchSteelStandardOptions,
    fetchSteelOptions,
    fetchElementOptions,
    fetchDesignationOptions,
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
    fetchUnitOptions
  };
};

export default useOptionsFetcher;