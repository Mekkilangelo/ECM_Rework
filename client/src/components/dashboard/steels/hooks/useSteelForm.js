import { useRef, useEffect } from 'react';
import useFormState from './modules/useFormState';
import useSteelHandlers from './modules/useSteelHandlers';
import useFormValidation from './modules/useFormValidation';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
import useSteelSubmission from './modules/useSteelSubmission';
import useSteelData from './modules/useSteelData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import useCopyPaste from '../../../../hooks/useCopyPaste';
import referenceService from '../../../../services/referenceService';

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
  
  // Handlers pour créer de nouvelles options dans les CreatableSelect
  // Ces handlers ajoutent les valeurs dans les tables de référence
  const handleCreateFamily = async (inputValue) => {
    if (!inputValue || viewMode) return;
    try {
      // Ajouter la valeur dans la table de référence ref_steel_family
      await referenceService.addValue('ref_steel_family', inputValue);
      // Mettre à jour formData avec la nouvelle valeur
      setFormData(prev => ({ ...prev, family: inputValue }));
    } catch (error) {
      console.error('Erreur lors de la création de la famille:', error);
    }
  };

  const handleCreateStandard = async (inputValue) => {
    if (!inputValue || viewMode) return;
    try {
      // Ajouter la valeur dans la table de référence ref_steel_standard
      await referenceService.addValue('ref_steel_standard', inputValue);
      // Mettre à jour formData avec la nouvelle valeur
      setFormData(prev => ({ ...prev, standard: inputValue }));
    } catch (error) {
      console.error('Erreur lors de la création du standard:', error);
    }
  };

  const handleCreateElement = async (inputValue) => {
    if (!inputValue || viewMode) return;
    try {
      // Ajouter la valeur dans la table de référence ref_steel_elements
      await referenceService.addValue('ref_steel_elements', inputValue);
      return inputValue; // Retourner la valeur pour l'utiliser dans handleChemicalElementChange
    } catch (error) {
      console.error('Erreur lors de la création de l\'élément:', error);
      return null;
    }
  };

  const handleCreateGrade = (inputValue) => {
    if (!inputValue || viewMode) return;
    // Le grade n'est pas dans une table de référence, mise à jour directe
    setFormData(prev => ({ ...prev, grade: inputValue }));
  };
  
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

  // Fonction pour formater les données pour l'API/copie
  const formatForApi = (data) => {
    return {
      // Informations de base
      grade: data.grade || '',
      family: data.family || '',
      standard: data.standard || '',
      
      // Éléments chimiques
      chemical_elements: data.chemical_elements || [],
      
      // Équivalents
      equivalents: data.equivalents || []
    };
  };

  // Fonction pour parser les données depuis l'API/collage
  const parseFromApi = (data) => {
    return {
      // Informations de base
      grade: data.grade || '',
      family: data.family || '',
      standard: data.standard || '',
      
      // Éléments chimiques
      chemical_elements: data.chemical_elements || [],
      
      // Équivalents
      equivalents: data.equivalents || []
    };
  };

  // Hook pour la fonctionnalité copy/paste
  const { handleCopy, handlePaste, message: copyPasteMessage } = useCopyPaste({
    formType: 'steels',
    formData,
    setFormData,
    formatForApi,
    parseFromApi
  });
  
  return {
    formData,
    errors,
    loading,
    fetchingSteel,
    message: message || copyPasteMessage, // Combiner les messages
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
    // Handlers pour CreatableSelect
    handleCreateFamily,
    handleCreateStandard,
    handleCreateElement,
    handleCreateGrade,
    // Gestion de la confirmation de fermeture avec les nouveaux états et fonctions
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

export default useSteelForm;
