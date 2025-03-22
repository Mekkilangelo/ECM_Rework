const useFormValidation = (formData, setErrors) => {
    const validate = () => {
      const newErrors = {};
      
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!formData.client_code?.trim()) newErrors.client_code = 'Le code client est requis';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    return {
      validate
    };
  };
  
  export default useFormValidation;