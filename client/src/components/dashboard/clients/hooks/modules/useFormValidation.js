const useFormValidation = (formData, setErrors) => {
  
  const validate = () => {
    const newErrors = {};
    
    // Validation du nom du client
    if (!formData.name?.trim()) {
      newErrors.name = 'validation.required.clientName';
    }
    
    // Validation du pays
    if (!formData.country?.trim()) {
      newErrors.country = 'validation.required.country';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return { validate };
};

export default useFormValidation;