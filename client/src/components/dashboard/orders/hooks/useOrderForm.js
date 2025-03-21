import { useState } from 'react';
import axios from 'axios';
import { useNavigation } from '../../../../context/NavigationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useOrderForm = (onClose, onOrderCreated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.clientId;
  
  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    description: '',
    commercial: '',
    contacts: [{ name: '', phone: '', email: '' }]
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
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
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.order_date.trim()) newErrors.order_date = 'La date est requise';
    if (!parentId) newErrors.parent = 'Client parent non identifié';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Filtrer les contacts vides
      const filteredContacts = formData.contacts.filter(contact => 
        contact.name.trim() !== '' || contact.phone.trim() !== '' || contact.email.trim() !== ''
      );
      
      const orderData = {
        parent_id: parentId,
        order_date: formData.order_date,
        description: formData.description,
        commercial: formData.commercial,
        contacts: filteredContacts
      };
      
      const response = await axios.post(`${API_URL}/orders`, orderData);
      
      setMessage({
        type: 'success',
        text: 'Commande créée avec succès!'
      });
      
      // Réinitialiser le formulaire
      setFormData({
        order_date: new Date().toISOString().split('T')[0],
        description: '',
        commercial: '',
        contacts: [{ name: '', phone: '', email: '' }]
      });
      
      // Notifier le parent
      if (onOrderCreated) {
        onOrderCreated(response.data);
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Une erreur est survenue lors de la création de la commande'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    message,
    parentId,
    handleChange,
    handleContactChange,
    addContact,
    removeContact,
    handleSubmit
  };
};

export default useOrderForm;
