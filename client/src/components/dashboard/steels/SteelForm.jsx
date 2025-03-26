import React from 'react';
import { Form, Button, Row, Col, Spinner, Table } from 'react-bootstrap';
import Select from 'react-select';
import useSteelForm from './hooks/useSteelForm';

const SteelForm = ({ steel, onClose, onSteelCreated, onSteelUpdated }) => {
  const {
    formData,
    errors,
    loading,
    fetchingSteel,
    message,
    steelFamilyOptions,
    steelStandardOptions,
    steelGradeOptions,
    elementOptions,
    selectStyles,
    getSelectedOption,
    handleChange,
    handleSelectChange,
    handleSubmit,
    handleAddEquivalent,
    handleRemoveEquivalent,
    handleAddChemicalElement,
    handleRemoveChemicalElement,
    handleChemicalElementChange,
    handleRateTypeChange
  } = useSteelForm(steel, onClose, onSteelCreated, onSteelUpdated);
  
  if (fetchingSteel) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }
  
  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        <h5>Informations sur l'acier</h5>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Grade *</Form.Label>
              <Form.Control
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                isInvalid={!!errors.grade}
                autoComplete="off"
              />
              <Form.Control.Feedback type="invalid">
                {errors.grade}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Famille</Form.Label>
              <Select
                styles={selectStyles}
                options={steelFamilyOptions}
                value={getSelectedOption(steelFamilyOptions, formData.family)}
                onChange={(option) => handleSelectChange(option, 'family')}
                isClearable
                placeholder="Sélectionnez une famille"
                isLoading={loading && steelFamilyOptions.length === 0}
                noOptionsMessage={() => "Aucune famille disponible"}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Standard</Form.Label>
              <Select
                styles={selectStyles}
                options={steelStandardOptions}
                value={getSelectedOption(steelStandardOptions, formData.standard)}
                onChange={(option) => handleSelectChange(option, 'standard')}
                isClearable
                placeholder="Sélectionnez un standard"
                isLoading={loading && steelStandardOptions.length === 0}
                noOptionsMessage={() => "Aucun standard disponible"}
              />
            </Form.Group>
          </Col>
        </Row>
        
        <h5 className="mt-4">Equivalents</h5>
        <Row>
          <Col md={12}>
            {formData.equivalents.map((equivalent, index) => (
              <div key={index} className="d-flex mb-2 align-items-center">
                <div className="flex-grow-1">
                  <Select
                    styles={selectStyles}
                    options={steelGradeOptions}
                    value={getSelectedOption(steelGradeOptions, equivalent.steel_id)}
                    onChange={(option) => handleSelectChange(option, 'equivalents', index, 'steel_id')}
                    placeholder="Sélectionnez un acier équivalent"
                    isLoading={loading && steelGradeOptions.length === 0}
                    noOptionsMessage={() => "Aucun acier disponible"}
                  />
                </div>
                <Button 
                  variant="outline-danger" 
                  size="sm" 
                  className="ms-2"
                  onClick={() => handleRemoveEquivalent(index)}
                >
                  <i className="bi bi-trash"></i>
                </Button>
              </div>
            ))}
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleAddEquivalent}
              disabled={loading}
            >
              <i className="bi bi-plus-circle me-1"></i> Ajouter un équivalent
            </Button>
          </Col>
        </Row>
        
        <h5 className="mt-4">Composition chimique</h5>
        <Row>
          <Col md={12}>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Élément</th>
                  <th style={{ width: '20%' }}>Taux</th>
                  <th style={{ width: '35%' }}>Valeur (%)</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {formData.chemical_elements.map((element, index) => (
                  <tr key={index}>
                    <td>
                      <Select
                        styles={selectStyles}
                        options={elementOptions}
                        value={getSelectedOption(elementOptions, element.element)}
                        onChange={(option) => handleChemicalElementChange(index, 'element', option?.value)}
                        placeholder="Élément"
                        isLoading={loading && elementOptions.length === 0}
                        noOptionsMessage={() => "Aucun élément disponible"}
                      />
                    </td>
                    <td>
                      <Select
                        styles={selectStyles}
                        options={[
                          { value: 'exact', label: '=' },
                          { value: 'range', label: 'min - max' },
                        ]}
                        value={getSelectedOption(
                          [
                            { value: 'exact', label: '=' },
                            { value: 'range', label: 'min - max' },
                          ],
                          element.rate_type
                        )}
                        onChange={(option) => handleRateTypeChange(index, option?.value)}
                        placeholder="Type"
                      />
                    </td>
                    <td>
                      {element.rate_type === 'exact' ? (
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={element.value || ''}
                          onChange={(e) => handleChemicalElementChange(index, 'value', e.target.value)}
                          placeholder="Valeur"
                        />
                      ) : (
                        <div className="d-flex">
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={element.min_value || ''}
                            onChange={(e) => handleChemicalElementChange(index, 'min_value', e.target.value)}
                            placeholder="Min"
                            className="me-1"
                          />
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={element.max_value || ''}
                            onChange={(e) => handleChemicalElementChange(index, 'max_value', e.target.value)}
                            placeholder="Max"
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => handleRemoveChemicalElement(index)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={handleAddChemicalElement}
              disabled={loading}
            >
              <i className="bi bi-plus-circle me-1"></i> Ajouter un élément
            </Button>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? (steel ? 'Modification en cours...' : 'Création en cours...') : (steel ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SteelForm;
