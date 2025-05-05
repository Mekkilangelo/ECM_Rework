const useFormValidation = (formData, setErrors) => {
  const validate = () => {
    const newErrors = {};
    
    // Validation des champs obligatoires
    if (!formData.grade) {
      newErrors.grade = "validation.required.grade";
    }
    
    // Validation pour les équivalents
    if (formData.equivalents.some(eq => !eq.steel_id)) {
      newErrors.equivalents = "validation.required.equivalentSteel";
    }
    
    // Validation pour les éléments chimiques
    if (formData.chemical_elements.length > 0) {
      const chemicalErrors = [];
      
      formData.chemical_elements.forEach((element, index) => {
        if (!element.element) {
          chemicalErrors[index] = { ...chemicalErrors[index], element: "validation.required.element" };
        }
        
        if (element.rate_type === 'exact' && element.value === '') {
          chemicalErrors[index] = { ...chemicalErrors[index], value: "validation.required.value" };
        }
        
        if (element.rate_type === 'range') {
          if (element.min_value === '') {
            chemicalErrors[index] = { ...chemicalErrors[index], min_value: "validation.required.minValue" };
          }
          if (element.max_value === '') {
            chemicalErrors[index] = { ...chemicalErrors[index], max_value: "validation.required.maxValue" };
          }
          if (parseFloat(element.min_value) >= parseFloat(element.max_value)) {
            chemicalErrors[index] = { ...chemicalErrors[index], range: "validation.range.minLessThanMax" };
          }
        }
      });
      
      if (chemicalErrors.length > 0 && chemicalErrors.some(err => err)) {
        newErrors.chemical_elements = chemicalErrors;
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
