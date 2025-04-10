import React from 'react';
import { Form } from 'react-bootstrap';
import Select, { components } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import enumService from '../../../../services/enumService';

const BasicInfoSection = ({
  formData,
  errors,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  designationOptions,
  loading,
  selectStyles,
  refreshOptions
}) => {
  
  const handleCreateDesignation = (inputValue) => {
    return handleCreateOption(inputValue, 'designation', 'parts', 'designation');
  };

  return (
    <div className="row">
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Désignation <span className="text-danger">*</span></Form.Label>
          <CreatableSelect
            name="designation"
            value={getSelectedOption(designationOptions, formData.designation)}
            onChange={(option) => handleSelectChange(option, { name: 'designation' })}
            options={designationOptions}
            isClearable
            styles={selectStyles}
            placeholder="Sélectionner ou ajouter une désignation"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
            formatCreateLabel={(inputValue) => `Ajouter "${inputValue}"`}
            onCreateOption={handleCreateDesignation}
          />
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Désignation client</Form.Label>
          <Form.Control
            type="text"
            name="clientDesignation"
            value={formData.clientDesignation || ''}
            onChange={handleChange}
            isInvalid={!!errors.clientDesignation}
            autoComplete="off"
          />
          <Form.Control.Feedback type="invalid">
            {errors.clientDesignation}
          </Form.Control.Feedback>
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Référence</Form.Label>
          <Form.Control
            type="text"
            name="reference"
            value={formData.reference || ''}
            onChange={handleChange}
            isInvalid={!!errors.reference}
            autoComplete="off"
          />
          <Form.Control.Feedback type="invalid">
            {errors.name}
          </Form.Control.Feedback>
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            isInvalid={!!errors.description}
            autoComplete="off"
          />
          <Form.Control.Feedback type="invalid">
            {errors.description}
          </Form.Control.Feedback>
        </Form.Group>
      </div>
    </div>
  );
};

export default BasicInfoSection;