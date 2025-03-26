const useFormHandlers = (formData, setFormData, errors, setErrors) => {
    // Gérer les changements de champs de formulaire
    const handleChange = (e) => {
      const { name, value } = e.target;
      
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Effacer l'erreur lorsque l'utilisateur commence à corriger le champ
      if (errors[name]) {
        setErrors({
          ...errors,
          [name]: null
        });
      }
    };
    
    // Gérer les changements de sélecteurs
    const handleSelectChange = (option, field, index = null, subField = null) => {
      const value = option ? option.value : '';
      
      if (index !== null && subField) {
        // Pour les tableaux d'objets imbriqués (e.g., equivalents ou chemical_elements)
        const items = [...formData[field]];
        items[index] = {
          ...items[index],
          [subField]: value
        };
        
        setFormData({
          ...formData,
          [field]: items
        });
      } else {
        // Pour les champs simples
        setFormData({
          ...formData,
          [field]: value
        });
        
        // Effacer l'erreur lorsque l'utilisateur commence à corriger le champ
        if (errors[field]) {
          setErrors({
            ...errors,
            [field]: null
          });
        }
      }
    };
    
    return {
      handleChange,
      handleSelectChange
    };
  };
  
  export default useFormHandlers;
  