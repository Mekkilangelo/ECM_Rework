import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import './CloseConfirmationModal.css';

/**
 * Modal de confirmation réutilisable avec design moderne et subtil
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.show - Contrôle l'affichage du modal
 * @param {Function} props.onHide - Fonction appelée quand le modal est fermé (équivalent à annuler)
 * @param {Function} props.onCancel - Fonction appelée quand l'utilisateur choisit d'annuler
 * @param {Function} props.onContinue - Fonction appelée quand l'utilisateur choisit de continuer sans sauvegarder
 * @param {Function} props.onSave - Fonction appelée quand l'utilisateur choisit de sauvegarder et continuer
 * @param {string} [props.title="Confirmer"] - Titre du modal
 * @param {string} [props.message="Voulez-vous enregistrer vos modifications?"] - Message affiché dans le modal
 * @param {string} [props.cancelText="Annuler"] - Texte du bouton d'annulation
 * @param {string} [props.continueText="Ne pas enregistrer"] - Texte du bouton de continuation sans sauvegarde
 * @param {string} [props.saveText="Enregistrer"] - Texte du bouton de sauvegarde
 * @param {boolean} [props.showSaveButton=true] - Affiche ou masque le bouton de sauvegarde
 * @param {string} [props.size="sm"] - Taille du modal (sm, lg, xl)
 * @param {string} [props.modalClassName=""] - Classes CSS additionnelles pour le modal
 * @param {string} [props.saveButtonVariant="primary"] - Variante de style pour le bouton de sauvegarde
 * @param {string} [props.continueButtonVariant="outline-danger"] - Variante de style pour le bouton de continuation
 * @param {string} [props.cancelButtonVariant="outline-secondary"] - Variante de style pour le bouton d'annulation
 * @param {React.ReactNode} [props.icon] - Icône optionnelle à afficher dans le modal
 */
const CloseConfirmationModal = ({
  show,
  onHide,
  onCancel,
  onContinue,
  onSave,
  title,
  message,
  cancelText,
  continueText,
  saveText,
  showSaveButton = true,
  size = "sm",
  modalClassName = "",
  saveButtonVariant = "primary",
  continueButtonVariant = "outline-danger",
  cancelButtonVariant = "outline-secondary",  icon = null
}) => {
  const { t } = useTranslation();
  
  // Utiliser les traductions comme valeurs par défaut
  const defaultTitle = title || t('common.confirmClose');
  const defaultMessage = message || t('common.unsavedChangesMessage');
  const defaultCancelText = cancelText || t('common.stay');
  const defaultContinueText = continueText || t('common.dontSave');
  const defaultSaveText = saveText || t('common.saveAndClose');
  return (
    <Modal 
      show={show} 
      onHide={onHide || onCancel} 
      backdrop="static"
      keyboard={false}
      centered
      size={size}
      dialogClassName={`confirmation-modal ${modalClassName}`}
      contentClassName="confirmation-modal-content"
    >
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="modal-title">
          {icon && <span className="modal-icon me-2">{icon}</span>}
          {defaultTitle}
        </Modal.Title>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onHide || onCancel}
          aria-label="Close"
        />
      </Modal.Header>
      <Modal.Body className="pt-2 pb-3">
        <p className="modal-message">{defaultMessage}</p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-between w-100">
        <Button 
          variant={cancelButtonVariant}
          onClick={onCancel}
          className="btn-cancel flex-grow-1 mx-1"
        >
          {defaultCancelText}
        </Button>
        <Button 
          variant={continueButtonVariant}
          onClick={onContinue}
          className="btn-continue flex-grow-1 mx-1"
        >
          {defaultContinueText}
        </Button>
        {showSaveButton && (
          <Button 
            variant={saveButtonVariant}
            onClick={onSave}
            className="btn-save flex-grow-1 mx-1"
          >
            {defaultSaveText}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default CloseConfirmationModal;
