import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';

const FurnaceDataSection = ({ 
  formData, 
  handleSelectChange, 
  getSelectedOption, 
  furnaceTypeOptions, 
  heatingCellOptions, 
  coolingMediaOptions, 
  furnaceSizeOptions, 
  quenchCellOptions, 
  loading, 
  selectStyles 
}) => {
  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Type de four</Form.Label>
            <Select
              name="furnaceData.furnaceType"
              value={getSelectedOption(furnaceTypeOptions, formData.furnaceData?.furnaceType)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.furnaceType' })}
              options={furnaceTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner un type de four"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Cellule de chauffage</Form.Label>
            <Select
              name="furnaceData.heatingCell"
              value={getSelectedOption(heatingCellOptions, formData.furnaceData?.heatingCell)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.heatingCell' })}
              options={heatingCellOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner une cellule de chauffage"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Média de refroidissement</Form.Label>
            <Select
              name="furnaceData.coolingMedia"
              value={getSelectedOption(coolingMediaOptions, formData.furnaceData?.coolingMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.coolingMedia' })}
              options={coolingMediaOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner un média de refroidissement"
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
            <Select
              name="furnaceData.furnaceSize"
              value={getSelectedOption(furnaceSizeOptions, formData.furnaceData?.furnaceSize)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.furnaceSize' })}
              options={furnaceSizeOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner une taille de four"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cellule de trempe</Form.Label>
            <Select
              name="furnaceData.quenchCell"
              value={getSelectedOption(quenchCellOptions, formData.furnaceData?.quenchCell)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.quenchCell' })}
              options={quenchCellOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner une cellule de trempe"
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