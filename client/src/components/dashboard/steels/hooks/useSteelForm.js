import { useRef, useEffect } from 'react';
import useFormState from './modules/useFormState';
import useSteelHandlers from './modules/useSteelHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
import useSteelSubmission from './modules/useSteelSubmission';
import useSteelData from './modules/useSteelData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';

const useSteelForm = (steel, onClose, onSteelCreated, onSteelUpdated, viewMode = false) => {
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
  
  // Utiliser useRef pour éviter la recréation des options à chaque rendu
  const optionsConfig = useRef({
    // Activer uniquement les options nécessaires pour les aciers
    fetchClientOptions: false,
    fetchSteelOptions: true,     // Activer les options acier
    fetchPartOptions: false,
    fetchTestOptions: false,
    fetchFurnaceOptions: false,
    fetchUnitOptions: false
  }).current;
  
  // Chargement des options pour les selects avec le hook unifié
  const { 
    steelFamilyOptions, 
    steelStandardOptions,
    steelGradeOptions,
    elementOptions,
    selectStyles, 
    getSelectedOption
  } = useOptionsFetcher(setLoading, optionsConfig);

  // Chargement des données de l'acier en mode édition
  useSteelData(
    steel, 
    setFormData, 
    setMessage, 
    setFetchingSteel
  );
  
  // Handlers pour le formulaire, les équivalents et les éléments chimiques
  // En mode lecture seule, ces handlers ne devraient pas modifier les données
  const { 
    handleChange, 
    handleSelectChange,
    handleAddEquivalent,
    handleRemoveEquivalent,
    handleAddChemicalElement,
    handleRemoveChemicalElement,
    handleChemicalElementChange,
    handleRateTypeChange,
    handleEquivalentChange
  } = useSteelHandlers(formData, setFormData, errors, setErrors, viewMode);
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, setErrors);
    // Soumission du formulaire au serveur en utilisant le hook factorisé
  // En mode lecture seule, la soumission est désactivée
  const { handleSubmit } = useSteelSubmission({
    formData, 
    setFormData, 
    validate, 
    entity: steel,
    setLoading, 
    setMessage, 
    onCreated: onSteelCreated,
    onUpdated: onSteelUpdated, 
    onClose,
    viewMode // Transmettre le mode lecture seule
  });
  
  // Utiliser notre hook amélioré pour la gestion de la confirmation de fermeture
  // En mode lecture seule, on n'a pas besoin de confirmation pour fermer
  const { 
    showConfirmModal, 
    pendingClose, 
    isModified,
    setModified,
    resetInitialState,
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData,        // État actuel du formulaire 
    loading,         // État de chargement
    fetchingSteel,   // État de récupération des données
    handleSubmit,    // Fonction de soumission
    onClose,         // Fonction de fermeture
    viewMode         // Mode lecture seule - pour désactiver la vérification des modifications
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
    handleRateTypeChange,
    handleEquivalentChange,
    // Gestion de la confirmation de fermeture avec les nouveaux états et fonctions
    showConfirmModal, 
    pendingClose,
    isModified,
    setModified,
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose
  };
};

export default useSteelForm;
