import React, { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigation } from '../../../context/NavigationContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const OrderForm = ({ onClose, onOrderCreated }) => {
  const { hierarchyState } = useNavigation();
  const parentId = hierarchyState.clientId;
  
  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    description: '',
    commercial: '',
    contacts: [{ name: '', phone: '', email: '' }]
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
  
  const handleContactChange = (index, e) => {
    const { name, value } = e.target;
    const updatedContacts = [...formData.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value
    };
    
    setFormData({
      ...formData,
      contacts: updatedContacts
    });
  };
  
  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { name: '', phone: '', email: '' }]
    });
  };
  
  const removeContact = (index) => {
    const updatedContacts = [...formData.contacts];
    updatedContacts.splice(index, 1);
    
    setFormData({
      ...formData,
      contacts: updatedContacts
    });
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.order_date.trim()) newErrors.order_date = 'La date est requise';
    if (!parentId) newErrors.parent = 'Client parent non identifié';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      // Filtrer les contacts vides
      const filteredContacts = formData.contacts.filter(contact => 
        contact.name.trim() !== '' || contact.phone.trim() !== '' || contact.email.trim() !== ''
      );
      
      const orderData = {
        parent_id: parentId,
        order_date: formData.order_date,
        description: formData.description,
        commercial: formData.commercial,
        contacts: filteredContacts
      };
      
      const response = await axios.post(`${API_URL}/orders`, orderData);
      
      setMessage({
        type: 'success',
        text: 'Commande créée avec succès!'
      });
      
      // Réinitialiser le formulaire
      setFormData({
        order_date: new Date().toISOString().split('T')[0],
        description: '',
        commercial: '',
        contacts: [{ name: '', phone: '', email: '' }]
      });
      
      // Notifier le parent
      if (onOrderCreated) {
        onOrderCreated(response.data);
      }
      
      // Fermer le formulaire après un délai
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Une erreur est survenue lors de la création de la commande'
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
      
      {errors.parent && (
        <div className="alert alert-danger mb-3">
          {errors.parent}
        </div>
      )}
      
      <Form onSubmit={handleSubmit}>
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
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          ))}
        </div>
        
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

export default OrderForm;