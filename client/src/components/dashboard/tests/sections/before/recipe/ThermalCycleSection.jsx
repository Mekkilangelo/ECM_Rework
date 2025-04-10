import React from 'react';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowUp, faArrowDown, faArrowRight } from '@fortawesome/free-solid-svg-icons';

const ThermalCycleSection = ({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption, 
  temperatureUnitOptions, 
  timeUnitOptions, 
  pressureUnitOptions,
  handleThermalCycleAdd,
  handleThermalCycleRemove,
  loading, 
  selectStyles 
}) => {


  const rampOptions = [
    { value: 'up', label: 'Montée', icon: faArrowUp },
    { value: 'down', label: 'Descente', icon: faArrowDown },
    { value: 'continue', label: 'Maintien', icon: faArrowRight }
  ];

  const handleThermalCycleChange = (index, field, value) => {
    const updatedThermalCycle = [...formData.recipeData.thermalCycle];
    updatedThermalCycle[index] = { ...updatedThermalCycle[index], [field]: value };
    handleChange({ 
      target: { 
        name: 'recipeData.thermalCycle', 
        value: updatedThermalCycle 
      } 
    });
  };

  const handleRampChange = (option, index) => {
    handleThermalCycleChange(index, 'ramp', option.value);
  };

  return (
    <>
      <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>Étape</th>
            <th style={{ width: '150px' }}>Rampe</th>
            <th>Consigne (°C)</th>
            <th>Durée (s)</th>
            <th style={{ width: '80px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formData.recipeData?.thermalCycle?.map((cycle, index) => (
            <tr key={`thermal-cycle-${index}`}>
              <td className="text-center align-middle">{cycle.step}</td>
              <td>
                <Select
                  value={getSelectedOption(rampOptions, cycle.ramp)}
                  onChange={(option) => handleRampChange(option, index)}
                  options={rampOptions}
                  menuPortalTarget={document.body}
                  styles={{
                    ...selectStyles,
                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                  }}
                  isDisabled={loading}
                  formatOptionLabel={option => (
                    <div className="d-flex align-items-center">
                      <FontAwesomeIcon icon={option.icon} className="me-2" />
                      {option.label}
                    </div>
                  )}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.setpoint || ''}
                  onChange={(e) => handleThermalCycleChange(index, 'setpoint', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.duration || ''}
                  onChange={(e) => handleThermalCycleChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleThermalCycleRemove(index)}
                  disabled={formData.recipeData?.thermalCycle?.length <= 1 || loading}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      
      <div className="text-end mb-3">
        <Button 
          variant="outline-primary" 
          size="sm" 
          onClick={handleThermalCycleAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> Ajouter une étape
        </Button>
      </div>
      
      {/* Autres paramètres de recette */}
      <h5 className="mt-4 mb-2">Autres paramètres du programme</h5>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Temps d'attente</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.waitTime"
              value={formData.recipeData?.waitTime}
              onChange={handleChange}
              step="0.1"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Unité</Form.Label>
            <Select
              name="recipeData.waitTimeUnit"
              value={getSelectedOption(timeUnitOptions, formData.recipeData?.waitTimeUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.waitTimeUnit' })}
              options={timeUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Unité"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Durée du programme</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.programDuration"
              value={formData.recipeData?.programDuration}
              onChange={handleChange}
              step="0.1"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Unité</Form.Label>
            <Select
              name="recipeData.programDurationUnit"
              value={getSelectedOption(timeUnitOptions, formData.recipeData?.programDurationUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.programDurationUnit' })}
              options={timeUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Unité"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Température cellule</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.cellTemp"
              value={formData.recipeData?.cellTemp}
              onChange={handleChange}
              step="0.1"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Unité</Form.Label>
            <Select
              name="recipeData.cellTempUnit"
              value={getSelectedOption(temperatureUnitOptions, formData.recipeData?.cellTempUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.cellTempUnit' })}
              options={temperatureUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Unité"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Pression d'attente</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.waitPressure"
              value={formData.recipeData?.waitPressure}
              onChange={handleChange}
              step="0.1"
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>Unité</Form.Label>
            <Select
              name="recipeData.waitPressureUnit"
              value={getSelectedOption(pressureUnitOptions, formData.recipeData?.waitPressureUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.waitPressureUnit' })}
              options={pressureUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder="Unité"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default ThermalCycleSection;