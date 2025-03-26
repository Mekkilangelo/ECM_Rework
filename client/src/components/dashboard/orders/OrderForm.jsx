import React, { forwardRef, useImperativeHandle } from 'react';
import { Form, Button, Row, Col, Spinner, Modal } from 'react-bootstrap';
import useOrderForm from './hooks/useOrderForm';
import CloseConfirmationModal from '../../common/CloseConfirmation/CloseConfirmationModal';

const OrderForm = forwardRef(({ order, onClose, onOrderCreated, onOrderUpdated }, ref) => {
  const {
    formData,
    errors,
    loading,
    fetchingOrder,
    message,
    handleChange,
    handleContactChange,
    addContact,
    removeContact,
    handleSubmit,
    tempFileId,
    setTempFileId,
    // Propriétés pour la confirmation de fermeture
    showConfirmModal,
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  } = useOrderForm(order, onClose, onOrderCreated, onOrderUpdated);

  // Exposer handleCloseRequest à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest
  }));

  
  if (fetchingOrder) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      {errors.parent && (
        <div className="alert alert-danger mb-3">
          {errors.parent}
        </div>
      )}
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Date de demande *</Form.Label>
              <Form.Control
                type="date"
                name="order_date"
                value={formData.order_date}
                onChange={handleChange}
                isInvalid={!!errors.order_date}
              />
              <Form.Control.Feedback type="invalid">
                {errors.order_date}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Commercial</Form.Label>
              <Form.Control
                type="text"
                name="commercial"
                value={formData.commercial}
                onChange={handleChange}
                autoComplete="off"
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                autoComplete="off"
              />
            </Form.Group>
          </Col>
        </Row>
        
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <Form.Label className="mb-0">Contacts</Form.Label>
            <Button variant="outline-secondary" size="sm" onClick={addContact}>
              Ajouter un contact
            </Button>
          </div>
          
          {formData.contacts.map((contact, index) => (
            <div key={index} className="mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between mb-2">
                <h6>Contact {index + 1}</h6>
                {formData.contacts.length > 1 && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeContact(index)}
                  >
                    Supprimer
                  </Button>
                )}
              </div>
              
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Nom</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={contact.name}
                      onChange={(e) => handleContactChange(index, e)}
                      autoComplete="off"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Téléphone</Form.Label>
                    <Form.Control
                      type="text"
                      name="phone"
                      value={contact.phone}
                      onChange={(e) => handleContactChange(index, e)}
                      autoComplete="off"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={contact.email}
                      onChange={(e) => handleContactChange(index, e)}
                      autoComplete="off"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          ))}
        </div>

        {/* Section pour les fichiers */}
        <div className="mt-4 mb-4">
          <h5>Documents</h5>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={handleCloseRequest} className="me-2">
            Annuler
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? (order ? 'Modification en cours...' : 'Création en cours...') : (order ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </Form>
      
      {/* Modal de confirmation pour la fermeture */}
      <CloseConfirmationModal
        show={showConfirmModal}
        onHide={cancelClose}
        onCancel={cancelClose}
        onContinue={confirmClose}
        onSave={saveAndClose}
        title="Confirmer la fermeture"
        message="Vous avez des modifications non enregistrées."
      />
    </div>
  );
});

export default OrderForm;