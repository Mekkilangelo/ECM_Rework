import { useState } from 'react';

/**
 * Hook générique pour gérer la confirmation de fermeture d'un formulaire
 * @param {Object} formData - Données actuelles du formulaire
 * @param {Object} initialFormData - Données initiales du formulaire
 * @param {Function} handleSubmit - Fonction pour soumettre le formulaire
 * @param {Function} onClose - Fonction de fermeture fournie par le composant parent
 * @param {Function} [isModified] - Fonction optionnelle personnalisée pour déterminer si le formulaire a été modifié
 * @returns {Object} - Fonctions et états pour gérer la confirmation de fermeture
 */
const useCloseConfirmation = (
  formData, 
  initialFormData, 
  handleSubmit, 
  onClose,
  isModified = null
) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  
  // Vérifier si le formulaire a été modifié (avec logique par défaut)
  const defaultIsFormModified = () => {
    // Si formData ou initialFormData n'est pas disponible, on présume qu'il n'y a pas de modifications
    if (!formData || !initialFormData) return false;
    
    // Comparer les valeurs de base
    const basicFieldsChanged = Object.keys(initialFormData).some(key => {
      // Ignorer les tableaux pour ce test de premier niveau
      if (Array.isArray(initialFormData[key])) return false;
      return initialFormData[key] !== formData[key];
    });
    
    // Comparer les tableaux si présents
    let arraysChanged = false;
    Object.keys(initialFormData).forEach(key => {
      if (Array.isArray(initialFormData[key])) {
        if (JSON.stringify(initialFormData[key]) !== JSON.stringify(formData[key])) {
          arraysChanged = true;
        }
      }
    });
    
    return basicFieldsChanged || arraysChanged;
  };
  
  // Utiliser la fonction personnalisée si fournie, sinon utiliser la fonction par défaut
  const checkIsModified = isModified || defaultIsFormModified;
  
  // Gérer la tentative de fermeture
  const handleCloseRequest = () => {
    if (checkIsModified()) {
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