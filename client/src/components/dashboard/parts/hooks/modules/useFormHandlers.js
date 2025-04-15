// useFormHandlers.js

import { useCallback } from 'react';
import enumService from '../../../../../services/enumService';

const useFormHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions) => {
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [setFormData, errors, setErrors]);
  
  const handleSelectChange = useCallback((selectedOption, { name }) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [setFormData, errors, setErrors]);
  
  const handleCreateOption = useCallback(async (inputValue, fieldName, tableName, columnName) => {
    try {
      const response = await enumService.addEnumValue(tableName, columnName, inputValue);
  
      if (response && response.success) {
        // Mettre à jour le formulaire avec la nouvelle valeur
        setFormData(prev => ({ ...prev, [fieldName]: inputValue }));
  
        // Trouver et appeler la fonction de rafraîchissement appropriée
        let refreshFunction;
        if (tableName === 'units') {
          refreshFunction = refreshOptionsFunctions.refreshUnitOptions;
        } else if (tableName === 'parts' && columnName === 'designation') {
          refreshFunction = refreshOptionsFunctions.refreshDesignationOptions;
        } else {
          refreshFunction = refreshOptionsFunctions[`refresh${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Options`];
        }
  
        if (refreshFunction && typeof refreshFunction === 'function') {
          // Attendre le rafraîchissement des options
          await refreshFunction();
        }
  
        return { value: inputValue, label: inputValue };
      } else {
        console.error(`Erreur lors de l'ajout de ${fieldName}:`, response);
        return null;
      }
    } catch (error) {
      console.error(`Erreur lors de l'ajout de ${fieldName}:`, error);
      return null;
    }
  }, [setFormData, refreshOptionsFunctions]);
  
  
  return {
    handleChange,
    handleSelectChange,
    handleCreateOption
  };
};

export default useFormHandlers;