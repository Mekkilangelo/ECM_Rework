import { useConfirmation } from '../context/ConfirmationContext';

export const useConfirmationDialog = () => {
  const { showConfirmation } = useConfirmation();

  const confirmDelete = (itemName, itemType = 'élément') => {
    return showConfirmation({
      title: "Confirmer la suppression",
      message: `Êtes-vous sûr de vouloir supprimer ${itemType} "${itemName}" ?`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      variant: "danger"
    });
  };

  const confirmAction = (message, title = "Confirmation") => {
    return showConfirmation({
      title,
      message,
      confirmText: "Confirmer",
      cancelText: "Annuler",
      variant: "primary"
    });
  };

  const confirmDestructiveAction = (message, title = "Attention") => {
    return showConfirmation({
      title,
      message,
      confirmText: "Continuer",
      cancelText: "Annuler",
      variant: "warning"
    });
  };

  return {
    confirmDelete,
    confirmAction,
    confirmDestructiveAction,
    showConfirmation
  };
};

export default useConfirmationDialog;
