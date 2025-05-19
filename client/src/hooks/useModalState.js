import { useState, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer les états des modales dans les composants de liste
 *
 * Ce hook permet de gérer les états des différentes modales (création, édition, détails)
 * souvent utilisées dans les composants de liste de l'application.
 *
 * @param {Object} [options] - Options de configuration du hook
 * @param {Function} [options.onModalClose] - Fonction appelée après la fermeture d'une modale
 * @param {Function} [options.onItemSelected] - Fonction appelée quand un élément est sélectionné
 * @param {Function} [options.onRefreshData] - Fonction appelée pour rafraîchir les données après création/modification
 * @returns {Object} Méthodes et états pour gérer les modales
 */
const useModalState = (options = {}) => {
  // Destructuration des options avec valeurs par défaut
  const { 
    onModalClose = () => {}, 
    onItemSelected = () => {},
    onRefreshData = () => {}
  } = options;

  // États pour les différentes modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // État pour l'élément sélectionné
  const [selectedItem, setSelectedItem] = useState(null);

  // Ouvrir le modal de création
  const openCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  // Ouvrir le modal d'édition pour un élément donné
  const openEditModal = useCallback((item) => {
    setSelectedItem(item);
    onItemSelected(item);
    setShowEditModal(true);
  }, [onItemSelected]);

  // Ouvrir le modal de détails pour un élément donné
  const openDetailModal = useCallback((item) => {
    setSelectedItem(item);
    onItemSelected(item);
    setShowDetailModal(true);
  }, [onItemSelected]);

  // Ouvrir le modal de confirmation de suppression
  const openDeleteConfirmation = useCallback((item) => {
    setSelectedItem(item);
    onItemSelected(item);
    setShowDeleteConfirmation(true);
  }, [onItemSelected]);

  // Fermer le modal de création
  const closeCreateModal = useCallback((refreshData = false) => {
    setShowCreateModal(false);
    if (refreshData) onRefreshData();
    onModalClose('create');
  }, [onModalClose, onRefreshData]);

  // Fermer le modal d'édition
  const closeEditModal = useCallback((refreshData = false) => {
    setShowEditModal(false);
    setSelectedItem(null);
    if (refreshData) onRefreshData();
    onModalClose('edit');
  }, [onModalClose, onRefreshData]);

  // Fermer le modal de détails
  const closeDetailModal = useCallback(() => {
    setShowDetailModal(false);
    setSelectedItem(null);
    onModalClose('detail');
  }, [onModalClose]);

  // Fermer le modal de confirmation de suppression
  const closeDeleteConfirmation = useCallback(() => {
    setShowDeleteConfirmation(false);
    setSelectedItem(null);
    onModalClose('delete');
  }, [onModalClose]);

  // Gérer la fermeture d'un modal avec une référence à un form qui peut avoir une méthode handleCloseRequest
  const handleCloseWithRef = useCallback((modalType, formRef) => {
    // Fermer directement le modal selon son type sans appeler formRef.handleCloseRequest
    // ce qui évite la boucle infinie
    switch (modalType) {
      case 'create':
        closeCreateModal();
        break;
      case 'edit':
        closeEditModal();
        break;
      case 'detail':
        closeDetailModal();
        break;
      case 'delete':
        closeDeleteConfirmation();
        break;
      default:
        break;
    }
  }, [closeCreateModal, closeEditModal, closeDetailModal, closeDeleteConfirmation]);

  // Cette nouvelle fonction gère le cas où on a besoin de vérifier handleCloseRequest
  const handleRequestClose = useCallback((modalType, formRef) => {
    if (formRef.current && formRef.current.handleCloseRequest) {
      formRef.current.handleCloseRequest(() => {
        // Callback à exécuter après validation de la fermeture
        switch (modalType) {
          case 'create':
            setShowCreateModal(false);
            break;
          case 'edit':
            setShowEditModal(false);
            setSelectedItem(null);
            break;
          case 'detail':
            setShowDetailModal(false);
            setSelectedItem(null);
            break;
          case 'delete':
            setShowDeleteConfirmation(false);
            setSelectedItem(null);
            break;
          default:
            break;
        }
        onModalClose(modalType);
      });
    } else {
      // Si pas de handleCloseRequest, fermer directement
      handleCloseWithRef(modalType, formRef);
    }
  }, [handleCloseWithRef, onModalClose]);

  // Fonction appelée après création réussie d'un élément
  const handleItemCreated = useCallback(() => {
    closeCreateModal(true);
  }, [closeCreateModal]);

  // Fonction appelée après mise à jour réussie d'un élément
  const handleItemUpdated = useCallback(() => {
    closeEditModal(true);
  }, [closeEditModal]);

  // Fonction appelée après suppression réussie d'un élément
  const handleItemDeleted = useCallback(() => {
    closeDeleteConfirmation();
    onRefreshData();
  }, [closeDeleteConfirmation, onRefreshData]);

  return {
    // États
    showCreateModal,
    showEditModal,
    showDetailModal,
    showDeleteConfirmation,
    selectedItem,
    
    // Méthodes pour ouvrir les modales
    openCreateModal,
    openEditModal,
    openDetailModal,
    openDeleteConfirmation,
    
    // Méthodes pour fermer les modales
    closeCreateModal,
    closeEditModal,
    closeDetailModal,
    closeDeleteConfirmation,
    
    // Méthodes avec gestion de ref
    handleCloseWithRef,        // Fermeture directe sans vérification
    handleRequestClose,        // Nouvelle fonction qui gère handleCloseRequest proprement
    
    // Gestionnaires d'événements
    handleItemCreated,
    handleItemUpdated,
    handleItemDeleted,
    
    // Setter pour l'élément sélectionné
    setSelectedItem
  };
};

export default useModalState;