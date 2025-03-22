import React from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import useClientForm from './hooks/useClientForm';

const ClientForm = ({ client, onClose, onClientCreated, onClientUpdated }) => {
  const {
    formData,
    errors,
    loading,
    fetchingClient,
    message,
    countryOptions,
    selectStyles,
    getSelectedOption,
    handleChange,
    handleSelectChange,
    handleSubmit
  } = useClientForm(client, onClose, onClientCreated, onClientUpdated);
  
  if (fetchingClient) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }
  
  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nom du client *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
              />
              <Form.Control.Feedback type="invalid">
                {errors.name}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Code client *</Form.Label>
              <Form.Control
                type="text"
                name="client_code"
                value={formData.client_code}
                onChange={handleChange}
                isInvalid={!!errors.client_code}
              />
              <Form.Control.Feedback type="invalid">
                {errors.client_code}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Pays</Form.Label>
              <Select
                styles={selectStyles}
                options={countryOptions}
                value={getSelectedOption(countryOptions, formData.country)}
                onChange={(option) => handleSelectChange(option, 'country')}
                isClearable
                placeholder="Sélectionnez un pays"
                isLoading={loading && countryOptions.length === 0}
                noOptionsMessage={() => "Aucun pays disponible"}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Ville</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Groupe</Form.Label>
              <Form.Control
                type="text"
                name="client_group"
                value={formData.client_group}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Adresse</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
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
              />
            </Form.Group>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? (client ? 'Modification en cours...' : 'Création en cours...') : (client ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ClientForm;
