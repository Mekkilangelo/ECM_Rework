const useFormHandlers = (formData, setFormData, errors, setErrors) => {
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    };
    
    const handleSelectChange = (selectedOption, { name }) => {
      setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    };
    
    return {
      handleChange,
      handleSelectChange
    };
  };
  
  export default useFormHandlers;
  