// client\src\components\dashboard\clients\hooks\useClientForm.js
import { useState, useEffect } from 'react';
import useFormState from './modules/useFormState';
import useClientHandlers from './modules/useClientHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from './modules/useOptionsFetcher';
import useClientSubmission from './modules/useClientSubmission';
import useClientData from './modules/useClientData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';

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

  // Stocker les données initiales pour comparer les changements
  const [initialFormData, setInitialFormData] = useState(null);

  // Handlers pour le formulaire
  const {
    handleChange,
    handleSelectChange
  } = useClientHandlers(formData, setFormData, errors, setErrors);

  // Validation du formulaire
  const { validate } = useFormValidation(formData, setErrors);


  const { handleSubmit } = useClientSubmission({
    formData,
    setFormData,
    validate,
    entity: client,
    setLoading,
    setMessage,
    onCreated: onClientCreated,
    onUpdated: onClientUpdated,
    onClose
  });

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
    if (!fetchingClient && formData && !initialFormData) {
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [fetchingClient, formData, initialFormData]);

  return {
    formData,
    errors,
    loading,
    fetchingClient,
    message,
    countryOptions,
    selectStyles,
    getSelectedOption,
    handleChange,
    handleSelectChange,
    handleSubmit,
    showConfirmModal,
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  };
};

export default useClientForm;
