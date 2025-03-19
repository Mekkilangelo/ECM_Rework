import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const ClientForm = ({ onClose, onClientCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    client_group: '',
    address: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Réinitialiser les erreurs pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.client_code.trim()) newErrors.client_code = 'Le code client est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await axios.post(`${API_URL}/clients`, formData);
      
      setMessage({
        type: 'success',
        text: 'Client créé avec succès!'
      });
      
      // Réinitialiser le formulaire
      setFormData({
        name: '',
        client_code: '',
        country: '',
        city: '',
        client_group: '',
        address: ''
      });
      
      // Notifier le parent
      if (onClientCreated) {
        onClientCreated(response.data);
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Une erreur est survenue lors de la création du client'
      });
    } finally {
      setLoading(false);
    }
  };
  
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
              <Form.Control
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
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
        
        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default ClientForm;