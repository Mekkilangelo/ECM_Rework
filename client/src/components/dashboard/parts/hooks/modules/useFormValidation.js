const useFormValidation = (formData, parentId, setErrors) => {
  const validate = () => {
    const newErrors = {};
    
    if (!formData.designation.trim()) newErrors.designation = 'validation.required.designation';
    if (!parentId) newErrors.parent = 'validation.required.parentOrder';
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };
  
  return { validate };
};

export default useFormValidation;
