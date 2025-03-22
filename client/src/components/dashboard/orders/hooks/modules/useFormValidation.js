const useFormValidation = (formData, parentId, setErrors) => {
  
    const validate = () => {
      const newErrors = {};
      
      if (!formData.order_date.trim()) newErrors.order_date = 'La date est requise';
      if (!parentId) newErrors.parent = 'Client parent non identifié';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    return { validate };
  };
  
  export default useFormValidation;
  