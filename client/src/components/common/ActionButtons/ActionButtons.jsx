import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

/**
 * Composant réutilisable pour les boutons d'action (voir, éditer, supprimer)
 * dans les listes de données.
 */
const ActionButtons = ({
  onView,
  onEdit,
  onDelete,
  hasEditRights = true,
  viewOnly = false,
  labels = {},
  size = "sm",
  itemId
}) => {
  // Gestion des événements avec stopPropagation pour éviter le déclenchement du clic sur la ligne
  const handleView = (e) => {
    e.stopPropagation();
    if (onView) onView(e, itemId);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(e, itemId);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(e, itemId);
  };

  return (
    <div className="d-flex justify-content-center">
      {/* Bouton de visualisation - toujours visible */}
      <Button
        variant="outline-info"
        size={size}
        className="mr-1"
        onClick={handleView}
        title={labels.view || 'Voir'}
      >
        <FontAwesomeIcon icon={faEye} />
      </Button>

      {/* Boutons d'édition et suppression - visibles uniquement si droits d'édition */}
      {hasEditRights && !viewOnly && (
        <>
          <Button
            variant="outline-warning"
            size={size}
            className="mr-1"
            onClick={handleEdit}
            title={labels.edit || 'Modifier'}
          >
            <FontAwesomeIcon icon={faEdit} />
          </Button>
          <Button
            variant="outline-danger"
            size={size}
            onClick={handleDelete}
            title={labels.delete || 'Supprimer'}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </>
      )}
    </div>
  );
};

ActionButtons.propTypes = {
  /** Fonction appelée lors du clic sur le bouton Voir */
  onView: PropTypes.func.isRequired,
  /** Fonction appelée lors du clic sur le bouton Modifier */
  onEdit: PropTypes.func,
  /** Fonction appelée lors du clic sur le bouton Supprimer */
  onDelete: PropTypes.func,
  /** Booléen indiquant si l'utilisateur a des droits d'édition */
  hasEditRights: PropTypes.bool,
  /** Booléen pour n'afficher que le bouton de visualisation */
  viewOnly: PropTypes.bool,
  /** Libellés personnalisés pour les infobulles */
  labels: PropTypes.shape({
    view: PropTypes.string,
    edit: PropTypes.string,
    delete: PropTypes.string
  }),
  /** Taille des boutons ('sm', 'md', etc.) */
  size: PropTypes.string,
  /** ID de l'élément à manipuler (transmis aux fonctions) */
  itemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default ActionButtons;