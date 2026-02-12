import React from 'react';
import { useTranslation } from 'react-i18next';
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
  handleThermalCycleChange,
  calculateProgramDuration,
  calculateChemicalCycleDuration,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  // Options pour les gaz (même liste que dans ChemicalCycleSection)
  const gasOptions = [
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' },
    { value: 'N2O', label: 'N2O' },
    { value: 'CO2', label: 'CO2' }
  ];

  const rampOptions = [
    { value: 'up', label: t('trials.before.recipeData.thermalCycle.rampUp'), icon: faArrowUp },
    { value: 'down', label: t('trials.before.recipeData.thermalCycle.rampDown'), icon: faArrowDown },
    { value: 'continue', label: t('trials.before.recipeData.thermalCycle.rampContinue'), icon: faArrowRight }
  ];

  // Fonction pour gérer la touche Entrée
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Vérifier si on est sur la dernière ligne
      const isLastRow = index === (formData.recipeData?.thermalCycle?.length || 1) - 1;
      if (isLastRow) {
        // Ajouter une nouvelle étape
        handleThermalCycleAdd();
        // Focus sur le premier champ de la nouvelle ligne (optionnel)
        setTimeout(() => {
          const newRowIndex = formData.recipeData?.thermalCycle?.length || 0;
          const targetInput = document.querySelector(`input[data-thermal-row="${newRowIndex}"][data-thermal-field="setpoint"]`);
          if (targetInput) {
            targetInput.focus();
          }
        }, 100);
      } else {
        // Passer à la ligne suivante, même champ
        const fieldName = e.target.getAttribute('data-thermal-field');
        const nextRowInput = document.querySelector(`input[data-thermal-row="${index + 1}"][data-thermal-field="${fieldName}"]`);
        if (nextRowInput) {
          nextRowInput.focus();
        }
      }
    }
  };

  return (
    <>
      <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('trials.before.recipeData.thermalCycle.step')}</th>
            <th style={{ width: '150px' }}>{t('trials.before.recipeData.thermalCycle.ramp')}</th>
            <th>{t('trials.before.recipeData.thermalCycle.setpoint')} (°C)</th>
            <th>{t('trials.before.recipeData.thermalCycle.duration')} (min)</th>
            <th style={{ width: '80px' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {formData.recipeData?.thermalCycle?.slice().sort((a, b) => a.step - b.step).map((cycle, index) => (
            <tr key={`thermal-cycle-${index}`}>
              <td className="text-center align-middle">{cycle.step}</td>
              <td>
                <Select
                  value={getSelectedOption(rampOptions, cycle.ramp)}
                  onChange={(option) => handleThermalCycleChange(index, 'ramp', option.value)}
                  options={rampOptions}
                  menuPortalTarget={document.body}
                  styles={{
                    ...selectStyles,
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    ...(viewMode ? {
                      control: (provided) => ({
                        ...provided,
                        ...readOnlyFieldStyle,
                        cursor: 'default'
                      }),
                      dropdownIndicator: () => ({ display: 'none' }),
                      indicatorSeparator: () => ({ display: 'none' })
                    } : {})
                  }}
                  isDisabled={loading || viewMode}
                  isClearable={!viewMode}
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
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                  data-thermal-row={index}
                  data-thermal-field="setpoint"
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.duration || ''}
                  onChange={(e) => {
                    // Filtrer pour ne garder que les chiffres entiers
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    // Vérifier que nous avons des paramètres valides
                    if (typeof index !== 'undefined' && handleThermalCycleChange) {
                      handleThermalCycleChange(index, 'duration', value);
                    }
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="1"
                  min="0"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                  data-thermal-row={index}
                  data-thermal-field="duration"
                />
              </td>
              <td className="text-center">
                {!viewMode && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleThermalCycleRemove(index)}
                    disabled={formData.recipeData?.thermalCycle?.length <= 1 || loading}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {!viewMode && (
        <div className="text-end mb-3">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleThermalCycleAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('trials.before.recipeData.thermalCycle.addStep')}
          </Button>
        </div>
      )}
      {/* Autres paramètres de recette */}
      <h5 className="mt-4 mb-2">{t('trials.before.recipeData.thermalCycle.otherParameters')}</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.waitTime')} ({t('common.minutes')})</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.waitTime"
              value={formData.recipeData?.waitTime || ''}
              onChange={(e) => {
                // Vérifier que e.target.name existe pour éviter l'erreur includes
                if (!e.target.name) return;

                // Filtrer pour ne garder que les chiffres entiers
                const value = e.target.value.replace(/[^0-9]/g, '');
                // Créer un événement modifié avec la valeur filtrée
                const modifiedEvent = {
                  ...e,
                  target: {
                    ...e.target,
                    name: e.target.name,
                    value: value
                  }
                };
                handleChange(modifiedEvent);
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              min="0"
              step="1"
              placeholder={t('common.minutes')}
              style={viewMode ? readOnlyFieldStyle : {}}
              readOnly={viewMode}
              disabled={loading || viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.programDuration')} ({t('common.minutes')})</Form.Label>
            <Form.Control
              type="number"
              value={calculateProgramDuration ? calculateProgramDuration() : '0'}
              readOnly
              disabled
              style={{
                backgroundColor: calculateChemicalCycleDuration && Math.abs(calculateProgramDuration() - calculateChemicalCycleDuration()) < 0.1
                  ? '#d4edda' // Vert si égal (avec tolérance de 0.1)
                  : '#f8d7da', // Rouge si différent
                borderColor: calculateChemicalCycleDuration && Math.abs(calculateProgramDuration() - calculateChemicalCycleDuration()) < 0.1
                  ? '#c3e6cb'
                  : '#f5c6cb',
                cursor: 'not-allowed',
                color: '#6c757d'
              }}
              placeholder={t('common.calculated')}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.cellTemp')}</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.cellTemp"
              value={formData.recipeData?.cellTemp}
              onChange={handleChange}
              step="0.1"
              style={viewMode ? readOnlyFieldStyle : {}}
              readOnly={viewMode}
              disabled={loading || viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.unit')}</Form.Label>
            <Select
              name="recipeData.cellTempUnit"
              value={formData.recipeData?.cellTempUnit
                ? getSelectedOption(temperatureUnitOptions, formData.recipeData?.cellTempUnit)
                : temperatureUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.cellTempUnit' })}
              options={temperatureUnitOptions}
              isClearable={!viewMode}
              isDisabled={loading || viewMode}
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
              placeholder={t('trials.before.recipeData.thermalCycle.unit')}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.processTemp')}</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.processTemp"
              value={formData.recipeData?.processTemp}
              onChange={handleChange}
              step="0.1"
              style={viewMode ? readOnlyFieldStyle : {}}
              readOnly={viewMode}
              disabled={loading || viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.unit')}</Form.Label>
            <Select
              name="recipeData.processTempUnit"
              value={formData.recipeData?.processTempUnit
                ? getSelectedOption(temperatureUnitOptions, formData.recipeData?.processTempUnit)
                : temperatureUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.processTempUnit' })}
              options={temperatureUnitOptions}
              isClearable={!viewMode}
              isDisabled={loading || viewMode}
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
              placeholder={t('trials.before.recipeData.thermalCycle.unit')}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.waitPressure')}</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.waitPressure"
              value={formData.recipeData?.waitPressure}
              onChange={handleChange}
              step="0.1"
              style={viewMode ? readOnlyFieldStyle : {}}
              readOnly={viewMode}
              disabled={loading || viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.unit')}</Form.Label>
            <Select
              name="recipeData.waitPressureUnit"
              value={formData.recipeData?.waitPressureUnit
                ? getSelectedOption(pressureUnitOptions, formData.recipeData?.waitPressureUnit)
                : pressureUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.waitPressureUnit' })}
              options={pressureUnitOptions}
              isClearable={!viewMode}
              isDisabled={loading || viewMode}
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
              placeholder={t('trials.before.recipeData.thermalCycle.unit')}
            />
          </Form.Group>
        </Col>
      </Row>

      {/* Nouveaux champs pour wait gas et wait flow */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.waitGas')}</Form.Label>
            <Select
              name="recipeData.waitGas"
              value={formData.recipeData?.waitGas
                ? getSelectedOption(gasOptions, formData.recipeData?.waitGas)
                : null}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.waitGas' })}
              options={gasOptions}
              isClearable={!viewMode}
              isDisabled={loading || viewMode}
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
              placeholder={t('trials.before.recipeData.thermalCycle.selectGas')}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.thermalCycle.waitFlow')}</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.waitFlow"
              value={formData.recipeData?.waitFlow || ''}
              onChange={handleChange}
              step="0.1"
              style={viewMode ? readOnlyFieldStyle : {}}
              readOnly={viewMode}
              disabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.thermalCycle.enterFlow')}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default ThermalCycleSection;
