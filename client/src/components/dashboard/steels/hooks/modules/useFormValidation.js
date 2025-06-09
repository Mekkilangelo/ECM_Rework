const useFormValidation = (formData, setErrors) => {
  
  const validate = () => {
    const newErrors = {};
    
    // Validation du grade de l'acier (champ obligatoire)
    if (!formData.grade?.trim()) newErrors.grade = 'validation.required.grade';
    
    // Validation de la famille d'acier
    if (!formData.family?.trim()) newErrors.family = 'validation.required.family';
      // Validation des composants chimiques si présents
    if (formData.chemical_elements && formData.chemical_elements.length > 0) {
      const componentErrors = [];
      
      formData.chemical_elements.forEach((component, index) => {
        const compError = {};
        
        // Validation de l'élément
        if (!component.element) compError.element = 'validation.required.element';
        
        // Validation du type de valeur (min/max ou unique)
        if (component.rate_type === 'exact' && !component.value) {
          compError.value = 'validation.required.value';
        } else if (component.rate_type === 'range') {
          // Au moins une valeur (min ou max) doit être présente
          if (!component.min_value && !component.max_value) {
            compError.range = 'validation.required.minOrMax';
          }
          
          // Si les deux sont présents, vérifier que min < max
          if (component.min_value && component.max_value && 
              parseFloat(component.min_value) >= parseFloat(component.max_value)) {
            compError.range = 'validation.range.minLessThanMax';
          }
          
          // Validation des valeurs numériques si présentes
          if (component.min_value && isNaN(parseFloat(component.min_value))) {
            compError.min_value = 'validation.invalid.number';
          }
          if (component.max_value && isNaN(parseFloat(component.max_value))) {
            compError.max_value = 'validation.invalid.number';
          }
        }
        
        if (Object.keys(compError).length > 0) {
          componentErrors[index] = compError;
        }
      });
      
      if (componentErrors.some(err => err)) {
        newErrors.chemical_elements = componentErrors;
      }
    }
    
    // Validation des équivalents si présents
    if (formData.equivalents && formData.equivalents.length > 0) {
      const equivalentErrors = [];
        formData.equivalents.forEach((equivalent, index) => {
        if (!equivalent.steel_id) {
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
