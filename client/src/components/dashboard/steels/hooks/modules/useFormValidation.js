const useFormValidation = (formData, setErrors) => {
    const validate = () => {
      const newErrors = {};
      
      // Validation des champs obligatoires
      if (!formData.grade) {
        newErrors.grade = "Le grade est obligatoire";
      }
      
      // Validation pour les équivalents
      if (formData.equivalents.some(eq => !eq.steel_id)) {
        newErrors.equivalents = "Chaque équivalent doit avoir un acier sélectionné";
      }
      
      // Validation pour les éléments chimiques
      if (formData.chemical_elements.length > 0) {
        const chemicalErrors = [];
        
        formData.chemical_elements.forEach((element, index) => {
          if (!element.element) {
            chemicalErrors[index] = { ...chemicalErrors[index], element: "L'élément est obligatoire" };
          }
          
          if (element.rate_type === 'exact' && element.value === '') {
            chemicalErrors[index] = { ...chemicalErrors[index], value: "La valeur est obligatoire" };
          }
          
          if (element.rate_type === 'range') {
            if (element.min_value === '') {
              chemicalErrors[index] = { ...chemicalErrors[index], min_value: "La valeur min est obligatoire" };
            }
            if (element.max_value === '') {
              chemicalErrors[index] = { ...chemicalErrors[index], max_value: "La valeur max est obligatoire" };
            }
            if (parseFloat(element.min_value) >= parseFloat(element.max_value)) {
              chemicalErrors[index] = { ...chemicalErrors[index], range: "Min doit être inférieur à Max" };
            }
          }
        });
        
        if (chemicalErrors.length > 0 && chemicalErrors.some(err => err)) {
          newErrors.chemical_elements = chemicalErrors;
        }
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    return { validate };
  };
  
  export default useFormValidation;
  