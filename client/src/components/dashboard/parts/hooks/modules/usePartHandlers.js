// usePartHandlers.js - Hook spécifique pour les pièces
import { useCallback } from 'react';
import useGlobalFormHandlers from '../../../../../hooks/useFormHandlers';

const usePartHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions = {}, viewMode = false) => {
  // Récupérer les gestionnaires de formulaire globaux
  const globalHandlers = useGlobalFormHandlers(formData, setFormData, errors, setErrors, refreshOptionsFunctions);
  
  // Override handleSelectChange pour gérer le cas spécifique du steel
  const handleSelectChange = useCallback((selectedOption, fieldInfo) => {
    const name = typeof fieldInfo === 'string' 
      ? fieldInfo 
      : (fieldInfo.name || fieldInfo.field || null);
    
    // Cas spécifique pour la sélection de l'acier
    if (name === 'steel') {
      if (selectedOption) {
        setFormData(prev => ({
          ...prev,
          steel: selectedOption.value,          // Le grade de l'acier
          steelId: selectedOption.nodeId || null  // L'ID du nœud de l'acier
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          steel: null,
          steelId: null
        }));
      }
      
      // Effacer l'erreur si elle existe
      if (errors && errors.steel) {
        setErrors(prev => ({ ...prev, steel: null }));
      }
      return;
    }
    
    // Pour tous les autres champs, utiliser le handler global
    globalHandlers.handleSelectChange(selectedOption, fieldInfo);
  }, [setFormData, errors, setErrors, globalHandlers]);
  
  // Handlers pour les spécifications de dureté
  const addHardnessSpec = useCallback(() => {
    if (viewMode) return;
    
    const newSpec = {
      name: '',
      min: '',
      max: '',
      unit: ''
    };
    
    const hardnessSpecs = formData.hardnessSpecs || [];
    const updatedSpecs = [...hardnessSpecs, newSpec];
    
    globalHandlers.handleChange({
      target: {
        name: 'hardnessSpecs',
        value: updatedSpecs
      }
    });
  }, [formData.hardnessSpecs, globalHandlers, viewMode]);
  const removeHardnessSpec = useCallback((index) => {
    if (viewMode) return;
    
    const hardnessSpecs = formData.hardnessSpecs || [];
    const updatedSpecs = hardnessSpecs.filter((spec, i) => i !== index);
    
    globalHandlers.handleChange({
      target: {
        name: 'hardnessSpecs',
        value: updatedSpecs
      }
    });
  }, [formData.hardnessSpecs, globalHandlers, viewMode]);
  const updateHardnessSpec = useCallback((index, field, value) => {
    if (viewMode) return;
    
    const hardnessSpecs = formData.hardnessSpecs || [];
    const updatedSpecs = hardnessSpecs.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    );
    
    globalHandlers.handleChange({
      target: {
        name: 'hardnessSpecs',
        value: updatedSpecs
      }
    });
  }, [formData.hardnessSpecs, globalHandlers, viewMode]);  // Handlers pour les spécifications ECD
  const addEcdSpec = useCallback(() => {
    if (viewMode) return;
    
    const newSpec = {
      name: '',
      depthMin: '',
      depthMax: '',
      depthUnit: '',
      hardness: '',
      hardnessUnit: ''
    };
    
    const ecdSpecs = formData.ecdSpecs || [];
    const updatedSpecs = [...ecdSpecs, newSpec];
    
    globalHandlers.handleChange({
      target: {
        name: 'ecdSpecs',
        value: updatedSpecs
      }
    });
  }, [formData.ecdSpecs, globalHandlers, viewMode]);
  const removeEcdSpec = useCallback((index) => {
    if (viewMode) return;
    
    const ecdSpecs = formData.ecdSpecs || [];
    const updatedSpecs = ecdSpecs.filter((spec, i) => i !== index);
    
    globalHandlers.handleChange({
      target: {
        name: 'ecdSpecs',
        value: updatedSpecs
      }
    });
  }, [formData.ecdSpecs, globalHandlers, viewMode]);
  const updateEcdSpec = useCallback((index, field, value) => {
    if (viewMode) return;
    
    const ecdSpecs = formData.ecdSpecs || [];
    const updatedSpecs = ecdSpecs.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    );
    
    globalHandlers.handleChange({
      target: {
        name: 'ecdSpecs',
        value: updatedSpecs
      }
    });
  }, [formData.ecdSpecs, globalHandlers, viewMode]);
  
  return {
    ...globalHandlers,
    handleSelectChange, // Override le handleSelectChange global
    // Handlers spécifiques aux spécifications
    addHardnessSpec,
    removeHardnessSpec,
    updateHardnessSpec,
    addEcdSpec,
    removeEcdSpec,
    updateEcdSpec
  };
};

export default usePartHandlers;