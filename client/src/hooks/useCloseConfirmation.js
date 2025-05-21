import { useState, useCallback } from 'react';
import useModifiedState from './useModifiedState';

/**
 * Hook générique amélioré pour gérer la confirmation de fermeture d'un formulaire
 * @param {Object} formData - Données actuelles du formulaire
 * @param {boolean} isLoading - État de chargement du formulaire
 * @param {boolean} isFetching - État de récupération des données
 * @param {Function} onSubmit - Fonction pour soumettre le formulaire
 * @param {Function} onClose - Fonction de fermeture fournie par le composant parent
 * @param {boolean} [viewMode=false] - Si le formulaire est en mode lecture seule (pas de vérification de modification)
 * @param {Function} [customIsModifiedCheck] - Fonction optionnelle personnalisée pour déterminer si le formulaire a été modifié
 * @returns {Object} - Fonctions et états pour gérer la confirmation de fermeture
 */
const useCloseConfirmation = (
  formData, 
  isLoading = false, 
  isFetching = false, 
  onSubmit,
  onClose,
  viewMode = false,
  customIsModifiedCheck = null
) => {
  // État pour contrôler l'affichage du modal de confirmation
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // État pour indiquer qu'une fermeture est en attente
  const [pendingClose, setPendingClose] = useState(false);

  // Utiliser le hook useModifiedState pour suivre les modifications du formulaire
  // En mode lecture seule, désactiver la vérification des modifications
  const { isModified, setModified, resetInitialState } = useModifiedState(
    formData,
    isLoading,
    isFetching,
    viewMode ? () => false : customIsModifiedCheck // En mode lecture seule, toujours retourner false
  );
    // Gérer la tentative de fermeture
  const handleCloseRequest = useCallback((closeCallback = onClose) => {
    // En mode lecture seule, fermer directement sans confirmation
    if (viewMode) {
      closeCallback();
      return;
    }
    
    try {
      if (isModified) {
        console.debug('Modifications détectées, affichage de la confirmation');
        setShowConfirmModal(true);
        setPendingClose(true);
      } else {
        // Si aucune modification, fermer directement
        console.debug('Aucune modification, fermeture directe');
        closeCallback();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des modifications', error);
      // En cas d'erreur, mieux vaut fermer directement pour éviter de bloquer l'utilisateur
      closeCallback();
    }
  }, [isModified, onClose, viewMode]);
    // Confirmer la fermeture sans sauvegarder
  const confirmClose = useCallback((closeCallback = onClose) => {
    setShowConfirmModal(false);
    setPendingClose(false);
    closeCallback();
  }, [onClose]);
  
  // Annuler la fermeture
  const cancelClose = useCallback(() => {
    setShowConfirmModal(false);
    setPendingClose(false);
  }, []);
  
  // Sauvegarder et fermer
  const saveAndClose = useCallback((e, closeCallback = onClose) => {
    if (e) {
      e.preventDefault();
    }
    setShowConfirmModal(false);
    setPendingClose(false);
    onSubmit(e, true, closeCallback); // true indique que c'est une fermeture après sauvegarde
  }, [onSubmit]);

  return {
    showConfirmModal,
    pendingClose,
    isModified,
    setModified,
    resetInitialState,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  };
};

export default useCloseConfirmation;