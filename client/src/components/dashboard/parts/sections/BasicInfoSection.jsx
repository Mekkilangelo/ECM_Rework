// src/components/dashboard/parts/sections/BasicInfoSection.jsx
import React from 'react';
import { Form } from 'react-bootstrap';
import Select from 'react-select';

const BasicInfoSection = ({
  formData,
  errors,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  designationOptions,
  loading,
  selectStyles
}) => (
  <div className="row">
    <div className="col-md-6">
      <Form.Group className="mb-3">
        <Form.Label>Référence <span className="text-danger">*</span></Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          isInvalid={!!errors.name}
          autoComplete="off"
        />
        <Form.Control.Feedback type="invalid">
          {errors.name}
        </Form.Control.Feedback>
      </Form.Group>
    </div>
    <div className="col-md-6">
      <Form.Group className="mb-3">
        <Form.Label>Désignation</Form.Label>
        <Select
          name="designation"
          value={getSelectedOption(designationOptions, formData.designation)}
          onChange={(option) => handleSelectChange(option, { name: 'designation' })}
          options={designationOptions}
          isClearable
          styles={selectStyles}
          placeholder="Sélectionner une désignation"
          className="react-select-container"
          classNamePrefix="react-select"
          isLoading={loading}
        />
      </Form.Group>
    </div>
  </div>
);

export default BasicInfoSection;
