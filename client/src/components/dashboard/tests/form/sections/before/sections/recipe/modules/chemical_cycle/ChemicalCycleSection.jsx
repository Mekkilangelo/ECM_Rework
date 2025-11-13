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
  calculateProgramDuration,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();
  
  // Fonction pour calculer la durée totale du cycle chimique en minutes (incluant waitTime)
  const calculateChemicalCycleDurationMinutes = () => {
    if (!formData.recipeData?.chemicalCycle) return 0;
    
    // Somme des temps du cycle chimique en secondes
    const totalSeconds = formData.recipeData.chemicalCycle.reduce((total, step) => {
      return total + (parseInt(step.time) || 0);
    }, 0);
    
    // Convertir en minutes
    let totalMinutes = totalSeconds / 60;
    
    // Ajouter le waitTime s'il existe
    const waitTime = parseInt(formData.recipeData?.waitTime) || 0;
    totalMinutes += waitTime;
    
    return Math.round(totalMinutes); // Arrondi à la minute la plus proche (valeur entière)
  };

  // Fonction pour calculer la durée totale des steps en secondes (SANS wait time)
  const calculateStepsTotalSeconds = () => {
    if (!formData.recipeData?.chemicalCycle) return 0;
    
    return formData.recipeData.chemicalCycle.reduce((total, step) => {
      return total + (parseInt(step.time) || 0);
    }, 0);
  };

  // Fonction pour convertir des secondes en format "Xm Ys"
  const formatSecondsToMinSec = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // Fonction pour calculer le total d'une colonne de gaz en minutes/secondes
  const calculateGasTotalTime = (gasNumber) => {
    if (!formData.recipeData?.chemicalCycle) return { seconds: 0, formatted: '0s' };
    
    let totalSeconds = 0;
    
    formData.recipeData.chemicalCycle.forEach(step => {
      const flowRate = parseFloat(step[`debit${gasNumber}`]) || 0;
      const stepTime = parseInt(step.time) || 0;
      
      // Si le débit n'est pas 0, on compte le temps de cette étape
      if (flowRate > 0) {
        totalSeconds += stepTime;
      }
    });
    
    return {
      seconds: totalSeconds,
      formatted: formatSecondsToMinSec(totalSeconds)
    };
  };
  
  const gasOptions = [
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' },
    { value: 'N2O', label: 'N2O' },
    { value: 'CO2', label: 'CO2' }
  ];

  // Fonction pour gérer la touche Entrée
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Vérifier si on est sur la dernière ligne
      const isLastRow = index === (formData.recipeData?.chemicalCycle?.length || 1) - 1;
      if (isLastRow) {
        // Ajouter une nouvelle étape
        handleChemicalCycleAdd();
        // Focus sur le premier champ de la nouvelle ligne (optionnel)
        setTimeout(() => {
          const newRowIndex = formData.recipeData?.chemicalCycle?.length || 0;
          const targetInput = document.querySelector(`input[data-chemical-row="${newRowIndex}"][data-chemical-field="time"]`);
          if (targetInput) {
            targetInput.focus();
          }
        }, 100);
      } else {
        // Passer à la ligne suivante, même champ
        const fieldName = e.target.getAttribute('data-chemical-field');
        const nextRowInput = document.querySelector(`input[data-chemical-row="${index + 1}"][data-chemical-field="${fieldName}"]`);
        if (nextRowInput) {
          nextRowInput.focus();
        }
      }
    }
  };
  
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
            <Form.Label>{t('trials.before.recipeData.chemicalCycle.gas')} 1</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas1)}
              onChange={(option) => handleGlobalGasChange(option, 1)}
              options={gasOptions}
              styles={viewMode ? {
                ...selectStyles,
                control: (provided) => ({
                  ...provided,
                  ...readOnlyFieldStyle,
                  cursor: 'default'
                }),
                dropdownIndicator: () => ({ display: 'none' }),
                indicatorSeparator: () => ({ display: 'none' })
              } : selectStyles}
              isDisabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.chemicalCycle.selectGas')}
              isClearable={!viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('trials.before.recipeData.chemicalCycle.gas')} 2</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas2)}
              onChange={(option) => handleGlobalGasChange(option, 2)}
              options={gasOptions}
              styles={viewMode ? {
                ...selectStyles,
                control: (provided) => ({
                  ...provided,
                  ...readOnlyFieldStyle,
                  cursor: 'default'
                }),
                dropdownIndicator: () => ({ display: 'none' }),
                indicatorSeparator: () => ({ display: 'none' })
              } : selectStyles}
              isDisabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.chemicalCycle.selectGas')}
              isClearable={!viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('trials.before.recipeData.chemicalCycle.gas')} 3</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas3)}
              onChange={(option) => handleGlobalGasChange(option, 3)}
              options={gasOptions}
              styles={viewMode ? {
                ...selectStyles,
                control: (provided) => ({
                  ...provided,
                  ...readOnlyFieldStyle,
                  cursor: 'default'
                }),
                dropdownIndicator: () => ({ display: 'none' }),
                indicatorSeparator: () => ({ display: 'none' })
              } : selectStyles}
              isDisabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.chemicalCycle.selectGas')}
              isClearable={!viewMode}
            />
          </Form.Group>
        </Col>
      </Row>
      <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('trials.before.recipeData.chemicalCycle.step')}</th>
            <th>{t('trials.before.recipeData.chemicalCycle.time')} (s)</th>
            {formData.recipeData.selectedGas1 && (
              <th className="text-center">
                {t('trials.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas1} (Nl/h)
              </th>
            )}
            {formData.recipeData.selectedGas2 && (
              <th className="text-center">
                {t('trials.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas2} (Nl/h)
              </th>
            )}
            {formData.recipeData.selectedGas3 && (
              <th className="text-center">
                {t('trials.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas3} (Nl/h)
              </th>
            )}
            <th>{t('trials.before.recipeData.chemicalCycle.pressure')} (mb)</th>
            <th className="text-center">{t('trials.before.recipeData.chemicalCycle.turbine')}</th>
            {!viewMode && (
              <th style={{ width: '80px' }}>{t('common.actions')}</th>
            )}
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
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                  data-chemical-row={index}
                  data-chemical-field="time"
                />
              </td>
              {/* Débit pour Gaz 1 */}
              {formData.recipeData.selectedGas1 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('trials.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit1 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit1', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    step="0.1"
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    data-chemical-row={index}
                    data-chemical-field="debit1"
                  />
                </td>
              )}
              {/* Débit pour Gaz 2 */}
              {formData.recipeData.selectedGas2 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('trials.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit2 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit2', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    step="0.1"
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    data-chemical-row={index}
                    data-chemical-field="debit2"
                  />
                </td>
              )}
              {/* Débit pour Gaz 3 */}
              {formData.recipeData.selectedGas3 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('trials.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit3 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit3', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    step="0.1"
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    data-chemical-row={index}
                    data-chemical-field="debit3"
                  />
                </td>
              )}
              <td>
                <Form.Control
                  type="number"
                  value={cycle.pressure || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'pressure', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                  data-chemical-row={index}
                  data-chemical-field="pressure"
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
                      disabled={loading || viewMode}
                      readOnly={viewMode}
                    />
                    <label className="custom-control-label" htmlFor={`turbine-custom-switch-${index}`}></label>
                  </div>
                </div>
              </td>
              {!viewMode && (
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
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {!viewMode && (
        <div className="text-end mb-3">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleChemicalCycleAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('trials.before.recipeData.chemicalCycle.addStep')}
          </Button>
        </div>
      )}
      
      {/* Section des totaux de durée */}
      <div className="row mb-3">
        <div className="col-12">
          <h6 className="text-muted mb-3">{t('trials.before.recipeData.chemicalCycle.durationTotals')}</h6>
        </div>
        
        {/* Total des steps en secondes et en format min/sec */}
        <div className="col-md-6">
          <div className="row">
            <div className="col-6">
              <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalStepsSeconds')}</label>
              <input
                type="text"
                className="form-control"
                value={`${calculateStepsTotalSeconds()}s`}
                readOnly
                style={{
                  ...readOnlyFieldStyle,
                  backgroundColor: '#e9ecef',
                  borderColor: '#ced4da'
                }}
              />
            </div>
            <div className="col-6">
              <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalStepsFormatted')}</label>
              <input
                type="text"
                className="form-control"
                value={formatSecondsToMinSec(calculateStepsTotalSeconds())}
                readOnly
                style={{
                  ...readOnlyFieldStyle,
                  backgroundColor: '#e9ecef',
                  borderColor: '#ced4da'
                }}
              />
            </div>
          </div>
        </div>

        {/* Totaux des gaz */}
        <div className="col-md-6">
          <div className="row">
            {formData.recipeData.selectedGas1 && (
              <div className="col-4">
                <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalGas')} {formData.recipeData.selectedGas1}</label>
                <input
                  type="text"
                  className="form-control"
                  value={calculateGasTotalTime(1).formatted}
                  readOnly
                  style={{
                    ...readOnlyFieldStyle,
                    backgroundColor: '#d1ecf1',
                    borderColor: '#bee5eb'
                  }}
                />
              </div>
            )}
            {formData.recipeData.selectedGas2 && (
              <div className="col-4">
                <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalGas')} {formData.recipeData.selectedGas2}</label>
                <input
                  type="text"
                  className="form-control"
                  value={calculateGasTotalTime(2).formatted}
                  readOnly
                  style={{
                    ...readOnlyFieldStyle,
                    backgroundColor: '#d4edda',
                    borderColor: '#c3e6cb'
                  }}
                />
              </div>
            )}
            {formData.recipeData.selectedGas3 && (
              <div className="col-4">
                <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalGas')} {formData.recipeData.selectedGas3}</label>
                <input
                  type="text"
                  className="form-control"
                  value={calculateGasTotalTime(3).formatted}
                  readOnly
                  style={{
                    ...readOnlyFieldStyle,
                    backgroundColor: '#fff3cd',
                    borderColor: '#ffeaa7'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Champ calculé pour la durée totale du cycle chimique */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">{t('trials.before.chemicalCycle.totalCycleDuration')}</label>
          <input
            type="text"
            className="form-control"
            value={calculateChemicalCycleDurationMinutes()}
            readOnly
            style={{
              ...readOnlyFieldStyle,
              backgroundColor: calculateProgramDuration && Math.abs(calculateProgramDuration() - calculateChemicalCycleDurationMinutes()) < 0.1 
                ? '#d4edda' // Vert si égal (avec tolérance de 0.1)
                : '#f8d7da', // Rouge si différent
              borderColor: calculateProgramDuration && Math.abs(calculateProgramDuration() - calculateChemicalCycleDurationMinutes()) < 0.1 
                ? '#c3e6cb' 
                : '#f5c6cb'
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ChemicalCycleSection;
