import { useNavigation } from '../../../../context/NavigationContext';
import useFormState from './modules/useFormState';
import useOrderHandlers from './modules/useOrderHandlers';
import useFormValidation from './modules/useFormValidation';
import useOrderSubmission from './modules/useOrderSubmission';
import useOrderData from './modules/useOrderData';
import useCloseConfirmation from '../../../../hooks/useCloseConfirmation';
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
    message,
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
    saveAndClose
  };
};

export default useOrderForm;
