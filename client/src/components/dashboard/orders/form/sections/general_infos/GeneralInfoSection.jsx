// src/components/dashboard/orders/sections/GeneralInfoSection.jsx
import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

const GeneralInfoSection = ({ formData, errors, handleChange, viewMode = false, readOnlyFieldStyle = {} }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('orders.generalInfo.requestDate')} {!viewMode && <span className="text-danger fw-bold">*</span>}</Form.Label>
            <Form.Control
              type="date"
              name="request_date"
              value={formData.request_date}
              onChange={handleChange}
              isInvalid={!viewMode && !!errors.request_date}
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
            {!viewMode && (
              <Form.Control.Feedback type="invalid">
                {errors.request_date && t(errors.request_date)}
              </Form.Control.Feedback>
            )}
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
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
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
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default GeneralInfoSection;
