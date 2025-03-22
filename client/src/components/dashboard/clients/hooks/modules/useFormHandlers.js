import { useState } from 'react';

const useFormHandlers = (formData, setFormData, errors, setErrors) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (selectedOption, fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: selectedOption ? selectedOption.value : '' }));
    
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  };
  
  return {
    handleChange,
    handleSelectChange
  };
};

export default useFormHandlers;