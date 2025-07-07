import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useTestHandlers from './modules/useTestHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
import useTestSubmission from './modules/useTestSubmission';
import useTestData from './modules/useTestData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import useExcelImport from './modules/useExcelImport';

const useTestForm = (test, onClose, onTestCreated, onTestUpdated, viewMode = false) => {
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

  // Gestion des fichiers temporaires
  const [tempFileId, setTempFileId] = useState(null);

  // State for fetching test
  const [fetchingTest, setFetchingTest] = useState(false);

  // Référence pour la section des résultats (pour flusher les données de courbe)
  const resultsSectionRef = useRef(null);
  
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

  // Gestion des fichiers temporaires
  const [tempFileId, setTempFileId] = useState(null);

  // State for fetching test
  const [fetchingTest, setFetchingTest] = useState(false);

  // Référence pour la section des résultats (pour flusher les données de courbe)
  const resultsSectionRef = useRef(null);
  // Configuration stable pour les options (éviter les re-renders)
  const optionsConfig = useMemo(() => ({
    // Activer uniquement les options nécessaires pour les tests
    fetchClientOptions: false,
    fetchSteelOptions: false,
    fetchPartOptions: false,
    fetchTestOptions: true,      // Activer les options de test
    fetchFurnaceOptions: true,   // Activer les options de four
    fetchUnitOptions: true       // Activer les options d'unité
  }), []);

  // Load test data in edit mode
  useTestData(
    test,
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
    // Fonctions d'accès aux unités
    getLengthUnitOptions, 
    getWeightUnitOptions, 
    getTimeUnitOptions, 
    getTemperatureUnitOptions, 
    getPressureUnitOptions, 
    getHardnessUnitOptions,
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
    // Handlers pour le formulaire
  const { 
    handleChange, handleSelectChange, 
    handleThermalCycleAdd, handleThermalCycleRemove, handleThermalCycleChange,
    handleChemicalCycleAdd, handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd, handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd, handleGasQuenchPressureRemove,    handleOilQuenchSpeedAdd, handleOilQuenchSpeedRemove, 
    handleResultBlocAdd, handleResultBlocRemove,
    handleSampleAdd, handleSampleRemove,    handleHardnessResultAdd, handleHardnessResultRemove,
    handleCreateOption, // Ajouter le handler pour la création d'options
    handleEcdPositionAdd, // Nouvelles fonctions pour la gestion des positions ECD
    handleEcdPositionRemove,
    handleEcdPositionChange,
    handleHardnessChange,
    handleEcdChange,
    flushAllCurveData, // Nouvelle fonction pour flusher les données de courbe
    // Fonctions de gestion du temps
    convertSecondsToHMS,
    convertHMSToSeconds,
    handleTimeComponentChange,
    initializeTimeComponents
  } = useTestHandlers(formData, setFormData, errors, setErrors, refreshFunctions);

  // Hook pour la gestion de l'import Excel
  const {
    fileInputRef,
    getCurveSectionRef,
    handleExcelImport,
    processExcelData
  } = useExcelImport(
    formData,
    handleChange,
    handleHardnessResultAdd,
    handleHardnessChange,
    handleEcdPositionAdd,
    handleEcdPositionChange,
    handleEcdChange,
    hardnessUnitOptions
  );
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, parentId, setErrors);
    // Soumission du formulaire au serveur
  const { handleSubmit } = useTestSubmission(
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
    viewMode // Transmettre le mode lecture seule
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
    saveAndClose   } = useCloseConfirmation(
    formData,        // État actuel du formulaire 
    loading,         // État de chargement
    fetchingTest,    // État de récupération des données
    handleSubmit,    // Fonction de soumission
    onClose,         // Fonction de fermeture
    viewMode         // Mode lecture seule
  );

  // Réinitialiser l'état initial après une sauvegarde réussie
  useEffect(() => {
    if (message && message.type === 'success') {
      resetInitialState();
    }
  }, [message, resetInitialState]);
  
  return {
    formData,
    errors,
    loading,
    fetchingTest,
    message,
    parentId,
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
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
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
    // Thermal cycle
    handleThermalCycleAdd,
    handleThermalCycleRemove,
    handleThermalCycleChange, // Ajout de la fonction pour gérer la logique de rampe automatique
    // Chemical cycle
    handleChemicalCycleAdd,
    handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd,
    handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd,
    handleGasQuenchPressureRemove,
    handleOilQuenchSpeedAdd,    handleOilQuenchSpeedRemove,
    handleResultBlocAdd,
    handleResultBlocRemove,
    handleSampleAdd,
    handleSampleRemove,
    handleHardnessResultAdd,
    handleHardnessResultRemove,
    // Nouvelles fonctions pour la gestion des positions ECD
    handleEcdPositionAdd,    handleEcdPositionRemove,
    handleEcdPositionChange,
    // Ajout du handler pour créer de nouvelles options
    handleCreateOption,
    // Fonctions de gestion du temps
    convertSecondsToHMS,
    convertHMSToSeconds,
    handleTimeComponentChange,
    initializeTimeComponents,
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
    // Ajouter setFileAssociationCallback à ce qui est retourné
    setFileAssociationCallback,
    // Fonctions d'import Excel
    fileInputRef,
    getCurveSectionRef,
    handleExcelImport,
    processExcelData,
    handleEcdChange,
    handleHardnessChange,
    // Référence et fonction pour la gestion des données de courbe
    resultsSectionRef,
    flushAllCurveData
  };
};

export default useTestForm;