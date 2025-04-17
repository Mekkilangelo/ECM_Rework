import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from './modules/useOptionsFetcher';
import useTestSubmission from './modules/useTestSubmission';
import useTestData from './modules/useTestData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';

const useTestForm = (test, onClose, onTestCreated, onTestUpdated) => {
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

  // Stocker les données initiales pour comparer les changements
  const [initialFormData, setInitialFormData] = useState(null);

  // Gestion des fichiers temporaires
  const [tempFileId, setTempFileId] = useState(null);

  // State for fetching test
  const [fetchingTest, setFetchingTest] = useState(false);

  // Load test data in edit mode
  useTestData(
    test,
    setFormData,
    setMessage,
    setFetchingTest
  );
  
  // Chargement des options pour les selects
  const { 
    locationOptions, statusOptions, mountingTypeOptions, positionTypeOptions, 
    processTypeOptions, preoxMediaOptions, furnaceTypeOptions, heatingCellOptions, 
    coolingMediaOptions, furnaceSizeOptions, quenchCellOptions, gasOptions, rampOptions,
    selectStyles, getSelectedOption, lengthUnitOptions, weightUnitOptions, 
    timeUnitOptions, temperatureUnitOptions, pressureUnitOptions, hardnessUnitOptions,
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
  } = useOptionsFetcher(setLoading);
  
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
    handleThermalCycleAdd, handleThermalCycleRemove,
    handleChemicalCycleAdd, handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd, handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd, handleGasQuenchPressureRemove,
    handleOilQuenchSpeedAdd, handleOilQuenchSpeedRemove, 
    handleResultBlocAdd, handleResultBlocRemove,
    handleHardnessResultAdd, handleHardnessResultRemove,
    handleCreateOption // Ajouter le handler pour la création d'options
  } = useFormHandlers(formData, setFormData, errors, setErrors, refreshFunctions);
  
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
    fileAssociationCallback
  );
  
  // Gestion de la confirmation de fermeture
  const { 
    showConfirmModal, 
    pendingClose, 
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData, 
    initialFormData || formData, 
    handleSubmit, 
    onClose
  );
  
  // Mettre à jour les données initiales une fois chargées
  useEffect(() => {
    if (!fetchingTest && formData && !initialFormData) {
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [fetchingTest, formData, initialFormData]);
  
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
    selectStyles,
    // Nouvelle gestion des fichiers
    tempFileId,
    setTempFileId,
    // Gestion de la confirmation de fermeture
    showConfirmModal, 
    pendingClose, 
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose,
    // Thermal cycle
    handleThermalCycleAdd,
    handleThermalCycleRemove,
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
    handleHardnessResultAdd,
    handleHardnessResultRemove,
    // Ajout du handler pour créer de nouvelles options
    handleCreateOption,
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
    setFileAssociationCallback
  };
};

export default useTestForm;