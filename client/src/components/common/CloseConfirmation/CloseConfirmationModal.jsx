import React from 'react';
import { Modal, Button } from 'react-bootstrap';
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
 */
const CloseConfirmationModal = ({
  show,
  onHide,
  onCancel,
  onContinue,
  onSave,
  title = "Confirmer la fermeture",
  message = "Vous avez des modifications non enregistrées. Que souhaitez-vous faire ?",
  cancelText = "Rester",
  continueText = "Ne pas enregistrer",
  saveText = "Enregistrer"
}) => {
  return (
    <Modal 
      show={show} 
      onHide={onHide || onCancel} 
      backdrop="static"
      keyboard={false}
      centered
      dialogClassName="confirmation-modal"
      contentClassName="confirmation-modal-content"
    >
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="modal-title">{title}</Modal.Title>
        <button 
          type="button" 
          className="btn-close" 
          onClick={onHide || onCancel}
          aria-label="Close"
        />
      </Modal.Header>
      <Modal.Body className="pt-2 pb-3">
        <p className="modal-message">{message}</p>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-between w-100">
        <Button 
          variant="outline-secondary" 
          onClick={onCancel}
          className="btn-cancel flex-grow-1 mx-1"
        >
          {cancelText}
        </Button>
        <Button 
          variant="outline-danger" 
          onClick={onContinue}
          className="btn-continue flex-grow-1 mx-1"
        >
          {continueText}
        </Button>
        <Button 
          variant="primary" 
          onClick={onSave}
          className="btn-save flex-grow-1 mx-1"
        >
          {saveText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CloseConfirmationModal;
