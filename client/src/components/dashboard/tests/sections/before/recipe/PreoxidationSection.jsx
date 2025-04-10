import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';

const PreoxidationSection = ({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption,
  coolingMediaOptions, 
  temperatureUnitOptions, 
  timeUnitOptions, 
  loading, 
  selectStyles 
}) => {
  return (
    <>
      <h5 className="mt-3 mb-2">Préoxydation</h5>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Média</Form.Label>
            <Select
              name="recipeData.preoxMedia"
              value={getSelectedOption(coolingMediaOptions, formData.recipeData?.preoxMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.preoxMedia' })}
              options={coolingMediaOptions}
              isClearable
              styles={selectStyles}
              placeholder="Média"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Température</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.preoxTemp"
              value={formData.recipeData?.preoxTemp}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Unité</Form.Label>
            <Select
              name="recipeData.preoxTempUnit"
              value={getSelectedOption(temperatureUnitOptions, formData.recipeData?.preoxTempUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.preoxTempUnit' })}
              options={temperatureUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Durée</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.preoxDuration"
              value={formData.recipeData?.preoxDuration}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>Unité</Form.Label>
            <Select
              name="recipeData.preoxDurationUnit"
              value={getSelectedOption(timeUnitOptions, formData.recipeData?.preoxDurationUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.preoxDurationUnit' })}
              options={timeUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default PreoxidationSection;
