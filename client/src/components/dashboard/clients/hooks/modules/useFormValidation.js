const useFormValidation = (formData, setErrors) => {
  
  const validate = () => {
    const newErrors = {};
    
    // Validation du nom du client
    if (!formData.name?.trim()) newErrors.name = 'validation.required.clientName';
    
    // Vous pouvez ajouter d'autres validations ici, par exemple pour le pays
    if (formData.Client?.country === '') newErrors.country = 'validation.required.country';
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };
  
  return { validate };
};

export default useFormValidation;