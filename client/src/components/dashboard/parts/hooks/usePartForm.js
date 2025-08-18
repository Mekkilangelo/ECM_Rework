// usePartForm.js

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import usePartHandlers from './modules/usePartHandlers';
import useFormValidation from './modules/useFormValidation';
import usePartSubmission from './modules/usePartSubmission';
import useOptionsFetcher from '../../../../hooks/useOptionsFetcher';
import usePartData from './modules/usePartData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import useCopyPaste from '../../../../hooks/useCopyPaste';

const usePartForm = (part, onClose, onPartCreated, onPartUpdated, viewMode = false) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.orderId;

  // État pour stocker la fonction de rappel d'association de fichiers
  const [fileAssociationCallback, setFileAssociationCallback] = useState(null);
  // Fonction de rappel pour recevoir la méthode d'association de fichiers
  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationCallback(() => associateFilesFunc);
  }, []);
  
  // État du formulaire et initialisation (sans les options de select)
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
    setParentId
  } = useFormState();

  // Définir les options à charger avec useRef pour éviter les recréations
  const optionsConfig = useRef({
    fetchClientOptions: false,
    fetchSteelOptions: true,     // Activer les options acier
    fetchPartOptions: true,      // Activer les options pièces (désignations)
    fetchTestOptions: false,
    fetchFurnaceOptions: false,
    fetchUnitOptions: true       // Activer les options unités
  }).current;

  // Utiliser le hook unifié pour charger les options
  const {
    // Options que nous allons utiliser
    designationOptions,
    steelOptions,
    // Options d'unités
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,
    
    // Fonctions utilitaires générales
    selectStyles,
    getSelectedOption,
    
    // Fonctions de rafraîchissement
    refreshSteelOptions,
    refreshDesignationOptions,
    refreshUnitOptions,
    refreshAllOptions
  } = useOptionsFetcher(setLoading, optionsConfig);

  // Fonction pour filtrer les options d'unités par type
  // eslint-disable-next-line no-unused-vars
  const filterUnitsByType = useCallback((units, type) => {
    if (!units || !Array.isArray(units)) return [];
    return units.filter(unit => unit.type === type);
  }, []);

  // Regrouper les fonctions de rafraîchissement pour les passer à useFormHandlers
  const refreshFunctions = {
    refreshDesignationOptions,
    refreshSteelOptions,
    refreshUnitOptions,
    refreshAllOptions
  };
    // Handlers pour le formulaire - en mode lecture seule, ces handlers ne modifient pas les données
  const { 
    handleChange, 
    handleSelectChange,
    handleCreateOption,
    // Handlers spécifiques aux spécifications
    addHardnessSpec,
    removeHardnessSpec,
    updateHardnessSpec,
    addEcdSpec,
    removeEcdSpec,
    updateEcdSpec
  } = usePartHandlers(
    formData, 
    setFormData, 
    errors, 
    setErrors,
    refreshFunctions,
    viewMode // Transmettre le mode lecture seule
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
  
  // Soumission du formulaire au serveur - désactivée en mode lecture seule
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
    fileAssociationCallback,
    viewMode // Transmettre le mode lecture seule
  );
  // Utiliser notre hook amélioré pour la gestion de la confirmation de fermeture
  // En mode lecture seule, la confirmation n'est pas nécessaire
  const { 
    showConfirmModal, 
    setShowConfirmModal, // Ajout pour les tests de debug
    pendingClose, 
    isModified,
    setModified,
    resetInitialState,
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData,
    loading,
    fetchingPart,
    handleSubmit,
    onClose,
    viewMode // Passer le mode lecture seule
  );

  // Fonction pour formater les données pour l'API/copie
  const formatForApi = useCallback((data) => {
    return {
      // Informations de base
      name: data.name || '',
      designation: data.designation || '',
      clientDesignation: data.clientDesignation || '',
      reference: data.reference || '',
      quantity: data.quantity || 1,
      description: data.description || '',
      steelId: data.steelId || null,
      steel: data.steel || '',
      
      // Dimensions
      length: data.length || '',
      lengthUnit: data.lengthUnit || 'mm',
      width: data.width || '',
      widthUnit: data.widthUnit || 'mm',
      height: data.height || '',
      thickness: data.thickness || '',
      thicknessUnit: data.thicknessUnit || 'mm',
      dimensionsUnit: data.dimensionsUnit || '',
      diameterIn: data.diameterIn || '',
      diameterOut: data.diameterOut || '',
      diameterUnit: data.diameterUnit || '',
      weight: data.weight || '',
      weightUnit: data.weightUnit || 'kg',
      
      // Spécifications de dureté - anciennes propriétés
      coreHardnessMin: data.coreHardnessMin || '',
      coreHardnessMax: data.coreHardnessMax || '',
      coreHardnessUnit: data.coreHardnessUnit || '',
      surfaceHardnessMin: data.surfaceHardnessMin || '',
      surfaceHardnessMax: data.surfaceHardnessMax || '',
      surfaceHardnessUnit: data.surfaceHardnessUnit || '',
      toothHardnessMin: data.toothHardnessMin || '',
      toothHardnessMax: data.toothHardnessMax || '',
      toothHardnessUnit: data.toothHardnessUnit || '',
      
      // Spécifications ECD - anciennes propriétés
      ecdDepthMin: data.ecdDepthMin || '',
      ecdDepthMax: data.ecdDepthMax || '',
      ecdHardness: data.ecdHardness || '',
      ecdHardnessUnit: data.ecdHardnessUnit || '',
      
      // Spécifications nouvelles (tableaux)
      hardnessSpecs: data.hardnessSpecs || [],
      ecdSpecs: data.ecdSpecs || [],
      
      // Notes
      notes: data.notes || ''
    };
  }, []);

  // Fonction pour parser les données depuis l'API/collage
  const parseFromApi = useCallback((data) => {
    return {
      // Informations de base
      name: data.name || '',
      designation: data.designation || '',
      clientDesignation: data.clientDesignation || '',
      reference: data.reference || '',
      quantity: data.quantity || 1,
      description: data.description || '',
      steelId: data.steelId || null,
      steel: data.steel || '',
      
      // Dimensions
      length: data.length || '',
      lengthUnit: data.lengthUnit || 'mm',
      width: data.width || '',
      widthUnit: data.widthUnit || 'mm',
      height: data.height || '',
      thickness: data.thickness || '',
      thicknessUnit: data.thicknessUnit || 'mm',
      dimensionsUnit: data.dimensionsUnit || '',
      diameterIn: data.diameterIn || '',
      diameterOut: data.diameterOut || '',
      diameterUnit: data.diameterUnit || '',
      weight: data.weight || '',
      weightUnit: data.weightUnit || 'kg',
      
      // Spécifications de dureté - anciennes propriétés
      coreHardnessMin: data.coreHardnessMin || '',
      coreHardnessMax: data.coreHardnessMax || '',
      coreHardnessUnit: data.coreHardnessUnit || '',
      surfaceHardnessMin: data.surfaceHardnessMin || '',
      surfaceHardnessMax: data.surfaceHardnessMax || '',
      surfaceHardnessUnit: data.surfaceHardnessUnit || '',
      toothHardnessMin: data.toothHardnessMin || '',
      toothHardnessMax: data.toothHardnessMax || '',
      toothHardnessUnit: data.toothHardnessUnit || '',
      
      // Spécifications ECD - anciennes propriétés
      ecdDepthMin: data.ecdDepthMin || '',
      ecdDepthMax: data.ecdDepthMax || '',
      ecdHardness: data.ecdHardness || '',
      ecdHardnessUnit: data.ecdHardnessUnit || '',
      
      // Spécifications nouvelles (tableaux)
      hardnessSpecs: data.hardnessSpecs || [],
      ecdSpecs: data.ecdSpecs || [],
      
      // Notes
      notes: data.notes || ''
    };
  }, []);

  // Hook pour la fonctionnalité copy/paste
  const { handleCopy, handlePaste, message: copyPasteMessage } = useCopyPaste({
    formType: 'parts',
    formData,
    setFormData,
    formatForApi,
    parseFromApi
  });

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
    fetchingPart,
    message: message || copyPasteMessage, // Combiner les messages
    parentId,
    designationOptions,
    steelOptions,
    // Ajouter les options d'unités qui manquent
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,    handleChange,
    handleSelectChange,
    handleCreateOption,
    handleSubmit,
    handleFileAssociationNeeded,
    getSelectedOption,
    selectStyles,
    refreshSteels: refreshSteelOptions,
    setFileAssociationCallback,
    // Handlers spécifiques aux spécifications
    addHardnessSpec,
    removeHardnessSpec,
    updateHardnessSpec,
    addEcdSpec,
    removeEcdSpec,
    updateEcdSpec,
    isModified,
    setModified,
    showConfirmModal,
    setShowConfirmModal, // Ajout pour les tests de debug
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    // Copy/Paste functionality
    handleCopy,
    handlePaste
  };
};

export default usePartForm;
