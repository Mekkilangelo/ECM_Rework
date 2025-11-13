import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import '../CloseConfirmation/CloseConfirmationModal.css';

/**
 * Modal de confirmation de suppression générique avec gestion des dépendances
 * Peut être utilisé pour les références, les aciers, ou toute autre entité
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.show - Contrôle l'affichage du modal
 * @param {Function} props.onHide - Fonction appelée quand le modal est fermé
 * @param {Function} props.onCancel - Fonction appelée pour annuler
 * @param {Function} props.onDeleteForce - Fonction appelée pour supprimer en forçant (avec null)
 * @param {Function} props.onReplace - Fonction appelée pour remplacer (itemName, replacementValue) - Optionnel
 * @param {string} props.itemName - Nom de l'item à supprimer
 * @param {string} props.itemType - Type d'item (pour les traductions: 'reference', 'steel', etc.)
 * @param {number} props.usageCount - Nombre d'utilisations de cet item
 * @param {Object} props.usage - Détails de l'utilisation (pour affichage personnalisé)
 * @param {Array} props.availableOptions - Options disponibles pour le remplacement (optionnel)
 * @param {boolean} props.showReplaceOption - Afficher l'option de remplacement (défaut: true si availableOptions fourni)
 */
const DeleteWithUsageModal = ({
  show,
  onHide,
  onCancel,
  onDeleteForce,
  onReplace,
  itemName,
  itemType = 'reference',
  usageCount,
  usage,
  availableOptions = [],
  showReplaceOption = availableOptions.length > 0
}) => {
  const { t } = useTranslation();
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  const handleReplace = () => {
    if (selectedReplacement && onReplace) {
      onReplace(itemName, selectedReplacement.value);
    }
  };

  const handleCancel = () => {
    setSelectedReplacement(null);
    onCancel();
  };

  const handleDeleteForce = () => {
    setSelectedReplacement(null);
    onDeleteForce(itemName);
  };

  // Construire le message d'avertissement
  const getWarningMessage = () => {
    // Si c'est une référence simple, utiliser le message de base
    if (itemType === 'reference') {
      return t('references.deleteWarningMessage', { 
        name: itemName, 
        count: usageCount 
      });
    }
    
    // Pour les autres types (aciers, etc.), utiliser le message spécifique
    const key = `${itemType}s.deleteWarningMessage`;
    return t(key, {
      name: itemName,
      count: usageCount,
      defaultValue: `"${itemName}" est utilisé dans ${usageCount} enregistrement(s).`
    });
  };

  return (
    <Modal 
      show={show} 
      onHide={handleCancel} 
      backdrop="static"
      keyboard={false}
      centered
      size="md"
      dialogClassName="confirmation-modal"
      contentClassName="confirmation-modal-content"
    >
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="modal-title">
          <span className="modal-icon me-2 text-warning">
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </span>
          {t(`${itemType}s.deleteConfirmTitle`, { defaultValue: t('common.confirmDeletion', 'Confirmer la suppression') })}
        </Modal.Title>
        <button 
          type="button" 
          className="btn-close" 
          onClick={handleCancel}
          aria-label="Close"
        />
      </Modal.Header>
      <Modal.Body className="pt-2 pb-3">
        <p className="modal-message">
          {getWarningMessage()}
        </p>
        
        {/* Afficher les détails de l'utilisation si fournis */}
        {usage && usage.details && usage.details.length > 0 && (
          <div className="alert alert-warning mt-3 mb-0">
            <small>
              <strong>
                {t(`${itemType}s.usageDetails`, { defaultValue: t('common.usageDetails', 'Détails de l\'utilisation') })} :
              </strong>
              <ul className="mb-0 mt-2">
                {usage.details.map((detail, idx) => (
                  <li key={idx}>{detail.message}</li>
                ))}
              </ul>
            </small>
          </div>
        )}
        
        {/* Option de remplacement (seulement si disponible) */}
        {showReplaceOption && availableOptions.length > 0 && (
          <Form.Group className="mt-3">
            <Form.Label>
              {t(`${itemType}s.replaceWith`, { defaultValue: t('references.replaceWith', 'Remplacer par') })}
            </Form.Label>
            <Select
              value={selectedReplacement}
              onChange={setSelectedReplacement}
              options={availableOptions}
              placeholder={t(`${itemType}s.selectReplacement`, { defaultValue: t('references.selectReplacement', 'Sélectionnez un remplacement') })}
              isClearable
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 })
              }}
            />
            <Form.Text className="text-muted">
              {t(`${itemType}s.replaceDescription`, { defaultValue: t('references.replaceDescription', 'Les références seront mises à jour') })}
            </Form.Text>
          </Form.Group>
        )}
        
        {/* Description de la suppression forcée */}
        <p className="text-muted mt-3 mb-0">
          <small>
            {t(`${itemType}s.deleteAnywayDescription`, {
              defaultValue: 'Si vous supprimez cet élément, toutes les références seront retirées (mises à NULL).'
            })}
          </small>
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-between w-100">
        <Button 
          variant="outline-secondary"
          onClick={handleCancel}
          className="btn-cancel flex-grow-1 mx-1"
        >
          {t('common.cancel')}
        </Button>
        
        {/* Bouton de remplacement (seulement si disponible) */}
        {showReplaceOption && availableOptions.length > 0 && (
          <Button 
            variant="primary"
            onClick={handleReplace}
            className="btn-save flex-grow-1 mx-1"
            disabled={!selectedReplacement}
          >
            {t(`${itemType}s.replaceAndDelete`, { defaultValue: t('references.replaceAndDelete', 'Remplacer et supprimer') })}
          </Button>
        )}
        
        <Button 
          variant="outline-danger"
          onClick={handleDeleteForce}
          className="btn-continue flex-grow-1 mx-1"
        >
          {t(`${itemType}s.deleteAnyway`, { defaultValue: t('references.deleteAnyway', 'Supprimer quand même') })}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteWithUsageModal;
