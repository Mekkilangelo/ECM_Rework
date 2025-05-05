// useSteelHandlers.js - Hook spécifique pour les aciers
import { useCallback } from 'react';
import useGlobalFormHandlers from '../../../../../hooks/useFormHandlers';

const useSteelHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions = {}) => {
  // Récupérer les gestionnaires de formulaire globaux
  const globalHandlers = useGlobalFormHandlers(formData, setFormData, errors, setErrors, refreshOptionsFunctions);
  
  // Fonction spécifique pour ajouter un équivalent d'acier
  const handleAddEquivalent = useCallback(() => {
    const newEquivalent = { steel_id: '', standard: '' };
    const equivalents = [...(formData.equivalents || [])];
    
    setFormData(prev => ({
      ...prev,
      equivalents: [...equivalents, newEquivalent]
    }));
  }, [formData, setFormData]);
  
  // Fonction spécifique pour supprimer un équivalent d'acier
  const handleRemoveEquivalent = useCallback((index) => {
    if (formData.equivalents && formData.equivalents.length > 0) {
      const equivalents = [...formData.equivalents];
      
      setFormData(prev => ({
        ...prev,
        equivalents: equivalents.filter((_, i) => i !== index)
      }));
    }
  }, [formData, setFormData]);
  
  // Fonction pour gérer les changements dans les équivalents (suivant le même modèle que ThermalCycleSection)
  const handleEquivalentChange = useCallback((index, field, value) => {
    if (formData.equivalents) {
      const updatedEquivalents = [...formData.equivalents];
      if (index >= 0 && index < updatedEquivalents.length) {
        updatedEquivalents[index] = { 
          ...updatedEquivalents[index], 
          [field]: value 
        };
        
        setFormData(prev => ({
          ...prev,
          equivalents: updatedEquivalents
        }));
      }
    }
  }, [formData, setFormData]);
  
  // Fonction spécifique pour ajouter un élément chimique
  const handleAddChemicalElement = useCallback(() => {
    const newElement = { element: '', rate_type: 'exact', value: '', min_value: '', max_value: '' };
    const chemical_elements = [...(formData.chemical_elements || [])];
    
    setFormData(prev => ({
      ...prev,
      chemical_elements: [...chemical_elements, newElement]
    }));
  }, [formData, setFormData]);
  
  // Fonction spécifique pour supprimer un élément chimique
  const handleRemoveChemicalElement = useCallback((index) => {
    if (formData.chemical_elements && formData.chemical_elements.length > 0) {
      const chemical_elements = [...formData.chemical_elements];
      
      setFormData(prev => ({
        ...prev,
        chemical_elements: chemical_elements.filter((_, i) => i !== index)
      }));
    }
  }, [formData, setFormData]);

  // Gestionnaire pour les changements d'éléments chimiques - version avec paramètres directs
  // Adapté selon le modèle utilisé dans ThermalCycleSection
  const handleChemicalElementChange = useCallback((index, field, value) => {
    if (formData.chemical_elements) {
      const updatedElements = [...formData.chemical_elements];
      if (index >= 0 && index < updatedElements.length) {
        updatedElements[index] = { 
          ...updatedElements[index], 
          [field]: value 
        };
        
        setFormData(prev => ({
          ...prev,
          chemical_elements: updatedElements
        }));
      }
    }
  }, [formData, setFormData]);

  // Gestionnaire pour le changement de type de taux - Corrigé pour prendre en compte l'index
  const handleRateTypeChange = useCallback((index, value) => {
    if (formData.chemical_elements) {
      const updatedElements = [...formData.chemical_elements];
      if (index >= 0 && index < updatedElements.length) {
        // Réinitialiser les valeurs selon le type
        if (value === 'exact') {
          updatedElements[index] = { 
            ...updatedElements[index], 
            rate_type: value,
            value: '',
            min_value: null,
            max_value: null
          };
        } else {
          updatedElements[index] = { 
            ...updatedElements[index], 
            rate_type: value,
            value: null,
            min_value: '',
            max_value: ''
          };
        }
        
        setFormData(prev => ({
          ...prev,
          chemical_elements: updatedElements
        }));
      }
    }
  }, [formData, setFormData]);

  return {
    ...globalHandlers,
    handleAddEquivalent,
    handleRemoveEquivalent,
    handleEquivalentChange,
    handleAddChemicalElement,
    handleRemoveChemicalElement,
    handleChemicalElementChange,
    handleRateTypeChange
  };
};

export default useSteelHandlers;