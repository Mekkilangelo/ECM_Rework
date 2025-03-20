import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';

const TestTypeSection = ({ 
  formData, 
  handleSelectChange, 
  getSelectedOption, 
  mountingTypeOptions, 
  positionTypeOptions, 
  processTypeOptions, 
  loading, 
  selectStyles 
}) => {
  return (
    <>
      <h4 className="mt-4 mb-3">Types de test</h4>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de montage</Form.Label>
            <Select
              name="mountingType"
              value={getSelectedOption(mountingTypeOptions, formData.mountingType)}
              onChange={(option) => handleSelectChange(option, { name: 'mountingType' })}
              options={mountingTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner un type de montage"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de position</Form.Label>
            <Select
              name="positionType"
              value={getSelectedOption(positionTypeOptions, formData.positionType)}
              onChange={(option) => handleSelectChange(option, { name: 'positionType' })}
              options={positionTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner un type de position"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de processus</Form.Label>
            <Select
              name="processType"
              value={getSelectedOption(processTypeOptions, formData.processType)}
              onChange={(option) => handleSelectChange(option, { name: 'processType' })}
              options={processTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner un type de processus"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default TestTypeSection;