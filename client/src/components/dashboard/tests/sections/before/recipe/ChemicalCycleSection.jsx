import React from 'react';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const ChemicalCycleSection = ({ 
  formData, 
  handleChange, 
  handleSelectChange, 
  getSelectedOption, 
  handleChemicalCycleAdd,
  handleChemicalCycleRemove,
  loading, 
  selectStyles 
}) => {
  const gasOptions = [
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' }
  ];

  const handleChemicalCycleChange = (index, field, value) => {
    const updatedChemicalCycle = [...formData.recipeData.chemicalCycle];
    updatedChemicalCycle[index] = { ...updatedChemicalCycle[index], [field]: value };
    handleChange({ 
      target: { 
        name: 'recipeData.chemicalCycle', 
        value: updatedChemicalCycle 
      } 
    });
  };

  const handleGasChange = (option, index) => {
    handleChemicalCycleChange(index, 'gas', option.value);
  };

  return (
    <> 
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>Étape</th>
            <th>Temps</th>
            <th>Gaz</th>
            <th>Débit</th>
            <th>Pression</th>
            <th style={{ width: '80px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {formData.recipeData?.chemicalCycle?.map((cycle, index) => (
            <tr key={`chemical-cycle-${index}`}>
              <td className="text-center align-middle">{cycle.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.time || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'time', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Select
                  value={getSelectedOption(gasOptions, cycle.gas)}
                  onChange={(option) => handleGasChange(option, index)}
                  options={gasOptions}
                  styles={selectStyles}
                  isDisabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.debit || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'debit', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.pressure || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'pressure', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              <td className="text-center">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleChemicalCycleRemove(index)}
                  disabled={formData.recipeData?.chemicalCycle?.length <= 1 || loading}
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
          onClick={handleChemicalCycleAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> Ajouter une étape
        </Button>
      </div>
    </>
  );
};

export default ChemicalCycleSection;