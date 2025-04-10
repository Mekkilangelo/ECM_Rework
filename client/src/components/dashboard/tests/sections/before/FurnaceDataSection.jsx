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
    handleCreateOption(inputValue, 'furnaceData.furnaceType', 'furnaces', 'furnace_type');
  const handleCreateHeatingCell = (inputValue) => 
    handleCreateOption(inputValue, 'furnaceData.heatingCell', 'furnaces', 'heating_cell_type');
  const handleCreateCoolingMedia = (inputValue) => 
    handleCreateOption(inputValue, 'furnaceData.coolingMedia', 'furnaces', 'cooling_media');
  const handleCreateFurnaceSize = (inputValue) => 
    handleCreateOption(inputValue, 'furnaceData.furnaceSize', 'furnaces', 'furnace_size');
  const handleCreateQuenchCell = (inputValue) => 
    handleCreateOption(inputValue, 'furnaceData.quenchCell', 'furnaces', 'quench_cell');

  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de four</Form.Label>
            <CreatableSelect
              name="furnaceData.furnaceType"
              value={getSelectedOption(furnaceTypeOptions, formData.furnaceData?.furnaceType)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.furnaceType' })}
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
              name="furnaceData.heatingCell"
              value={getSelectedOption(heatingCellOptions, formData.furnaceData?.heatingCell)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.heatingCell' })}
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
              name="furnaceData.coolingMedia"
              value={getSelectedOption(coolingMediaOptions, formData.furnaceData?.coolingMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.coolingMedia' })}
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
              name="furnaceData.furnaceSize"
              value={getSelectedOption(furnaceSizeOptions, formData.furnaceData?.furnaceSize)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.furnaceSize' })}
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
              name="furnaceData.quenchCell"
              value={getSelectedOption(quenchCellOptions, formData.furnaceData?.quenchCell)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.quenchCell' })}
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
