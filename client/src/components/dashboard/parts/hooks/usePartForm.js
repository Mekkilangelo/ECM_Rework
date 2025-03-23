import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import useApiSubmission from './modules/useApiSubmission';
import useOptionsData from './modules/useOptionsData';
import usePartData from './modules/usePartData';
import useSelectHelpers from './modules/useSelectHelpers';

const usePartForm = (part, onClose, onPartCreated, onPartUpdated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.orderId;
  
  // État du formulaire et initialisation
  const { 
    formData, 
    setFormData, 
    errors, 
    setErrors, 
    loading, 
    setLoading, 
    message, 
    setMessage,
    fetchingPart,
    setFetchingPart,
    designationOptions,
    setDesignationOptions,
    unitOptions,
    setUnitOptions,
    steelOptions,
    setSteelOptions,
    setParentId
  } = useFormState();
  
  // Utilitaires pour les options de Select
  const {
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles
  } = useSelectHelpers(unitOptions);
  
  // Handlers pour le formulaire
  const { 
    handleChange, 
    handleSelectChange 
  } = useFormHandlers(formData, setFormData, errors, setErrors);
  
  // Chargement des options pour les selects
  useOptionsData(
    setLoading,
    setDesignationOptions,
    setUnitOptions,
    setSteelOptions
  );
  
  // Chargement des données de la pièce en mode édition
  usePartData(
    part, 
    setFormData, 
    setMessage, 
    setFetchingPart,
    setParentId
  );
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, parentId, setErrors);
  
  // Soumission du formulaire au serveur
  const { handleSubmit } = useApiSubmission(
    formData, 
    parentId,
    setFormData, 
    validate,
    part,
    setLoading, 
    setMessage, 
    onPartCreated, 
    onPartUpdated, 
    onClose
  );

  return {
    formData,
    errors,
    loading,
    fetchingPart,
    message,
    parentId,
    designationOptions,
    steelOptions,
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles
  };
};

export default usePartForm;
