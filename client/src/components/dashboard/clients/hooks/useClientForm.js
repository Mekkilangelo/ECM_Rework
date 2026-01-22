// client\src\components\dashboard\clients\hooks\useClientForm.js
import { useEffect, useRef } from 'react';
import useFormState from './modules/useFormState';
import useClientHandlers from './modules/useClientHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
import useClientSubmission from './modules/useClientSubmission';
import useClientData from './modules/useClientData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import useCopyPaste from '../../../../hooks/useCopyPaste';

const useClientForm = (client, onClose, onClientCreated, onClientUpdated, viewMode = false) => {
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

  // Handlers pour le formulaire - désactivés en mode lecture seule
  const {
    handleChange,
    handleSelectChange
  } = useClientHandlers(
    formData, 
    setFormData, 
    errors, 
    setErrors, 
    viewMode // Passer le mode lecture seule aux handlers
  );

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
    setErrors,
    onCreated: onClientCreated,
    onUpdated: onClientUpdated,
    onClose,
    viewMode // Passer le mode lecture seule à la soumission
  });

  // Gestion de la confirmation de fermeture avec notre hook amélioré
  // En mode lecture seule, on désactive la vérification des modifications
  const { 
    showConfirmModal, 
    pendingClose, 
    isModified,      // État qui indique si le formulaire a été modifié
    setModified,     // Fonction pour définir manuellement l'état modifié si nécessaire
    resetInitialState, // Fonction pour réinitialiser l'état initial
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData,        // État actuel du formulaire 
    loading,         // État de chargement
    fetchingClient,  // État de récupération des données
    handleSubmit,    // Fonction de soumission
    onClose,         // Fonction de fermeture
    viewMode         // Mode lecture seule - pour désactiver la vérification des modifications
  );

  // Lorsqu'une sauvegarde réussit, réinitialiser l'état initial
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
      client_code: data.client_code || '',
      country: data.country || '',
      city: data.city || '',
      client_group: data.client_group || '',
      address: data.address || '',
      description: data.description || ''
    };
  };

  // Fonction pour parser les données depuis l'API/collage
  const parseFromApi = (data) => {
    return {
      // Informations de base
      name: data.name || '',
      client_code: data.client_code || '',
      country: data.country || '',
      city: data.city || '',
      client_group: data.client_group || '',
      address: data.address || '',
      description: data.description || ''
    };
  };

  // Hook pour la fonctionnalité copy/paste
  const { handleCopy, handlePaste, message: copyPasteMessage } = useCopyPaste({
    formType: 'clients',
    getFormData: () => formData,
    setFormData,
    formatForApi,
    parseFromApi
  });

  return {
    formData,
    errors,
    loading,
    fetchingClient,
    message: message || copyPasteMessage, // Combiner les messages
    countryOptions,
    selectStyles,
    getSelectedOption,
    handleChange,
    handleSelectChange,
    handleSubmit,
    // États et fonctions liés à la confirmation de fermeture
    showConfirmModal,
    pendingClose,
    isModified,
    setModified,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    // Copy/Paste functionality
    handleCopy,
    handlePaste
  };
};

export default useClientForm;
