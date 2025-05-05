const useFormValidation = (formData, parentId, setErrors) => {
  const validate = () => {
    const newErrors = {};
    
    if (!parentId) newErrors.parent = 'validation.required.parentPart';
    
    // Rendre la date de test obligatoire
    if (!formData.testDate) newErrors.testDate = 'validation.required.testDate';
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };
  
  return { validate };
};

export default useFormValidation;