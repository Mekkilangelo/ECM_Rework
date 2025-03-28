import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useApiSubmission = (
  formData, 
  parentId,
  setFormData, 
  validate,
  order, 
  setLoading, 
  setMessage, 
  onOrderCreated,
  onOrderUpdated, 
  onClose,
  fileAssociationCallback
) => {
  
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
      
      let response;
      
      if (order) {
        // Mode édition
        response = await axios.put(`${API_URL}/orders/${order.id}`, orderData);
        
        // Associer les fichiers à la commande existante si nécessaire
        if (fileAssociationCallback) {
          await fileAssociationCallback(order.id);
        }
        
        setMessage({
          type: 'success',
          text: 'Commande modifiée avec succès!'
        });
        
        if (onOrderUpdated) {
          onOrderUpdated(response.data);
        }
      } else {
        // Mode création
        response = await axios.post(`${API_URL}/orders`, orderData);
        
        // Associer les fichiers à la nouvelle commande si nécessaire
        if (fileAssociationCallback) {
          await fileAssociationCallback(response.data.id);
        }
        
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
        
        if (onOrderCreated) {
          onOrderCreated(response.data);
        }
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error(`Erreur lors de ${order ? 'la modification' : 'la création'} de la commande:`, error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || `Une erreur est survenue lors de ${order ? 'la modification' : 'la création'} de la commande`
      });
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit };
};

export default useApiSubmission;
