const useFormValidation = (formData, parentId, setErrors) => {
    const validate = () => {
      const newErrors = {};
      
      if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
      if (!parentId) newErrors.parent = 'Commande parente non identifiée';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    return { validate };
  };
  
  export default useFormValidation;
  