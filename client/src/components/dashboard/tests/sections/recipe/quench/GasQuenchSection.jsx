import React from 'react';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const GasQuenchSection = ({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption, 
  handleGasQuenchSpeedAdd,
  handleGasQuenchSpeedRemove,
  handleGasQuenchPressureAdd,
  handleGasQuenchPressureRemove,
  loading, 
  selectStyles 
}) => {
  
  const handleGasQuenchSpeedChange = (index, field, value) => {
    const updatedGasQuenchSpeed = [...formData.quenchData.gasQuenchSpeed];
    updatedGasQuenchSpeed[index] = { ...updatedGasQuenchSpeed[index], [field]: value };
    handleChange({ 
      target: { 
        name: 'quenchData.gasQuenchSpeed', 
        value: updatedGasQuenchSpeed 
      } 
    });
  };
  
  const handleGasQuenchPressureChange = (index, field, value) => {
    const updatedGasQuenchPressure = [...formData.quenchData.gasQuenchPressure];
    updatedGasQuenchPressure[index] = { ...updatedGasQuenchPressure[index], [field]: value };
    handleChange({ 
      target: { 
        name: 'quenchData.gasQuenchPressure', 
        value: updatedGasQuenchPressure 
      } 
    });
  };

  return (
    <>
      <h5 className="mt-4 mb-2">Paramètres de Vitesse</h5>
      
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>Étape</th>
            <th>Durée</th>
            <th>Vitesse</th>
            <th style={{ width: '80px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.gasQuenchSpeed?.map((step, index) => (
            <tr key={`gas-quench-speed-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleGasQuenchSpeedChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.speed || ''}
                  onChange={(e) => handleGasQuenchSpeedChange(index, 'speed', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleGasQuenchSpeedRemove(index)}
                  disabled={formData.quenchData?.gasQuenchSpeed?.length <= 1 || loading}
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
          onClick={handleGasQuenchSpeedAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> Ajouter une étape
        </Button>
      </div>
      
      <h5 className="mt-4 mb-2">Paramètres de Pression</h5>
      
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>Étape</th>
            <th>Durée</th>
            <th>Pression</th>
            <th style={{ width: '80px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.gasQuenchPressure?.map((step, index) => (
            <tr key={`gas-quench-pressure-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleGasQuenchPressureChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.pressure || ''}
                  onChange={(e) => handleGasQuenchPressureChange(index, 'pressure', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleGasQuenchPressureRemove(index)}
                  disabled={formData.quenchData?.gasQuenchPressure?.length <= 1 || loading}
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
          onClick={handleGasQuenchPressureAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> Ajouter une étape
        </Button>
      </div>
      
      <h5 className="mt-4 mb-2">Autres paramètres de trempe au gaz</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Tolérance minimum</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.gasToleranceMin"
              value={formData.quenchData?.gasToleranceMin || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Tolérance maximum</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.gasToleranceMax"
              value={formData.quenchData?.gasToleranceMax || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default GasQuenchSection;