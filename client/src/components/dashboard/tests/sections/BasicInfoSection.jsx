
import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';

const BasicInfoSection = ({ 
  formData, 
  errors, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption, 
  locationOptions, 
  statusOptions, 
  loading, 
  selectStyles 
}) => {
  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
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
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Localisation</Form.Label>
            <Select
              name="location"
              value={getSelectedOption(locationOptions, formData.location)}
              onChange={(option) => handleSelectChange(option, { name: 'location' })}
              options={locationOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner une localisation"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Statut</Form.Label>
            <Select
              name="status"
              value={getSelectedOption(statusOptions, formData.status)}
              onChange={(option) => handleSelectChange(option, { name: 'status' })}
              options={statusOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner un statut"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
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
    </>
  );
};

export default BasicInfoSection;