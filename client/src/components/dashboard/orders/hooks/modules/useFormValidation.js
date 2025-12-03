const useFormValidation = (formData, parentId, setErrors) => {
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.request_date.trim()) newErrors.request_date = 'validation.required.orderDate';
    if (!parentId) newErrors.parent = 'validation.required.parentClient';
    
    setErrors(newErrors);
    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors
    };
  };
  
  return { validate };
};

export default useFormValidation;
