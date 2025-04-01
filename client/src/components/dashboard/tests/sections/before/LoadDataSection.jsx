import React from 'react';
import { Row, Col, Form, InputGroup } from 'react-bootstrap';
import Select from 'react-select';

const LoadDataSection = ({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption, 
  lengthUnitOptions, 
  weightUnitOptions, 
  loading, 
  selectStyles 
}) => {
  // Style compact pour les Select
  const compactSelectStyles = {
    ...selectStyles,
    container: (provided) => ({
      ...provided,
      width: '100%',
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      height: '38px',
      fontSize: '0.9rem',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '38px',
      padding: '0 6px',
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    singleValue: (provided) => ({
      ...provided, 
      fontSize: '0.9rem',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '38px',
    }),
  };

  return (
    <>
      <h6 className="text-muted mb-2">Dimensions de charge</h6>
      <Row className="g-2 mb-3 align-items-end">
        <Col md={8}>
          <Row className="g-2">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small">Longueur</Form.Label>
                <Form.Control
                  type="number"
                  name="loadData.length"
                  value={formData.loadData?.length}
                  onChange={handleChange}
                  step="0.01"
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small">Largeur</Form.Label>
                <Form.Control
                  type="number"
                  name="loadData.width"
                  value={formData.loadData?.width}
                  onChange={handleChange}
                  step="0.01"
                  size="sm"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small">Hauteur</Form.Label>
                <Form.Control
                  type="number"
                  name="loadData.height"
                  value={formData.loadData?.height}
                  onChange={handleChange}
                  step="0.01"
                  size="sm"
                />
              </Form.Group>
            </Col>
          </Row>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label className="small">Unité</Form.Label>
            <Select
              name="loadData.sizeUnit"
              value={getSelectedOption(lengthUnitOptions, formData.loadData?.sizeUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'loadData.sizeUnit' })}
              options={lengthUnitOptions}
              isClearable
              styles={compactSelectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <h6 className="text-muted mb-2">Informations de charge</h6>
      <Row className="g-2 mb-3">
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small">Nombre d'étages</Form.Label>
            <Form.Control
              type="number"
              name="loadData.floorCount"
              value={formData.loadData?.floorCount}
              onChange={handleChange}
              step="1"
              size="sm"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small">Nombre de pièces</Form.Label>
            <Form.Control
              type="number"
              name="loadData.partCount"
              value={formData.loadData?.partCount}
              onChange={handleChange}
              step="1"
              size="sm"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <InputGroup size="sm">
            <Form.Group className="w-100">
              <Form.Label className="small">Poids</Form.Label>
              <InputGroup size="sm">
                <Form.Control
                  type="number"
                  name="loadData.weight"
                  value={formData.loadData?.weight}
                  onChange={handleChange}
                  step="0.01"
                  size="sm"
                />
              </InputGroup>
            </Form.Group>
          </InputGroup>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small">Unité</Form.Label>
            <Select
              name="loadData.weightUnit"
              value={getSelectedOption(weightUnitOptions, formData.loadData?.weightUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'loadData.weightUnit' })}
              options={weightUnitOptions}
              isClearable
              styles={compactSelectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Form.Group className="mb-3">
        <Form.Label className="small">Commentaires sur la charge</Form.Label>
        <Form.Control
          as="textarea"
          name="loadData.loadComments"
          value={formData.loadData?.loadComments}
          onChange={handleChange}
          rows={2}
          size="sm"
        />
      </Form.Group>
    </>
  );
};

export default LoadDataSection;
