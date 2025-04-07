// src/components/dashboard/clients/hooks/modules/useFormHandlers.js
import useFormHandlers from '../../../../../hooks/useFormHandlers';

const useClientHandlers = (formData, setFormData, errors, setErrors) => {
  // Obtenir les gestionnaires de base
  const baseHandlers = useFormHandlers(formData, setFormData, errors, setErrors);
  
  // Personnaliser la fonction handleSelectChange pour l'API spécifique
  const handleSelectChange = (selectedOption, fieldName) => {
    baseHandlers.handleSelectChange(selectedOption, fieldName);
  };
  
  return {
    ...baseHandlers,
    handleSelectChange,
  };
};

export default useClientHandlers;