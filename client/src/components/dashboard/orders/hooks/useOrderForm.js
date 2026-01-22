import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useOrderHandlers from './modules/useOrderHandlers';
import useFormValidation from './modules/useFormValidation';
import useOrderSubmission from './modules/useOrderSubmission';
import useOrderData from './modules/useOrderData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import useCopyPaste from '../../../../hooks/useCopyPaste';
import { useState, useEffect, useCallback } from 'react';

const useOrderForm = (order, onClose, onOrderCreated, onOrderUpdated, viewMode = false, clientId) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.clientId;
  
  // État pour stocker la fonction de rappel d'association de fichiers
  const [fileAssociationCallback, setFileAssociationCallback] = useState(null);
  // Fonction de rappel pour recevoir la méthode d'association de fichiers
  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationCallback(() => associateFilesFunc);
  }, []);
  
  // État du formulaire et initialisation
  const { 
    formData, 
    setFormData, 
    errors, 
    setErrors, 
    loading, 
    setLoading, 
    message, 
    setMessage,
    fetchingOrder,
    setFetchingOrder,
    setParentId
  } = useFormState();
  
  // Handlers pour le formulaire - en mode lecture seule, ces handlers ne devraient pas modifier les données
  const { 
    handleChange, 
    handleContactChange, 
    addContact, 
    removeContact 
  } = useOrderHandlers(formData, setFormData, errors, setErrors, viewMode);

  // Chargement des données de la commande en mode édition
  useOrderData(
    order, 
    setFormData, 
    setMessage, 
    setFetchingOrder,
    setParentId
  );
  
  // Validation du formulaire
  const { validate } = useFormValidation(formData, parentId, setErrors);
  
  // Fonctions pour Copy/Paste - même logique que l'API
  const formatForApi = useCallback((data) => {
    // Filtrer les contacts vides
    const filteredContacts = (data.contacts || []).filter(contact => 
      contact.name.trim() !== '' || contact.phone.trim() !== '' || contact.email.trim() !== ''
    );
    
    const formattedDate = data.trial_request_date ? new Date(data.trial_request_date).toISOString().split('T')[0] : null;
    
    return {
      trial_request_date: formattedDate,
      description: data.description || '',
      commercial: data.commercial || '',
      contacts: filteredContacts.length > 0 ? filteredContacts : [{ name: '', phone: '', email: '' }]
    };
  }, []);

  const parseFromApi = useCallback((data) => {
    // Traitement des contacts - même logique que useOrderData
    let contacts = [];
    
    if (data.contacts) {
      try {
        if (typeof data.contacts === 'string') {
          contacts = JSON.parse(data.contacts);
        } else if (Array.isArray(data.contacts)) {
          contacts = data.contacts;
        }
      } catch (e) {
        console.error('Erreur lors du parsing des contacts:', e);
        contacts = [];
      }
    }
    
    // S'assurer qu'il y a au moins un contact vide
    if (!Array.isArray(contacts) || contacts.length === 0) {
      contacts = [{ name: '', phone: '', email: '' }];
    }
    
    return {
      trial_request_date: data.trial_request_date || '',
      commercial: data.commercial || '',
      description: data.description || '',
      contacts: contacts
    };
  }, []);

  // Copy/Paste functionality
  const {
    handleCopy,
    handlePaste,
    message: copyPasteMessage
  } = useCopyPaste({
    formType: 'orders',
    getFormData: () => formData,
    setFormData,
    formatForApi,
    parseFromApi
  });
  
  // Soumission du formulaire au serveur - en mode lecture seule, la soumission est désactivée
  const { handleSubmit } = useOrderSubmission(
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
    fileAssociationCallback,
    viewMode // Transmettre le mode lecture seule
  );
  
  // Gestion de la confirmation de fermeture avec notre hook amélioré
  // En mode lecture seule, on n'a pas besoin de confirmation pour fermer
  const { 
    showConfirmModal, 
    pendingClose, 
    isModified,
    setModified,
    resetInitialState,
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData,
    loading,
    fetchingOrder,
    handleSubmit,
    onClose,
    viewMode // Passer le mode lecture seule au hook de confirmation
  );

  // Réinitialiser l'état initial après une sauvegarde réussie
  useEffect(() => {
    if (message && message.type === 'success') {
      resetInitialState();
    }
  }, [message, resetInitialState]);

  return {
    formData,
    errors,
    loading,
    fetchingOrder,
    message: message || copyPasteMessage, // Combiner les messages
    parentId,
    handleChange,
    handleContactChange,
    addContact,
    removeContact,
    handleSubmit,
    handleFileAssociationNeeded,
    setFileAssociationCallback,
    isModified,
    setModified,
    showConfirmModal,
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    // Copy/Paste functionality
    handleCopy,
    handlePaste
  };
};

export default useOrderForm;
