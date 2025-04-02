// usePartForm.js

import { useState, useCallback } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import usePartSubmission from './modules/usePartSubmission';
import useOptionsData from './modules/useOptionsData';
import usePartData from './modules/usePartData';
import useSelectHelpers from './modules/useSelectHelpers';

const usePartForm = (part, onClose, onPartCreated, onPartUpdated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.orderId;

  // État pour stocker la fonction de rappel d'association de fichiers
  const [fileAssociationCallback, setFileAssociationCallback] = useState(null);
  
  // Fonction de rappel pour recevoir la méthode d'association de fichiers
  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationCallback(() => associateFilesFunc);
  }, []);
  
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
  
  // Chargement des options pour les selects et récupération de la fonction de rafraîchissement
  const { refreshSteelOptions } = useOptionsData(
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
  const { handleSubmit } = usePartSubmission(
    formData, 
    parentId,
    setFormData, 
    validate,
    part,
    setLoading, 
    setMessage, 
    onPartCreated, 
    onPartUpdated, 
    onClose,
    fileAssociationCallback
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
    handleFileAssociationNeeded,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles,
    refreshSteels: refreshSteelOptions // Exposer la fonction de rafraîchissement
  };
};

export default usePartForm;
