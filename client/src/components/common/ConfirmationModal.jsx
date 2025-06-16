import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ConfirmationModal = ({
  show,
  onHide,
  onConfirm,
  title = "Confirmation",
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = "danger",
  size = "md"
}) => {
  const handleConfirm = () => {
    onConfirm();
    onHide();
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size={size}
      backdrop="static"
      keyboard={true}
      centered
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className={`me-2 text-${variant}`} 
          />
          {title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="d-flex align-items-start">
          <FontAwesomeIcon 
            icon={faExclamationTriangle} 
            className={`me-3 mt-1 text-${variant}`}
            size="lg"
          />
          <div>
            {typeof message === 'string' ? (
              <p className="mb-0">{message}</p>
            ) : (
              message
            )}
          </div>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
        >
          {cancelText}
        </Button>
        <Button 
          variant={variant} 
          onClick={handleConfirm}
          autoFocus
        >
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
