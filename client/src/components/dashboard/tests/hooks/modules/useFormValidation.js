const useFormValidation = (formData, parentId, setErrors) => {
  const validate = () => {
    const newErrors = {};
    
    if (!parentId) newErrors.parent = 'validation.required.parentPart';
    
    // Rendre la date de trial obligatoire
    if (!formData.trialDate) newErrors.trialDate = 'validation.required.trialDate';
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };
  
  return { validate };
};

export default useFormValidation;