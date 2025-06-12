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
    
    const formattedDate = formData.order_date ? new Date(formData.order_date).toISOString().split('T')[0] : null;
    
    // S'assurer que toutes les données nécessaires sont bien incluses
    return {
      parent_id: parentId,
      order_date: formattedDate, // S'assurer que la date est au format ISO
      description: formData.description,
      commercial: formData.commercial,
      contacts: filteredContacts,
      name: order ? order.name : null // Conserver le nom si en mode édition
    };
  };
  // Wrap le callback d'association de fichiers pour le faire fonctionner avec useApiSubmission
  const wrappedFileAssociationCallback = fileAssociationCallback ? 
    async (nodeId) => {
      if (typeof fileAssociationCallback === 'function') {
        return await fileAssociationCallback(nodeId);
      }
      return true;
    } : null;
  
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
    fileAssociationCallback: wrappedFileAssociationCallback,
    parentId
  });
};

export default useOrderSubmission;