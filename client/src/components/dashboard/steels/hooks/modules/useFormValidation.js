const useFormValidation = (formData, setErrors) => {
  
  const validate = () => {
    const newErrors = {};
    
    // Validation du grade de l'acier (champ obligatoire)
    if (!formData.grade?.trim()) newErrors.grade = 'validation.required.grade';
    
    // Validation de la famille d'acier
    if (!formData.family?.trim()) newErrors.family = 'validation.required.family';
    
    // Validation des composants chimiques si présents
    if (formData.chemicalComponents && formData.chemicalComponents.length > 0) {
      const componentErrors = [];
      
      formData.chemicalComponents.forEach((component, index) => {
        const compError = {};
        
        // Validation de l'élément
        if (!component.element) compError.element = 'validation.required.element';
        
        // Validation du type de valeur (min/max ou unique)
        if (component.valueType === 'single' && !component.value) {
          compError.value = 'validation.required.value';
        } else if (component.valueType === 'range') {
          // Vérifier que min et max sont présents
          if (!component.minValue) compError.minValue = 'validation.required.minValue';
          if (!component.maxValue) compError.maxValue = 'validation.required.maxValue';
          
          // Si les deux sont présents, vérifier que min < max
          if (component.minValue && component.maxValue && 
              parseFloat(component.minValue) >= parseFloat(component.maxValue)) {
            compError.range = 'validation.range.minLessThanMax';
          }
        }
        
        if (Object.keys(compError).length > 0) {
          componentErrors[index] = compError;
        }
      });
      
      if (componentErrors.some(err => err)) {
        newErrors.chemicalComponents = componentErrors;
      }
    }
    
    // Validation des équivalents si présents
    if (formData.equivalents && formData.equivalents.length > 0) {
      const equivalentErrors = [];
      
      formData.equivalents.forEach((equivalent, index) => {
        if (!equivalent.steelId) {
          equivalentErrors[index] = {
            steel: 'validation.required.equivalentSteel'
          };
        }
      });
      
      if (equivalentErrors.some(err => err)) {
        newErrors.equivalents = equivalentErrors;
      }
    }
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };
  
  return { validate };
};

export default useFormValidation;
