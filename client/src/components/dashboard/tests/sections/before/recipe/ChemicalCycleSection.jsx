import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  const gasOptions = [
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' },
    { value: 'H2', label: 'H2' },
    { value: 'Ar', label: 'Ar' }
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
  
  const handleTurbineChange = (index, checked) => {
    const updatedChemicalCycle = [...formData.recipeData.chemicalCycle];
    updatedChemicalCycle[index] = { ...updatedChemicalCycle[index], turbine: checked };
    handleChange({
      target: {
        name: 'recipeData.chemicalCycle',
        value: updatedChemicalCycle
      }
    });
  };
  
  const handleGlobalGasChange = (option, gasNumber) => {
    handleChange({
      target: {
        name: `recipeData.selectedGas${gasNumber}`,
        value: option ? option.value : ''
      }
    });
  };
  
  return (
    <>
      {/* Global gas selection section */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('tests.before.recipeData.chemicalCycle.gas')} 1</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas1)}
              onChange={(option) => handleGlobalGasChange(option, 1)}
              options={gasOptions}
              styles={selectStyles}
              isDisabled={loading}
              placeholder={t('tests.before.recipeData.chemicalCycle.selectGas')}
              isClearable
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('tests.before.recipeData.chemicalCycle.gas')} 2</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas2)}
              onChange={(option) => handleGlobalGasChange(option, 2)}
              options={gasOptions}
              styles={selectStyles}
              isDisabled={loading}
              placeholder={t('tests.before.recipeData.chemicalCycle.selectGas')}
              isClearable
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('tests.before.recipeData.chemicalCycle.gas')} 3</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas3)}
              onChange={(option) => handleGlobalGasChange(option, 3)}
              options={gasOptions}
              styles={selectStyles}
              isDisabled={loading}
              placeholder={t('tests.before.recipeData.chemicalCycle.selectGas')}
              isClearable
            />
          </Form.Group>
        </Col>
      </Row>
      <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('tests.before.recipeData.chemicalCycle.step')}</th>
            <th>{t('tests.before.recipeData.chemicalCycle.time')} (s)</th>
            {formData.recipeData.selectedGas1 && (
              <th className="text-center">
                {t('tests.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas1} (Nl/h)
              </th>
            )}
            {formData.recipeData.selectedGas2 && (
              <th className="text-center">
                {t('tests.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas2} (Nl/h)
              </th>
            )}
            {formData.recipeData.selectedGas3 && (
              <th className="text-center">
                {t('tests.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas3} (Nl/h)
              </th>
            )}
            <th>{t('tests.before.recipeData.chemicalCycle.pressure')} (mb)</th>
            <th className="text-center">{t('tests.before.recipeData.chemicalCycle.turbine')}</th>
            <th style={{ width: '80px' }}>{t('common.actions')}</th>
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
              {/* Débit pour Gaz 1 */}
              {formData.recipeData.selectedGas1 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('tests.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit1 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit1', e.target.value)}
                    step="0.1"
                    disabled={loading}
                  />
                </td>
              )}
              {/* Débit pour Gaz 2 */}
              {formData.recipeData.selectedGas2 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('tests.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit2 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit2', e.target.value)}
                    step="0.1"
                    disabled={loading}
                  />
                </td>
              )}
              {/* Débit pour Gaz 3 */}
              {formData.recipeData.selectedGas3 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('tests.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit3 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit3', e.target.value)}
                    step="0.1"
                    disabled={loading}
                  />
                </td>
              )}
              <td>
                <Form.Control
                  type="number"
                  value={cycle.pressure || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'pressure', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
              {/* Colonne Turbine avec case à cocher */}
              <td className="text-center align-middle">
                <div className="form-group mb-0">
                  <div className="custom-control custom-switch custom-control-lg mx-auto" style={{ width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id={`turbine-custom-switch-${index}`}
                      checked={cycle.turbine || false}
                      onChange={(e) => handleTurbineChange(index, e.target.checked)}
                      disabled={loading}
                    />
                    <label className="custom-control-label" htmlFor={`turbine-custom-switch-${index}`}></label>
                  </div>
                </div>
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
          <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.before.recipeData.chemicalCycle.addStep')}
        </Button>
      </div>
    </>
  );
};

export default ChemicalCycleSection;
