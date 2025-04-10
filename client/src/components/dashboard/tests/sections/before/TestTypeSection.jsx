import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

const TestTypeSection = ({
  formData,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  mountingTypeOptions,
  positionTypeOptions,
  processTypeOptions,
  loading,
  selectStyles,
}) => {
  const handleCreateMountingType = (inputValue) => 
    handleCreateOption(inputValue, 'mountingType', 'tests', 'mounting_type');
  const handleCreatePositionType = (inputValue) => 
    handleCreateOption(inputValue, 'positionType', 'tests', 'position_type');
  const handleCreateProcessType = (inputValue) => 
    handleCreateOption(inputValue, 'processType', 'tests', 'process_type');

  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de montage</Form.Label>
            <CreatableSelect
              name="mountingType"
              value={getSelectedOption(mountingTypeOptions, formData.mountingType)}
              onChange={(option) => handleSelectChange(option, { name: 'mountingType' })}
              onCreateOption={handleCreateMountingType}
              options={mountingTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter un type de montage"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de position</Form.Label>
            <CreatableSelect
              name="positionType"
              value={getSelectedOption(positionTypeOptions, formData.positionType)}
              onChange={(option) => handleSelectChange(option, { name: 'positionType' })}
              onCreateOption={handleCreatePositionType}
              options={positionTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter un type de position"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de processus</Form.Label>
            <CreatableSelect
              name="processType"
              value={getSelectedOption(processTypeOptions, formData.processType)}
              onChange={(option) => handleSelectChange(option, { name: 'processType' })}
              onCreateOption={handleCreateProcessType}
              options={processTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter un type de processus"
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
