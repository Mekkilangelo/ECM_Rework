// src/components/dashboard/orders/sections/ContactsSection.jsx
import React from 'react';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const ContactsSection = ({
  formData,
  handleContactChange,
  addContact,
  removeContact,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();
  
  return (
    <>
      {/* Bouton d'ajout de contact - masqué en mode lecture seule */}
      {!viewMode && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <Button variant="outline-secondary" size="sm" onClick={addContact}>
            {t('orders.contacts.add')}
          </Button>
        </div>
      )}
      
      {formData.contacts.map((contact, index) => (
        <div key={index} className="mb-3 p-3 border rounded">
          <div className="d-flex justify-content-between mb-2">
            <h6>{t('orders.contacts.contact')} {index + 1}</h6>
            {/* Bouton de suppression - masqué en mode lecture seule */}
            {!viewMode && formData.contacts.length > 1 && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => removeContact(index)}
              >
                {t('common.delete')}
              </Button>
            )}
          </div>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>{t('orders.contacts.name')}</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, e)}
                  autoComplete="off"
                  disabled={viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>{t('orders.contacts.phone')}</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={contact.phone}
                  onChange={(e) => handleContactChange(index, e)}
                  autoComplete="off"
                  disabled={viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-2">
                <Form.Label>{t('orders.contacts.email')}</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={contact.email}
                  onChange={(e) => handleContactChange(index, e)}
                  autoComplete="off"
                  disabled={viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </Form.Group>
            </Col>
          </Row>
        </div>
      ))}
      
      {/* Message lorsqu'il n'y a pas de contacts et qu'on est en mode lecture seule */}
      {viewMode && formData.contacts.length === 0 && (
        <div className="text-muted text-center p-3">
          {t('common.noData', { entity: t('orders.contacts.contact').toLowerCase() })}
        </div>
      )}
    </>
  );
};

export default ContactsSection;
