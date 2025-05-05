const useFormValidation = (formData, setErrors) => {
    const validate = () => {
      const newErrors = {};
      
      if (!formData.name.trim()) newErrors.name = 'validation.required.clientName';
      if (!formData.country) newErrors.country = 'validation.required.country';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    return {
      validate
    };
  };
  
  export default useFormValidation;