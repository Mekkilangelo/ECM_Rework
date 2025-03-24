import { useState, useEffect } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from './modules/useOptionsFetcher';
import useApiSubmission from './modules/useApiSubmission';
import useTestData from './modules/useTestData';

const useTestForm = (test, onClose, onTestCreated, onTestUpdated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.partId;
  
  // État du formulaire et initialisation
  const { formData, setFormData, errors, setErrors, loading, setLoading, message, setMessage } = useFormState();

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
    processTypeOptions, furnaceTypeOptions, heatingCellOptions, coolingMediaOptions, 
    furnaceSizeOptions, quenchCellOptions, gasOptions, rampOptions,
    selectStyles, getSelectedOption, lengthUnitOptions, weightUnitOptions, 
    timeUnitOptions, temperatureUnitOptions, pressureUnitOptions, hardnessUnitOptions 
  } = useOptionsFetcher(setLoading);
  
  // Handlers pour le formulaire
  const { 
    handleChange, handleSelectChange, 
    handleThermalCycleAdd, handleThermalCycleRemove,
    handleChemicalCycleAdd, handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd, handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd, handleGasQuenchPressureRemove,
    handleOilQuenchSpeedAdd, handleOilQuenchSpeedRemove, 
    handleResultBlocAdd, handleResultBlocRemove,
    handleHardnessResultAdd, handleHardnessResultRemove
  } = useFormHandlers(formData, setFormData, errors, setErrors);
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, parentId, setErrors);
  
  // Soumission du formulaire au serveur
  const { formatDataForApi, handleSubmit } = useApiSubmission(
    formData, 
    setFormData, 
    validate, 
    parentId,
    test, 
    setLoading, 
    setMessage, 
    onTestCreated,
    onTestUpdated,
    onClose
  );
  
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
    pressureUnitOptions,
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,
    selectStyles,
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
    handleHardnessResultRemove
  };
};

export default useTestForm;