// src/components/dashboard/orders/sections/GeneralInfoSection.jsx
import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const GeneralInfoSection = ({ formData, errors, handleChange }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('orders.generalInfo.requestDate')} <span className="text-danger fw-bold">*</span></Form.Label>
            <Form.Control
              type="date"
              name="order_date"
              value={formData.order_date}
              onChange={handleChange}
              isInvalid={!!errors.order_date}
            />
            <Form.Control.Feedback type="invalid">
              {errors.order_date && t(errors.order_date)}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('orders.commercial')}</Form.Label>
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
            <Form.Label>{t('orders.generalInfo.description')}</Form.Label>
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
};

export default GeneralInfoSection;
