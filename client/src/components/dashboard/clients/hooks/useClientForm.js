// client\src\components\dashboard\clients\hooks\useClientForm.js
import { useEffect, useRef } from 'react';
import useFormState from './modules/useFormState';
import useClientHandlers from './modules/useClientHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
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

  // Utiliser useRef pour éviter la recréation des options à chaque rendu
  const optionsConfig = useRef({
    // Utiliser les noms de paramètres corrects pour le hook unifié
    fetchClientOptions: true,  // Activer uniquement les options client
    fetchSteelOptions: false,  // Désactiver le reste
    fetchPartOptions: false,
    fetchTestOptions: false,
    fetchFurnaceOptions: false,
    fetchUnitOptions: false
  }).current;

  // Chargement des options pour les selects avec le hook unifié
  const {
    countryOptions,
    selectStyles,
    getSelectedOption
  } = useOptionsFetcher(setLoading, optionsConfig);

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
  } = useClientHandlers(formData, setFormData, errors, setErrors);

  // Validation du formulaire
  const { validate } = useFormValidation(formData, setErrors);

  // Soumission du formulaire avec le hook factorisé
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

  // Gestion de la confirmation de fermeture avec notre hook amélioré
  const { 
    showConfirmModal, 
    pendingClose, 
    isModified,      // Nouveau! État qui indique si le formulaire a été modifié
    setModified,     // Nouveau! Fonction pour définir manuellement l'état modifié si nécessaire
    resetInitialState, // Nouveau! Fonction pour réinitialiser l'état initial
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData,        // État actuel du formulaire 
    loading,         // État de chargement
    fetchingClient,  // État de récupération des données
    handleSubmit,    // Fonction de soumission
    onClose          // Fonction de fermeture
  );

  // Lorsqu'une sauvegarde réussit, réinitialiser l'état initial
  useEffect(() => {
    if (message && message.type === 'success') {
      resetInitialState();
    }
  }, [message, resetInitialState]);

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
    // États et fonctions liés à la confirmation de fermeture
    showConfirmModal,
    pendingClose,
    isModified,       // Nouveau! Exposer l'état modifié
    setModified,      // Nouveau! Exposer la fonction pour définir manuellement l'état modifié
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  };
};

export default useClientForm;
