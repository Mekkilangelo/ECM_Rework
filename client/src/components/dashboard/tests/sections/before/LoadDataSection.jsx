import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
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
  return (
    <>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Longueur</Form.Label>
            <Form.Control
              type="number"
              name="loadData.length"
              value={formData.loadData?.length}
              onChange={handleChange}
              step="0.01"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Largeur</Form.Label>
            <Form.Control
              type="number"
              name="loadData.width"
              value={formData.loadData?.width}
              onChange={handleChange}
              step="0.01"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Hauteur</Form.Label>
            <Form.Control
              type="number"
              name="loadData.height"
              value={formData.loadData?.height}
              onChange={handleChange}
              step="0.01"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Unité de taille</Form.Label>
            <Select
              name="loadData.sizeUnit"
              value={getSelectedOption(lengthUnitOptions, formData.loadData?.sizeUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'loadData.sizeUnit' })}
              options={lengthUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner une unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre d'étages</Form.Label>
            <Form.Control
              type="number"
              name="loadData.floorCount"
              value={formData.loadData?.floorCount}
              onChange={handleChange}
              step="1"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre de pièces</Form.Label>
            <Form.Control
              type="number"
              name="loadData.partCount"
              value={formData.loadData?.partCount}
              onChange={handleChange}
              step="1"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Poids</Form.Label>
            <Form.Control
              type="number"
              name="loadData.weight"
              value={formData.loadData?.weight}
              onChange={handleChange}
              step="0.01"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Unité de poids</Form.Label>
            <Select
              name="loadData.weightUnit"
              value={getSelectedOption(weightUnitOptions, formData.loadData?.weightUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'loadData.weightUnit' })}
              options={weightUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Sélectionner une unité"
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
            <Form.Label>Commentaires sur la charge</Form.Label>
            <Form.Control
              as="textarea"
              name="loadData.loadComments"
              value={formData.loadData?.loadComments}
              onChange={handleChange}
              rows={2}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default LoadDataSection;