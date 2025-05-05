const useFormValidation = (formData, parentId, setErrors) => {
    const validate = () => {
      const newErrors = {};
      
      if (!formData.designation.trim()) newErrors.designation = 'validation.required.designation';
      if (!parentId) newErrors.parent = 'validation.required.parentOrder';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    return { validate };
  };
  
  export default useFormValidation;
