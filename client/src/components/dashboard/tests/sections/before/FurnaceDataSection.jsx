import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

const FurnaceDataSection = ({
  formData,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  furnaceTypeOptions,
  heatingCellOptions,
  coolingMediaOptions,
  furnaceSizeOptions,
  quenchCellOptions,
  loading,
  selectStyles,
}) => {
  const handleCreateFurnaceType = (inputValue) => 
    handleCreateOption(inputValue, 'furnaceType', 'furnaces', 'furnace_type');
  const handleCreateHeatingCell = (inputValue) => 
    handleCreateOption(inputValue, 'heatingCell', 'furnaces', 'heating_cell_type');
  const handleCreateCoolingMedia = (inputValue) => 
    handleCreateOption(inputValue, 'coolingMedia', 'furnaces', 'cooling_media');
  const handleCreateFurnaceSize = (inputValue) => 
    handleCreateOption(inputValue, 'furnaceSize', 'furnaces', 'furnace_size');
  const handleCreateQuenchCell = (inputValue) => 
    handleCreateOption(inputValue, 'quenchCell', 'furnaces', 'quench_cell');

  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de four</Form.Label>
            <CreatableSelect
              name="furnaceType"
              value={getSelectedOption(furnaceTypeOptions, formData.furnaceType)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceType' })}
              onCreateOption={handleCreateFurnaceType}
              options={furnaceTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter un type de four"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Cellule de chauffage</Form.Label>
            <CreatableSelect
              name="heatingCell"
              value={getSelectedOption(heatingCellOptions, formData.heatingCell)}
              onChange={(option) => handleSelectChange(option, { name: 'heatingCell' })}
              onCreateOption={handleCreateHeatingCell}
              options={heatingCellOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter une cellule de chauffage"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Média de refroidissement</Form.Label>
            <CreatableSelect
              name="coolingMedia"
              value={getSelectedOption(coolingMediaOptions, formData.coolingMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'coolingMedia' })}
              onCreateOption={handleCreateCoolingMedia}
              options={coolingMediaOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter un média de refroidissement"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Taille du four</Form.Label>
            <CreatableSelect
              name="furnaceSize"
              value={getSelectedOption(furnaceSizeOptions, formData.furnaceSize)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceSize' })}
              onCreateOption={handleCreateFurnaceSize}
              options={furnaceSizeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter une taille de four"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cellule de trempe</Form.Label>
            <CreatableSelect
              name="quenchCell"
              value={getSelectedOption(quenchCellOptions, formData.quenchCell)}
              onChange={(option) => handleSelectChange(option, { name: 'quenchCell' })}
              onCreateOption={handleCreateQuenchCell}
              options={quenchCellOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner ou ajouter une cellule de trempe"
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

export default FurnaceDataSection;
