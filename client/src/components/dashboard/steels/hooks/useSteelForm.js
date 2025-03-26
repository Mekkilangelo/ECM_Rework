import { useState } from 'react';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from './modules/useOptionsFetcher';
import useApiSubmission from './modules/useApiSubmission';
import useSteelData from './modules/useSteelData';
import useEquivalentsHandlers from './modules/useEquivalentsHandlers';
import useChemicalElementsHandlers from './modules/useChemicalElementsHandlers';

const useSteelForm = (steel, onClose, onSteelCreated, onSteelUpdated) => {
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
    fetchingSteel,
    setFetchingSteel 
  } = useFormState();
  
  // Chargement des options pour les selects
  const { 
    steelFamilyOptions, 
    steelStandardOptions,
    steelGradeOptions,
    elementOptions,
    selectStyles, 
    getSelectedOption 
  } = useOptionsFetcher(setLoading);

  // Chargement des données de l'acier en mode édition
  useSteelData(
    steel, 
    setFormData, 
    setMessage, 
    setFetchingSteel
  );
  
  // Handlers pour le formulaire
  const { 
    handleChange, 
    handleSelectChange 
  } = useFormHandlers(formData, setFormData, errors, setErrors);
  
  // Handlers pour les équivalents
  const {
    handleAddEquivalent,
    handleRemoveEquivalent
  } = useEquivalentsHandlers(formData, setFormData);
  
  // Handlers pour les éléments chimiques
  const {
    handleAddChemicalElement,
    handleRemoveChemicalElement,
    handleChemicalElementChange,
    handleRateTypeChange
  } = useChemicalElementsHandlers(formData, setFormData);
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, setErrors);
  
  // Soumission du formulaire au serveur
  const { handleSubmit } = useApiSubmission(
    formData, 
    setFormData, 
    validate, 
    steel,
    setLoading, 
    setMessage, 
    onSteelCreated,
    onSteelUpdated, 
    onClose
  );
  
  return {
    formData,
    errors,
    loading,
    fetchingSteel,
    message,
    steelFamilyOptions,
    steelStandardOptions,
    steelGradeOptions,
    elementOptions,
    selectStyles,
    getSelectedOption,
    handleSelectChange,
    handleChange,
    handleSubmit,
    handleAddEquivalent,
    handleRemoveEquivalent,
    handleAddChemicalElement,
    handleRemoveChemicalElement,
    handleChemicalElementChange,
    handleRateTypeChange
  };
};

export default useSteelForm;
