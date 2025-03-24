import { useState } from 'react';

/**
 * Hook pour gérer la confirmation de fermeture du formulaire
 * @param {Object} formData - Données actuelles du formulaire
 * @param {Object} initialFormData - Données initiales du formulaire
 * @param {Function} handleSubmit - Fonction pour soumettre le formulaire
 * @param {Function} onClose - Fonction de fermeture fournie par le composant parent
 * @returns {Object} - Fonctions et états pour gérer la confirmation de fermeture
 */
const useCloseConfirmation = (formData, initialFormData, handleSubmit, onClose) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  
  // Vérifier si le formulaire a été modifié
  const isFormModified = () => {
    // Comparer les valeurs de base
    const basicFieldsChanged = Object.keys(initialFormData).some(key => {
      // Ignorer les tableaux (comme les contacts) pour ce test de premier niveau
      if (Array.isArray(initialFormData[key])) return false;
      return initialFormData[key] !== formData[key];
    });
    
    // Comparer les contacts
    const contactsChanged = 
      JSON.stringify(initialFormData.contacts) !== JSON.stringify(formData.contacts);
    
    return basicFieldsChanged || contactsChanged;
  };
  
  // Gérer la tentative de fermeture
  const handleCloseRequest = () => {
    if (isFormModified()) {
      setShowConfirmModal(true);
      setPendingClose(true);
    } else {
      // Si aucune modification, fermer directement
      onClose();
    }
  };
  
  // Confirmer la fermeture sans sauvegarder
  const confirmClose = () => {
    setShowConfirmModal(false);
    setPendingClose(false);
    onClose();
  };
  
  // Annuler la fermeture
  const cancelClose = () => {
    setShowConfirmModal(false);
    setPendingClose(false);
  };
  
  // Sauvegarder et fermer
  const saveAndClose = (e) => {
    if (e) {
      e.preventDefault();
    }
    setShowConfirmModal(false);
    setPendingClose(false);
    handleSubmit(e, true); // true indique que c'est une fermeture après sauvegarde
  };
  
  return {
    showConfirmModal,
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  };
};

export default useCloseConfirmation;