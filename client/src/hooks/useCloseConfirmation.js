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
  const handleCloseRequest = useCallback((closeCallbackOrEvent) => {    // En mode lecture seule, fermer directement sans confirmation
    if (viewMode) {
      let finalCallback;
      if (typeof closeCallbackOrEvent === 'function') {
        finalCallback = closeCallbackOrEvent;
      } else {
        finalCallback = onClose;
      }
      if (typeof finalCallback === 'function') {
        finalCallback();
      }
      return;
    }    try {
      console.log('🚪 handleCloseRequest - isModified:', isModified, 'viewMode:', viewMode);
      if (isModified) {
        setShowConfirmModal(true);
        setPendingClose(true);
      } else {
        // Si aucune modification, fermer directement
        let finalCallback;
        if (typeof closeCallbackOrEvent === 'function') {
          finalCallback = closeCallbackOrEvent;
        } else {
          finalCallback = onClose;
        }
        if (typeof finalCallback === 'function') {
          finalCallback();
        }      }
    } catch (error) {
      console.error('Erreur lors de la vérification des modifications', error);
      // En cas d'erreur, mieux vaut fermer directement pour éviter de bloquer l'utilisateur
      let finalCallback;
      if (typeof closeCallbackOrEvent === 'function') {
        finalCallback = closeCallbackOrEvent;
      } else {
        finalCallback = onClose;
      }
      if (typeof finalCallback === 'function') {
        finalCallback();
      }
    }
  }, [isModified, onClose, viewMode, formData]);

  // Confirmer la fermeture sans sauvegarder
  const confirmClose = useCallback((closeCallbackOrEvent) => {
    setShowConfirmModal(false);
    setPendingClose(false);
    
    // Si le premier paramètre est un événement React (objet avec des propriétés spécifiques)
    // ou n'est pas une fonction, utiliser onClose directement
    let finalCallback;
    if (typeof closeCallbackOrEvent === 'function') {
      finalCallback = closeCallbackOrEvent;
    } else {
      finalCallback = onClose;
    }
    
    if (typeof finalCallback === 'function') {
      finalCallback();
    } else {
      console.error('Aucune fonction de fermeture disponible');
    }
  }, [onClose]);
  
  // Annuler la fermeture
  const cancelClose = useCallback(() => {
    setShowConfirmModal(false);
    setPendingClose(false);
  }, []);
  // Sauvegarder et fermer
  const saveAndClose = useCallback((eOrCloseCallback, closeCallback) => {
    // Si le premier paramètre est un événement, l'empêcher de se propager
    if (eOrCloseCallback && typeof eOrCloseCallback === 'object' && eOrCloseCallback.preventDefault) {
      eOrCloseCallback.preventDefault();
    }
    
    setShowConfirmModal(false);
    setPendingClose(false);
    
    // Déterminer le bon callback à utiliser
    let finalCallback;
    if (typeof eOrCloseCallback === 'function') {
      finalCallback = eOrCloseCallback;
    } else if (typeof closeCallback === 'function') {
      finalCallback = closeCallback;
    } else {
      finalCallback = onClose;
    }
    
    onSubmit(eOrCloseCallback, true, finalCallback); // true indique que c'est une fermeture après sauvegarde
  }, [onSubmit, onClose]);
  return {
    showConfirmModal,
    setShowConfirmModal, // Ajout pour les tests de debug
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