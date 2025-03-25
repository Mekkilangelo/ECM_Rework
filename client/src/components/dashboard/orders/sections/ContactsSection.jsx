// src/components/dashboard/orders/sections/ContactsSection.jsx
import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';

const ContactsSection = ({ 
  formData, 
  handleContactChange, 
  addContact, 
  removeContact 
}) => (
  <>
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
  </>
);

export default ContactsSection;
