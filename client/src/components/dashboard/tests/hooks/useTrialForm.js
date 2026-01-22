import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useTrialHandlers from './modules/useTrialHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
import useTrialSubmission from './modules/useTrialSubmission';
import useTrialData from './modules/useTrialData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import useExcelImport from './modules/useExcelImport';
import useCopyPaste from '../../../../hooks/useCopyPaste';

const useTrialForm = (trial, onClose, onTrialCreated, onTrialUpdated, viewMode = false) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.partId;
  
  // État pour stocker la fonction de rappel d'association de fichiers
  const [fileAssociationCallback, setFileAssociationCallback] = useState(null);
  
  // État du formulaire et initialisation
  const { 
    formData, 
    setFormData, 
    errors, 
    setErrors, 
    loading, 
    setLoading, 
    message, 
    setMessage 
  } = useFormState();

  // Exposer setFormData pour l'import Excel via une méthode globale temporaire
  useEffect(() => {
    window.setFormDataForCurveImport = setFormData;
    
    // Listener pour les mises à jour forcées de formData
    const handleForceUpdate = (event) => {
      
      
      setFormData(event.detail.formData);
    };
    
    window.addEventListener('forceFormDataUpdate', handleForceUpdate);
    
    return () => {
      delete window.setFormDataForCurveImport;
      window.removeEventListener('forceFormDataUpdate', handleForceUpdate);
    };
  }, [setFormData]);

  // Gestion des fichiers temporaires
  const [tempFileId, setTempFileId] = useState(null);

  // State for fetching test
  const [fetchingTest, setFetchingTest] = useState(false);

  // Référence pour la section des résultats (pour flusher les données de courbe)
  const resultsSectionRef = useRef(null);

  // Configuration stable pour les options (éviter les re-renders)
  const optionsConfig = useMemo(() => ({
    fetchClientOptions: false,
    fetchSteelOptions: false,
    fetchPartOptions: false,
    fetchTrialOptions: true,
    fetchFurnaceOptions: true,
    fetchUnitOptions: true
  }), []);

  // Load trial data in edit mode
  useTrialData(
    trial,
    setFormData,
    setMessage,
    setFetchingTest
  );
  
  // Chargement des options pour les selects en utilisant le hook unifié
  const { 
    locationOptions, statusOptions, mountingTypeOptions, positionTypeOptions, 
    processTypeOptions, preoxMediaOptions, furnaceTypeOptions, heatingCellOptions, 
    coolingMediaOptions, furnaceSizeOptions, quenchCellOptions, gasOptions, rampOptions,
    selectStyles, getSelectedOption, lengthUnitOptions, weightUnitOptions, 
    timeUnitOptions, temperatureUnitOptions, pressureUnitOptions, hardnessUnitOptions,
    getLengthUnitOptions, 
    getWeightUnitOptions, 
    getTimeUnitOptions, 
    getTemperatureUnitOptions, 
    getPressureUnitOptions, 
    getHardnessUnitOptions,
    refreshLocationOptions,
    refreshStatusOptions,
    refreshMountingTypeOptions,
    refreshPositionTypeOptions,
    refreshProcessTypeOptions,
    refreshPreoxMediaOptions,
    refreshFurnaceTypeOptions,
    refreshHeatingCellOptions,
    refreshCoolingMediaOptions,
    refreshFurnaceSizeOptions,
    refreshQuenchCellOptions,
    refreshUnitOptions,
    refreshAllOptions
  } = useOptionsFetcher(setLoading, optionsConfig);
  
  // Regrouper les fonctions de rafraîchissement pour les passer à useFormHandlers
  const refreshFunctions = {
    refreshLocationOptions,
    refreshStatusOptions,
    refreshMountingTypeOptions,
    refreshPositionTypeOptions,
    refreshProcessTypeOptions,
    refreshPreoxMediaOptions,
    refreshFurnaceTypeOptions,
    refreshHeatingCellOptions,
    refreshCoolingMediaOptions,
    refreshFurnaceSizeOptions,
    refreshQuenchCellOptions,
    refreshUnitOptions,
    refreshAllOptions
  };

  // Validation du formulaire
  const { validate } = useFormValidation(formData, parentId, setErrors);

  // Soumission du formulaire au serveur
  const { handleSubmit } = useTrialSubmission(
    formData, 
    setFormData, 
    validate, 
    parentId,
    trial, 
    setLoading, 
    setMessage, 
    onTrialCreated,
    onTrialUpdated, 
    onClose,
    fileAssociationCallback,
    viewMode,
    () => flushAllCurveData(resultsSectionRef) // Passer une fonction qui utilise la ref
  );

  // Utiliser notre hook amélioré pour la gestion de la confirmation de fermeture
  const { 
    showConfirmModal, 
    pendingClose, 
    isModified,
    setModified,
    resetInitialState,
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData,
    loading,
    fetchingTest,
    handleSubmit,
    onClose,
    viewMode
  );

  // Handlers pour le formulaire
  const { 
    handleChange, handleSelectChange, 
    handleThermalCycleAdd, handleThermalCycleRemove, handleThermalCycleChange,
    handleChemicalCycleAdd, handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd, handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd, handleGasQuenchPressureRemove,
    handleOilQuenchSpeedAdd, handleOilQuenchSpeedRemove, 
    handleResultBlocAdd, handleResultBlocRemove,
    handleSampleAdd, handleSampleRemove,
    handleHardnessResultAdd, handleHardnessResultRemove,
    handleCreateOption,
    handleEcdPositionAdd,
    handleEcdPositionRemove,
    handleEcdPositionChange,
    flushAllCurveData, // Nouvelle fonction pour flusher les données de courbe
    convertSecondsToHMS,
    convertHMSToSeconds,
    handleTimeComponentChange,
    initializeTimeComponents,
    calculateProgramDuration
  } = useTrialHandlers(formData, setFormData, errors, setErrors, refreshFunctions, setModified);

  // Hook pour la gestion de l'import Excel
  const {
    fileInputRef,
    handleExcelImport,
    processExcelData
  } = useExcelImport(
    formData,
    handleChange
  );

  // Réinitialiser l'état initial après une sauvegarde réussie
  useEffect(() => {
    if (message && message.type === 'success') {
      resetInitialState();
    }
  }, [message, resetInitialState]);

  // Fonction pour formater les données pour l'API/copie
  const formatForApi = (data) => {
    return {
      // Informations de base
      name: data.name || '',
      loadNumber: data.loadNumber || '',
      trialDate: data.trialDate || '',
      location: data.location || '',
      status: data.status || 'pending',
      description: data.description || '',

      // Types de test
      mountingType: data.mountingType || '',
      positionType: data.positionType || '',
      processType: data.processType || '',
      
      // Données du four
      furnaceData: {
        furnaceType: data.furnaceData?.furnaceType || '',
        heatingCell: data.furnaceData?.heatingCell || '',
        coolingMedia: data.furnaceData?.coolingMedia || '',
        furnaceSize: data.furnaceData?.furnaceSize || '',
        quenchCell: data.furnaceData?.quenchCell || '',
      },
      
      // Données de charge
      loadData: {
        length: data.loadData?.length || '',
        width: data.loadData?.width || '',
        height: data.loadData?.height || '',
        sizeUnit: data.loadData?.sizeUnit || '',
        floorCount: data.loadData?.floorCount || '',
        partCount: data.loadData?.partCount || '',
        weight: data.loadData?.weight || '',
        weightUnit: data.loadData?.weightUnit || '',
        loadComments: data.loadData?.loadComments || '',
      },
      
      // Données de recette
      recipeData: {
        recipeNumber: data.recipeData?.recipeNumber || '',
        
        // Préoxydation
        preoxTemp: data.recipeData?.preoxTemp || '',
        preoxTempUnit: data.recipeData?.preoxTempUnit || '',
        preoxDuration: data.recipeData?.preoxDuration || '',
        preoxDurationUnit: data.recipeData?.preoxDurationUnit || '',
        preoxMedia: data.recipeData?.preoxMedia || '',
        
        // Cycle thermique
        thermalCycle: data.recipeData?.thermalCycle || [],
        
        // Configuration globale des gaz
        selectedGas1: data.recipeData?.selectedGas1 || '',
        selectedGas2: data.recipeData?.selectedGas2 || '',
        selectedGas3: data.recipeData?.selectedGas3 || '',
        
        // Cycle chimique
        chemicalCycle: data.recipeData?.chemicalCycle || [],
        
        // Autres paramètres de recette
        waitTime: data.recipeData?.waitTime || '',
        waitTimeUnit: data.recipeData?.waitTimeUnit || '',
        waitGas: data.recipeData?.waitGas || '',
        waitFlow: data.recipeData?.waitFlow || '',
        programDuration: data.recipeData?.programDuration || '',
        programDurationUnit: data.recipeData?.programDurationUnit || '',
        cellTemp: data.recipeData?.cellTemp || '',
        cellTempUnit: data.recipeData?.cellTempUnit || '',
        waitPressure: data.recipeData?.waitPressure || '',
        waitPressureUnit: data.recipeData?.waitPressureUnit || '',
      },
      
      // Données de trempe
      quenchData: {
        gasQuenchSpeed: data.quenchData?.gasQuenchSpeed || [],
        gasQuenchPressure: data.quenchData?.gasQuenchPressure || [],
        oilQuenchSpeed: data.quenchData?.oilQuenchSpeed || [],
        oilTemperature: data.quenchData?.oilTemperature || '',
        oilTempUnit: data.quenchData?.oilTempUnit || '',
        oilInertingPressure: data.quenchData?.oilInertingPressure || '',
        oilInertingDelay: data.quenchData?.oilInertingDelay || '',
        oilInertingDelayUnit: data.quenchData?.oilInertingDelayUnit || '',
        oilDrippingTime: data.quenchData?.oilDrippingTime || '',
        oilDrippingTimeUnit: data.quenchData?.oilDrippingTimeUnit || ''
      },
      
      // Données de résultats
      resultsData: {
        results: data.resultsData?.results || []
      },
      
      // Notes (ancien champ)
      notes: data.notes || ''
    };
  };

  // Fonction pour parser les données depuis l'API/collage
  const parseFromApi = (data) => {
    return {
      // Informations de base
      name: data.name || '',
      loadNumber: data.loadNumber || '',
      trialDate: data.trialDate || '',
      location: data.location || '',
      status: data.status || 'pending',
      description: data.description || '',
      
      // Types de test
      mountingType: data.mountingType || '',
      positionType: data.positionType || '',
      processType: data.processType || '',
      
      // Données du four
      furnaceData: {
        furnaceType: data.furnaceData?.furnaceType || '',
        heatingCell: data.furnaceData?.heatingCell || '',
        coolingMedia: data.furnaceData?.coolingMedia || '',
        furnaceSize: data.furnaceData?.furnaceSize || '',
        quenchCell: data.furnaceData?.quenchCell || '',
      },
      
      // Données de charge
      loadData: {
        length: data.loadData?.length || '',
        width: data.loadData?.width || '',
        height: data.loadData?.height || '',
        sizeUnit: data.loadData?.sizeUnit || '',
        floorCount: data.loadData?.floorCount || '',
        partCount: data.loadData?.partCount || '',
        weight: data.loadData?.weight || '',
        weightUnit: data.loadData?.weightUnit || '',
        loadComments: data.loadData?.loadComments || '',
      },
      
      // Données de recette
      recipeData: {
        recipeNumber: data.recipeData?.recipeNumber || '',
        
        // Préoxydation
        preoxTemp: data.recipeData?.preoxTemp || '',
        preoxTempUnit: data.recipeData?.preoxTempUnit || '',
        preoxDuration: data.recipeData?.preoxDuration || '',
        preoxDurationUnit: data.recipeData?.preoxDurationUnit || '',
        preoxMedia: data.recipeData?.preoxMedia || '',
        
        // Cycle thermique
        thermalCycle: data.recipeData?.thermalCycle || [],
        
        // Configuration globale des gaz
        selectedGas1: data.recipeData?.selectedGas1 || '',
        selectedGas2: data.recipeData?.selectedGas2 || '',
        selectedGas3: data.recipeData?.selectedGas3 || '',
        
        // Cycle chimique
        chemicalCycle: data.recipeData?.chemicalCycle || [],
        
        // Autres paramètres de recette
        waitTime: data.recipeData?.waitTime || '',
        waitTimeUnit: data.recipeData?.waitTimeUnit || '',
        waitGas: data.recipeData?.waitGas || '',
        waitFlow: data.recipeData?.waitFlow || '',
        programDuration: data.recipeData?.programDuration || '',
        programDurationUnit: data.recipeData?.programDurationUnit || '',
        cellTemp: data.recipeData?.cellTemp || '',
        cellTempUnit: data.recipeData?.cellTempUnit || '',
        waitPressure: data.recipeData?.waitPressure || '',
        waitPressureUnit: data.recipeData?.waitPressureUnit || '',
      },
      
      // Données de trempe
      quenchData: {
        gasQuenchSpeed: data.quenchData?.gasQuenchSpeed || [],
        gasQuenchPressure: data.quenchData?.gasQuenchPressure || [],
        oilQuenchSpeed: data.quenchData?.oilQuenchSpeed || [],
        oilTemperature: data.quenchData?.oilTemperature || '',
        oilTempUnit: data.quenchData?.oilTempUnit || '',
        oilInertingPressure: data.quenchData?.oilInertingPressure || '',
        oilInertingDelay: data.quenchData?.oilInertingDelay || '',
        oilInertingDelayUnit: data.quenchData?.oilInertingDelayUnit || '',
        oilDrippingTime: data.quenchData?.oilDrippingTime || '',
        oilDrippingTimeUnit: data.quenchData?.oilDrippingTimeUnit || ''
      },
      
      // Données de résultats
      resultsData: {
        results: data.resultsData?.results || []
      },
      
      // Notes (ancien champ)
      notes: data.notes || ''
    };
  };

  // Hook pour la fonctionnalité copy/paste
  const { handleCopy, handlePaste, message: copyPasteMessage } = useCopyPaste({
    formType: 'trials',
    getFormData: () => formData,
    setFormData,
    formatForApi,
    parseFromApi
  });

  return {
    // États du formulaire
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    message: message || copyPasteMessage, // Combiner les messages
    setMessage,
    fetchingTest,
    
    // Options et styles pour les selects
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
    gasOptions,
    rampOptions,
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,
    getLengthUnitOptions, 
    getWeightUnitOptions, 
    getTimeUnitOptions, 
    getTemperatureUnitOptions, 
    getPressureUnitOptions, 
    getHardnessUnitOptions,
    selectStyles,
    
    // Nouvelle gestion des fichiers
    tempFileId,
    setTempFileId,
    
    // Gestion de la confirmation de fermeture avec les nouveaux états et fonctions
    showConfirmModal, 
    pendingClose,
    isModified,      
    setModified,     
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose,
    
    // Handlers
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
    
    // Thermal cycle
    handleThermalCycleAdd,
    handleThermalCycleRemove,
    handleThermalCycleChange,
    
    // Chemical cycle
    handleChemicalCycleAdd,
    handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd,
    handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd,
    handleGasQuenchPressureRemove,
    handleOilQuenchSpeedAdd,
    handleOilQuenchSpeedRemove,
    handleResultBlocAdd,
    handleResultBlocRemove,
    handleSampleAdd,
    handleSampleRemove,
    handleHardnessResultAdd,
    handleHardnessResultRemove,
    handleEcdPositionAdd,
    handleEcdPositionRemove,
    handleEcdPositionChange,
    handleCreateOption,
    
    // Fonctions de gestion du temps
    convertSecondsToHMS,
    convertHMSToSeconds,
    handleTimeComponentChange,
    initializeTimeComponents,
    calculateProgramDuration,
    
    // Fonctions de rafraîchissement
    refreshLocationOptions,
    refreshStatusOptions,
    refreshMountingTypeOptions,
    refreshPositionTypeOptions,
    refreshProcessTypeOptions,
    refreshPreoxMediaOptions,
    refreshFurnaceTypeOptions,
    refreshHeatingCellOptions,
    refreshCoolingMediaOptions,
    refreshFurnaceSizeOptions,
    refreshQuenchCellOptions,
    refreshUnitOptions,
    refreshAllOptions,
    
    // Gestion des fichiers
    setFileAssociationCallback,
    
    // Fonctions d'import Excel
    fileInputRef,
    handleExcelImport,
    processExcelData,
    
    // Référence et fonction pour la gestion des données de courbe
    resultsSectionRef,
    flushAllCurveData,
    
    // Copy/Paste functionality
    handleCopy,
    handlePaste
  };
};

export default useTrialForm;
