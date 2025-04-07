// client\src\components\dashboard\orders\hooks\modules\useFormHandlers.js
import useFormHandlers from '../../../../../hooks/useFormHandlers';

const useOrderHandlers = (formData, setFormData, errors, setErrors) => {
  // Obtenir les fonctionnalités de base
  const baseHandlers = useFormHandlers(formData, setFormData, errors, setErrors);
  
  // Ajouter les fonctionnalités spécifiques aux commandes
  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value
    };
    
    setFormData({
      ...formData,
      contacts: updatedContacts
    });
  };
  
  const addContact = () => {
    baseHandlers.handleArrayAdd('contacts', () => ({ name: '', phone: '', email: '' }));
  };
  
  const removeContact = (index) => {
    baseHandlers.handleArrayRemove('contacts', index);
  };
  
  return {
    ...baseHandlers,
    handleContactChange,
    addContact,
    removeContact
  };
};

export default useOrderHandlers;