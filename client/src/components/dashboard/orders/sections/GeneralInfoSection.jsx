// src/components/dashboard/orders/sections/GeneralInfoSection.jsx
import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

const GeneralInfoSection = ({ formData, errors, handleChange }) => (
  <>
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
  </>
);

export default GeneralInfoSection;
