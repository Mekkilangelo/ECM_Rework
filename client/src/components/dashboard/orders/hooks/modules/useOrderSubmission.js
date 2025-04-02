import useApiSubmission from '../../../../../hooks/useApiSubmission';
import orderService from '../../../../../services/orderService';

/**
 * Hook spécifique pour gérer les soumissions de commandes
 * @param {Object} formData - Données du formulaire de commande
 * @param {string} parentId - ID du client parent
 * @param {Function} setFormData - Fonction pour mettre à jour formData
 * @param {Function} validate - Fonction de validation
 * @param {Object} order - Commande existante (pour le mode édition)
 * @param {Function} setLoading - Fonction pour définir l'état de chargement
 * @param {Function} setMessage - Fonction pour définir les messages
 * @param {Function} onOrderCreated - Callback après création
 * @param {Function} onOrderUpdated - Callback après mise à jour
 * @param {Function} onClose - Callback de fermeture
 * @param {Function} fileAssociationCallback - Callback pour associer des fichiers
 */
const useOrderSubmission = (
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
  const initialFormState = {
    order_date: new Date().toISOString().split('T')[0],
    description: '',
    commercial: '',
    contacts: [{ name: '', phone: '', email: '' }]
  };
  
  const formatDataForApi = () => {
    // Filtrer les contacts vides
    const filteredContacts = formData.contacts.filter(contact => 
      contact.name.trim() !== '' || contact.phone.trim() !== '' || contact.email.trim() !== ''
    );
    
    return {
      parent_id: parentId,
      order_date: formData.order_date,
      description: formData.description,
      commercial: formData.commercial,
      contacts: filteredContacts
    };
  };
  
  return useApiSubmission({
    formData,
    setFormData,
    validate,
    entity: order,
    setLoading,
    setMessage,
    onCreated: onOrderCreated,
    onUpdated: onOrderUpdated,
    onClose,
    formatDataForApi,
    customApiService: {
        create: orderService.createOrder,
        update: orderService.updateOrder
    },
    entityType: 'Commande',
    initialFormState,
    fileAssociationCallback,
    parentId
  });
};

export default useOrderSubmission;