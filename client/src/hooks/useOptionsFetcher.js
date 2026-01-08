// Hook unifié pour récupérer toutes les options nécessaires aux formulaires
import { useState, useEffect, useCallback, useMemo } from 'react';
import steelService from '../services/steelService';
import referenceService from '../services/referenceService';

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
  
  // Options pour les trials
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
  // OPTIMISÉ : Filtrage côté client - instantané, zéro latence réseau
  // Note : Les unit_type dans la DB sont en minuscules (length, weight, temperature, etc.)
  const lengthUnitOptions = useMemo(() => 
    unitOptions.filter(unit => unit.unit_type === 'length'), 
    [unitOptions]
  );
  
  const weightUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.unit_type === 'weight'),
    [unitOptions]
  );
  
  const timeUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.unit_type === 'time'),
    [unitOptions]
  );
  
  const temperatureUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.unit_type === 'temperature'),
    [unitOptions]
  );
  
  const pressureUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.unit_type === 'pressure'),
    [unitOptions]
  );
  
  const hardnessUnitOptions = useMemo(() =>
    unitOptions.filter(unit => unit.unit_type === 'hardness'),
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

  // Style pour les composants Select - Compatible dark mode
  const selectStyles = useMemo(() => {
    // Détection du thème sombre
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');

    // Couleurs adaptées au thème
    const themeColors = {
      controlBg: isDarkTheme ? '#333333' : 'white',
      controlBorder: isDarkTheme ? '#555555' : '#ced4da',
      controlBorderHover: isDarkTheme ? '#666666' : '#80bdff',
      menuBg: isDarkTheme ? '#333333' : 'white',
      optionBg: isDarkTheme ? '#333333' : 'white',
      optionText: isDarkTheme ? '#e0e0e0' : '#212529',
      optionHoverBg: isDarkTheme ? '#343a40' : '#f8f9fa',
      singleValueText: isDarkTheme ? '#e0e0e0' : '#212529',
      placeholderText: isDarkTheme ? '#b0b0b0' : '#6c757d',
      indicatorColor: isDarkTheme ? '#b0b0b0' : '#6c757d',
    };

    return {
      control: (provided) => ({
        ...provided,
        backgroundColor: themeColors.controlBg,
        borderColor: themeColors.controlBorder,
        boxShadow: 'none',
        '&:hover': {
          borderColor: themeColors.controlBorderHover
        }
      }),
      menu: (provided) => ({
        ...provided,
        backgroundColor: themeColors.menuBg,
        zIndex: 9999
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isFocused ? themeColors.optionHoverBg : themeColors.optionBg,
        color: themeColors.optionText
      }),
      singleValue: (provided) => ({
        ...provided,
        color: themeColors.singleValueText
      }),
      placeholder: (provided) => ({
        ...provided,
        color: themeColors.placeholderText
      }),
      input: (provided) => ({
        ...provided,
        color: themeColors.optionText
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        color: themeColors.indicatorColor
      }),
      clearIndicator: (provided) => ({
        ...provided,
        color: themeColors.indicatorColor
      })
    };
  }, []);
  
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

  // ------ FONCTIONS DE RÉCUPÉRATION INDIVIDUELLES ------
  
  // Récupérer les valeurs de référence génériques avec gestion d'erreur
  const fetchReferenceValues = useCallback(async (refTable, setter) => {
    try {
      const response = await referenceService.getValues(refTable);
      
      // Adaptation au format de réponse
      let values = [];
      if (response && response.values) {
        values = response.values;
      } else if (response && response.data && response.data.values) {
        values = response.data.values;
      } else if (Array.isArray(response)) {
        values = response;
      }
      
      // Convertir en options pour React-Select
      setter(values.map(value => {
        // Si c'est un objet (ref_units par exemple)
        if (typeof value === 'object') {
          return {
            value: value.name,
            label: value.name,
            ...value // Inclure les autres propriétés (unit_type, description, etc.)
          };
        }
        // Si c'est une string simple
        return { 
          value: value, 
          label: value 
        };
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération des options ${refTable}:`, error);
      setter([]);
    }
  }, []);

  // Récupérer les options des clients
  const fetchCountryOptions = useCallback(async () => {
    try {
      // Utilisation du nouveau service de référence au lieu de l'ancien système ENUM
      const countries = await referenceService.getCountries();
      setCountryOptions(countries);
    } catch (error) {
      console.error('Erreur lors de la récupération des pays:', error);
      setCountryOptions([]);
    }
  }, []);

  // Récupérer les options des aciers
  const fetchSteelFamilyOptions = useCallback(async () => {
    try {
      const families = await referenceService.getSteelFamilies();
      setSteelFamilyOptions(families);
    } catch (error) {
      console.error('Erreur lors de la récupération des familles d\'acier:', error);
      setSteelFamilyOptions([]);
    }
  }, []);
  
  const fetchSteelStandardOptions = useCallback(async () => {
    try {
      const standards = await referenceService.getSteelStandards();
      setSteelStandardOptions(standards);
    } catch (error) {
      console.error('Erreur lors de la récupération des standards d\'acier:', error);
      setSteelStandardOptions([]);
    }
  }, []);
  
  const fetchElementOptions = useCallback(async () => {
    try {
      const elements = await referenceService.getSteelElements();
      setElementOptions(elements);
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments chimiques:', error);
      setElementOptions([]);
    }
  }, []);  // Fonction pour récupérer les aciers
  const fetchSteelOptions = useCallback(async () => {
    try {
      // Log condensé uniquement en mode debug
      const isDev = process.env.NODE_ENV === 'development';
      if (isDev) {
        
      }
      
      // Charger TOUS les aciers pour les options (limite élevée pour éviter la pagination)
      const response = await steelService.getSteels(1, 1000);
      
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
      // Utiliser le nouveau service de référence au lieu de l'ancien système ENUM
      const designations = await referenceService.getDesignations();
      setDesignationOptions(designations);
    } catch (error) {
      console.error('Erreur lors de la récupération des désignations:', error);
      setDesignationOptions([]);
    }
  }, []);

  // Récupérer les options des trials depuis les tables de référence
  const fetchLocationOptions = useCallback(async () => {
    try {
      const locations = await referenceService.getLocations();
      setLocationOptions(locations);
    } catch (error) {
      console.error('Error fetching location options:', error);
      setLocationOptions([]);
    }
  }, []);
  
  const fetchStatusOptions = useCallback(async () => {
    try {
      const statuses = await referenceService.getStatuses();
      setStatusOptions(statuses);
    } catch (error) {
      console.error('Error fetching status options:', error);
      setStatusOptions([]);
    }
  }, []);
  
  const fetchMountingTypeOptions = useCallback(async () => {
    try {
      const mountingTypes = await referenceService.getMountingTypes();
      setMountingTypeOptions(mountingTypes);
    } catch (error) {
      console.error('Error fetching mounting type options:', error);
      setMountingTypeOptions([]);
    }
  }, []);
  
  const fetchPositionTypeOptions = useCallback(async () => {
    try {
      const positionTypes = await referenceService.getPositionTypes();
      setPositionTypeOptions(positionTypes);
    } catch (error) {
      console.error('Error fetching position type options:', error);
      setPositionTypeOptions([]);
    }
  }, []);
  
  const fetchProcessTypeOptions = useCallback(async () => {
    try {
      const processTypes = await referenceService.getProcessTypes();
      setProcessTypeOptions(processTypes);
    } catch (error) {
      console.error('Error fetching process type options:', error);
      setProcessTypeOptions([]);
    }
  }, []);
  
  const fetchPreoxMediaOptions = useCallback(async () => {
    try {
      const coolingMedia = await referenceService.getCoolingMedia();
      setPreoxMediaOptions(coolingMedia);
    } catch (error) {
      console.error('Error fetching preox media options:', error);
      setPreoxMediaOptions([]);
    }
  }, []);

  // Récupérer les options des fours depuis les tables de référence
  const fetchFurnaceTypeOptions = useCallback(async () => {
    try {
      const furnaceTypes = await referenceService.getFurnaceTypes();
      setFurnaceTypeOptions(furnaceTypes);
    } catch (error) {
      console.error('Error fetching furnace type options:', error);
      setFurnaceTypeOptions([]);
    }
  }, []);
  
  const fetchHeatingCellOptions = useCallback(async () => {
    try {
      const heatingCells = await referenceService.getHeatingCells();
      setHeatingCellOptions(heatingCells);
    } catch (error) {
      console.error('Error fetching heating cell options:', error);
      setHeatingCellOptions([]);
    }
  }, []);
  
  const fetchCoolingMediaOptions = useCallback(async () => {
    try {
      const coolingMedia = await referenceService.getCoolingMedia();
      setCoolingMediaOptions(coolingMedia);
    } catch (error) {
      console.error('Error fetching cooling media options:', error);
      setCoolingMediaOptions([]);
    }
  }, []);
  
  const fetchFurnaceSizeOptions = useCallback(async () => {
    try {
      const furnaceSizes = await referenceService.getFurnaceSizes();
      setFurnaceSizeOptions(furnaceSizes);
    } catch (error) {
      console.error('Error fetching furnace size options:', error);
      setFurnaceSizeOptions([]);
    }
  }, []);
    const fetchQuenchCellOptions = useCallback(async () => {
    try {
      const quenchCells = await referenceService.getQuenchCells();
      setQuenchCellOptions(quenchCells);
    } catch (error) {
      console.error('Error fetching quench cell options:', error);
      setQuenchCellOptions([]);
    }
  }, []);
  // Fonction pour récupérer les unités - SYSTÈME OPTIMISÉ AVEC AUTO-REFRESH
  const fetchUnitOptions = useCallback(async () => {
    try {
      
      
      // Utiliser le nouveau service de référence
      // getValues('ref_units') retourne maintenant des objets complets avec unit_type
      const unitsData = await referenceService.getValues('ref_units');
      
      
      
      // Formater les unités pour les dropdowns
      const formattedUnits = unitsData.map(unit => {
        // Si c'est un objet avec tous les champs (nouvelle structure)
        if (typeof unit === 'object' && unit.name) {
          return {
            value: unit.name,
            label: unit.name,
            unit_type: unit.unit_type,  // Clé pour le filtrage par type
            description: unit.description
          };
        }
        // Sinon fallback pour compatibilité (string simple)
        return {
          value: unit,
          label: unit,
          unit_type: null
        };
      });
      
      console.log('📊 Formatted units:', {
        total: formattedUnits.length,
        byType: {
          length: formattedUnits.filter(u => u.unit_type === 'length').length,
          weight: formattedUnits.filter(u => u.unit_type === 'weight').length,
          temperature: formattedUnits.filter(u => u.unit_type === 'temperature').length,
          time: formattedUnits.filter(u => u.unit_type === 'time').length,
          pressure: formattedUnits.filter(u => u.unit_type === 'pressure').length,
          hardness: formattedUnits.filter(u => u.unit_type === 'hardness').length,
          null: formattedUnits.filter(u => u.unit_type === null).length
        }
      });
      
      setUnitOptions(formattedUnits);
    } catch (error) {
      console.error('❌ Error fetching units:', error);
      setUnitOptions([]);
    }
  }, []);

  // S'abonner aux changements de ref_units pour auto-refresh
  useEffect(() => {
    const unsubscribe = referenceService.subscribe('ref_units', () => {
      
      fetchUnitOptions();
    });
    
    return unsubscribe;
  }, [fetchUnitOptions]);

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
  
  const refreshDesignationOptions = useCallback(async () => {
    try {
      await fetchDesignationOptions();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des options de désignation:', error);
    }
  }, [fetchDesignationOptions]);
  
  const refreshTrialOptions = useCallback(async () => {
    try {
      await fetchLocationOptions();
      await fetchStatusOptions();
      await fetchMountingTypeOptions();
      await fetchPositionTypeOptions();
      await fetchProcessTypeOptions();
      await fetchPreoxMediaOptions();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des options de trial:', error);
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

  // ------ FONCTIONS DE RAFRAÎCHISSEMENT INDIVIDUELLES ------
  // Alias vers les fonctions fetch* pour compatibilité avec les composants
  
  // Options trial
  const refreshLocationOptions = fetchLocationOptions;
  const refreshStatusOptions = fetchStatusOptions;
  const refreshMountingTypeOptions = fetchMountingTypeOptions;
  const refreshPositionTypeOptions = fetchPositionTypeOptions;
  const refreshProcessTypeOptions = fetchProcessTypeOptions;
  const refreshPreoxMediaOptions = fetchPreoxMediaOptions;
  
  // Options furnace
  const refreshFurnaceTypeOptions = fetchFurnaceTypeOptions;
  const refreshHeatingCellOptions = fetchHeatingCellOptions;
  const refreshCoolingMediaOptions = fetchCoolingMediaOptions;
  const refreshFurnaceSizeOptions = fetchFurnaceSizeOptions;
  const refreshQuenchCellOptions = fetchQuenchCellOptions;

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
        
        // Batch toutes les requêtes nécessaires pour éviter les appels multiples
        const fetchPromises = [];
        
        // Déterminons quelles options doivent être chargées
        // Par défaut, toutes les options sont chargées sauf si explicitement désactivées
        
        // Clients
        if (options.fetchClientOptions !== false) {
          fetchPromises.push(refreshClientOptions());
        }
        
        // Aciers
        if (options.fetchSteelOptions !== false) {
          fetchPromises.push(refreshSteelOptions());
        }
        
        // Pièces (Désignations)
        if (options.fetchPartOptions !== false) {
          fetchPromises.push(refreshDesignationOptions());
        }
        
        // Trials
        if (options.fetchTrialOptions !== false) {
          fetchPromises.push(refreshTrialOptions());
        }
        
        // Fours
        if (options.fetchFurnaceOptions !== false) {
          fetchPromises.push(refreshFurnaceOptions());
        }
        
        // Unités (presque toujours nécessaires)
        if (options.fetchUnitOptions !== false) {
          fetchPromises.push(fetchUnitOptions());
        }
        
        // Exécuter toutes les promesses en parallèle pour optimiser les performances
        await Promise.all(fetchPromises);
        
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
    };  }, [
    setLoading,
    refreshClientOptions,
    refreshSteelOptions,
    fetchDesignationOptions,
    refreshTrialOptions,
    refreshFurnaceOptions,
    fetchUnitOptions,
    refreshCounter,
    options?.fetchClientOptions,
    options?.fetchSteelOptions,
    options?.fetchPartOptions,
    options?.fetchTrialOptions,
    options?.fetchFurnaceOptions,
    options?.fetchUnitOptions
  ]);

  // ------ AUTO-REFRESH SUR CHANGEMENTS DE RÉFÉRENCE ------
  // S'abonner aux changements de toutes les tables de référence
  // pour recharger automatiquement les options quand une valeur est ajoutée/supprimée
  useEffect(() => {
    const unsubscribers = [];
    
    // Mapping table -> fonction de fetch
    const tableSubscriptions = {
      'ref_country': fetchCountryOptions,
      'ref_steel_family': fetchSteelFamilyOptions,
      'ref_steel_standard': fetchSteelStandardOptions,
      'ref_steel_elements': fetchElementOptions,
      'ref_designation': fetchDesignationOptions,
      'ref_location': fetchLocationOptions,
      'ref_status': fetchStatusOptions,
      'ref_mounting_type': fetchMountingTypeOptions,
      'ref_position_type': fetchPositionTypeOptions,
      'ref_process_type': fetchProcessTypeOptions,
      'ref_cooling_media': fetchPreoxMediaOptions,
      'ref_furnace_types': fetchFurnaceTypeOptions,
      'ref_heating_cells': fetchHeatingCellOptions,
      'ref_furnace_sizes': fetchFurnaceSizeOptions,
      'ref_quench_cells': fetchQuenchCellOptions,
      // ref_units déjà abonné ci-dessus
    };
    
    // S'abonner à chaque table
    Object.entries(tableSubscriptions).forEach(([tableName, fetchFn]) => {
      const unsubscribe = referenceService.subscribe(tableName, () => {
        
        fetchFn();
      });
      unsubscribers.push(unsubscribe);
    });
    
    // Nettoyage lors du démontage
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [
    fetchCountryOptions,
    fetchSteelFamilyOptions,
    fetchSteelStandardOptions,
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
    fetchQuenchCellOptions
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
    
    // Options trials
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
    refreshDesignationOptions,
    refreshTrialOptions,
    refreshFurnaceOptions,
    refreshUnitOptions: fetchUnitOptions,
    
    // Fonctions de rafraîchissement individuelles pour trials
    refreshLocationOptions,
    refreshStatusOptions,
    refreshMountingTypeOptions,
    refreshPositionTypeOptions,
    refreshProcessTypeOptions,
    refreshPreoxMediaOptions,
    
    // Fonctions de rafraîchissement individuelles pour furnaces
    refreshFurnaceTypeOptions,
    refreshHeatingCellOptions,
    refreshCoolingMediaOptions,
    refreshFurnaceSizeOptions,
    refreshQuenchCellOptions,
    
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