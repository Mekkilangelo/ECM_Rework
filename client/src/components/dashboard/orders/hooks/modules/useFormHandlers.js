const useFormHandlers = (formData, setFormData, errors, setErrors) => {
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    };
    
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
      setFormData({
        ...formData,
        contacts: [...formData.contacts, { name: '', phone: '', email: '' }]
      });
    };
    
    const removeContact = (index) => {
      const updatedContacts = [...formData.contacts];
      updatedContacts.splice(index, 1);
      
      setFormData({
        ...formData,
        contacts: updatedContacts
      });
    };
    
    return {
      handleChange,
      handleContactChange,
      addContact,
      removeContact
    };
  };
  
  export default useFormHandlers;
  