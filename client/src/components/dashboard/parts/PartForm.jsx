// client/src/components/dashboard/parts/PartForm.jsx
import React from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import usePartForm from './hooks/usePartForm';

const PartForm = ({ part, onClose, onPartCreated, onPartUpdated }) => {
  const {
    formData,
    errors,
    loading,
    fetchingPart,
    message,
    designationOptions,
    steelOptions,
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles
  } = usePartForm(part, onClose, onPartCreated, onPartUpdated);

  if (fetchingPart) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      {errors.parent && (
        <div className="alert alert-danger mb-3">
          {errors.parent}
        </div>
      )}
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        {/* Section des informations de base */}
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nom <span className="text-danger">*</span></Form.Label>
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
          </Col>
          <Col md={6}>
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
          </Col>
        </Row>
        
        {/* Section des dimensions */}
        <h4 className="mt-4">Dimensions</h4>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Longueur</Form.Label>
              <Form.Control
                type="number"
                name="length"
                value={formData.length}
                onChange={handleChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Largeur</Form.Label>
              <Form.Control
                type="number"
                name="width"
                value={formData.width}
                onChange={handleChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Hauteur</Form.Label>
              <Form.Control
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Unité (dimensions)</Form.Label>
              <Select
                name="dimensionsUnit"
                value={getSelectedOption(getLengthUnitOptions(), formData.dimensionsUnit)}
                onChange={(option) => handleSelectChange(option, { name: 'dimensionsUnit' })}
                options={getLengthUnitOptions()}
                isClearable
                styles={selectStyles}
                placeholder="Sélectionner une unité"
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={loading}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Diamètre intérieur</Form.Label>
              <Form.Control
                type="number"
                name="diameterIn"
                value={formData.diameterIn}
                onChange={handleChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Diamètre extérieur</Form.Label>
              <Form.Control
                type="number"
                name="diameterOut"
                value={formData.diameterOut}
                onChange={handleChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Unité (diamètres)</Form.Label>
              <Select
                name="diameterUnit"
                value={getSelectedOption(getLengthUnitOptions(), formData.diameterUnit)}
                onChange={(option) => handleSelectChange(option, { name: 'diameterUnit' })}
                options={getLengthUnitOptions()}
                isClearable
                styles={selectStyles}
                placeholder="Sélectionner une unité"
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={loading}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Poids</Form.Label>
              <Form.Control
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Unité (poids)</Form.Label>
              <Select
                name="weightUnit"
                value={getSelectedOption(getWeightUnitOptions(), formData.weightUnit)}
                onChange={(option) => handleSelectChange(option, { name: 'weightUnit' })}
                options={getWeightUnitOptions()}
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
        
        {/* Section des spécifications */}
        <h4 className="mt-4">Spécifications</h4>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Dureté à cœur (min)</Form.Label>
              <Form.Control
                type="number"
                name="coreHardnessMin"
                value={formData.coreHardnessMin}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Dureté à cœur (max)</Form.Label>
              <Form.Control
                type="number"
                name="coreHardnessMax"
                value={formData.coreHardnessMax}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Unité (dureté à cœur)</Form.Label>
              <Select
                name="coreHardnessUnit"
                value={getSelectedOption(getHardnessUnitOptions(), formData.coreHardnessUnit)}
                onChange={(option) => handleSelectChange(option, { name: 'coreHardnessUnit' })}
                options={getHardnessUnitOptions()}
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
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Dureté superficielle (min)</Form.Label>
              <Form.Control
                type="number"
                name="surfaceHardnessMin"
                value={formData.surfaceHardnessMin}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Dureté superficielle (max)</Form.Label>
              <Form.Control
                type="number"
                name="surfaceHardnessMax"
                value={formData.surfaceHardnessMax}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Unité (dureté superficielle)</Form.Label>
              <Select
                name="surfaceHardnessUnit"
                value={getSelectedOption(getHardnessUnitOptions(), formData.surfaceHardnessUnit)}
                onChange={(option) => handleSelectChange(option, { name: 'surfaceHardnessUnit' })}
                options={getHardnessUnitOptions()}
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
              <Form.Label>Profondeur ECD (min)</Form.Label>
              <Form.Control
                type="number"
                name="ecdDepthMin"
                value={formData.ecdDepthMin}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Profondeur ECD (max)</Form.Label>
              <Form.Control
                type="number"
                name="ecdDepthMax"
                value={formData.ecdDepthMax}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Dureté ECD</Form.Label>
              <Form.Control
                type="number"
                name="ecdHardness"
                value={formData.ecdHardness}
                onChange={handleChange}
                step="0.1"
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Unité (dureté ECD)</Form.Label>
              <Select
                name="ecdHardnessUnit"
                value={getSelectedOption(getHardnessUnitOptions(), formData.ecdHardnessUnit)}
                onChange={(option) => handleSelectChange(option, { name: 'ecdHardnessUnit' })}
                options={getHardnessUnitOptions()}
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
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Acier</Form.Label>
              <Select
                name="steel"
                value={getSelectedOption(steelOptions, formData.steel)}
                onChange={(option) => handleSelectChange(option, { name: 'steel' })}
                options={steelOptions}
                isClearable
                styles={selectStyles}
                placeholder="Sélectionner un acier"
                className="react-select-container"
                classNamePrefix="react-select"
                isLoading={loading}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (part ? 'Modification en cours...' : 'Création en cours...') : (part ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PartForm;