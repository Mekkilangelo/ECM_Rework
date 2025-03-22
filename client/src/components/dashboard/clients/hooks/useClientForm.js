import { useState } from 'react';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from './modules/useOptionsFetcher';
import useApiSubmission from './modules/useApiSubmission';
import useClientData from './modules/useClientData';

const useClientForm = (client, onClose, onClientCreated, onClientUpdated) => {
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
    fetchingClient,
    setFetchingClient 
  } = useFormState();
  
  // Chargement des options pour les selects
  const { 
    countryOptions, 
    selectStyles, 
    getSelectedOption 
  } = useOptionsFetcher(setLoading);

  // Chargement des données du client en mode édition
  useClientData(
    client, 
    setFormData, 
    setMessage, 
    setFetchingClient
  );
  
  // Handlers pour le formulaire
  const { 
    handleChange, 
    handleSelectChange 
  } = useFormHandlers(formData, setFormData, errors, setErrors);
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, setErrors);
  
  // Soumission du formulaire au serveur
  const { handleSubmit } = useApiSubmission(
    formData, 
    setFormData, 
    validate, 
    client,
    setLoading, 
    setMessage, 
    onClientCreated,
    onClientUpdated, 
    onClose
  );
  
  return {
    formData,
    errors,
    loading,
    fetchingClient,
    message,
    countryOptions,
    selectStyles,
    getSelectedOption,
    handleSelectChange,
    handleChange,
    handleSubmit
  };
};

export default useClientForm;