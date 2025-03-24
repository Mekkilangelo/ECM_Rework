import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useFormHandlers from './modules/useFormHandlers';
import useFormValidation from './modules/useFormValidation';
import useApiSubmission from './modules/useApiSubmission';
import useOrderData from './modules/useOrderData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
import { useState, useEffect } from 'react';


const useOrderForm = (order, onClose, onOrderCreated, onOrderUpdated) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.clientId;
  
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
  
  // Stocker les données initiales pour comparer les changements
  const [initialFormData, setInitialFormData] = useState(null);
  
  // Gestion des fichiers temporaires
  const [tempFileId, setTempFileId] = useState(null);
  
  // Handlers pour le formulaire
  const { 
    handleChange, 
    handleContactChange, 
    addContact, 
    removeContact 
  } = useFormHandlers(formData, setFormData, errors, setErrors);

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
  
  // Soumission du formulaire au serveur
  const { handleSubmit } = useApiSubmission(
    formData, 
    parentId,
    setFormData, 
    validate,
    order,
    setLoading, 
    setMessage, 
    onOrderCreated, 
    onOrderUpdated, 
    onClose
  );
  
  // Gestion de la confirmation de fermeture
  const { 
    showConfirmModal, 
    pendingClose, 
    handleCloseRequest, 
    confirmClose, 
    cancelClose, 
    saveAndClose 
  } = useCloseConfirmation(
    formData, 
    initialFormData || formData, 
    handleSubmit, 
    onClose
  );
  
  // Mettre à jour les données initiales une fois chargées
  useEffect(() => {
    if (!fetchingOrder && formData && !initialFormData) {
      setInitialFormData(JSON.parse(JSON.stringify(formData)));
    }
  }, [fetchingOrder, formData, initialFormData]);

  return {
    formData,
    errors,
    loading,
    fetchingOrder,
    message,
    parentId,
    handleChange,
    handleContactChange,
    addContact,
    removeContact,
    handleSubmit,
    // Nouvelles propriétés pour la confirmation de fermeture
    tempFileId,
    setTempFileId,
    showConfirmModal,
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  };
};

export default useOrderForm;