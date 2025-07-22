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
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();
  
  const rampOptions = [
    { value: 'up', label: t('tests.before.recipeData.thermalCycle.rampUp'), icon: faArrowUp },
    { value: 'down', label: t('tests.before.recipeData.thermalCycle.rampDown'), icon: faArrowDown },
    { value: 'continue', label: t('tests.before.recipeData.thermalCycle.rampContinue'), icon: faArrowRight }
  ];
  
  return (
    <>
      <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('tests.before.recipeData.thermalCycle.step')}</th>
            <th style={{ width: '150px' }}>{t('tests.before.recipeData.thermalCycle.ramp')}</th>
            <th>{t('tests.before.recipeData.thermalCycle.setpoint')} (°C)</th>
            <th>{t('tests.before.recipeData.thermalCycle.duration')} (min)</th>
            <th style={{ width: '80px' }}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {formData.recipeData?.thermalCycle?.map((cycle, index) => (
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
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
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
                  inputMode="numeric"
                  pattern="[0-9]*"
                  step="1"
                  min="0"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
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
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.before.recipeData.thermalCycle.addStep')}
          </Button>
        </div>
      )}
        {/* Autres paramètres de recette */}
      <h5 className="mt-4 mb-2">{t('tests.before.recipeData.thermalCycle.otherParameters')}</h5>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.thermalCycle.waitTime')} ({t('common.minutes')})</Form.Label>
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
            <Form.Label>{t('tests.before.recipeData.thermalCycle.programDuration')} ({t('common.minutes')})</Form.Label>
            <Form.Control
              type="number"
              value={calculateProgramDuration ? calculateProgramDuration() : '0'}
              readOnly
              disabled
              style={{
                backgroundColor: '#e9ecef',
                border: '1px solid #ced4da',
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
            <Form.Label>{t('tests.before.recipeData.thermalCycle.cellTemp')}</Form.Label>
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
            <Form.Label>{t('tests.before.recipeData.thermalCycle.unit')}</Form.Label>
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
              placeholder={t('tests.before.recipeData.thermalCycle.unit')}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.thermalCycle.waitPressure')}</Form.Label>
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
            <Form.Label>{t('tests.before.recipeData.thermalCycle.unit')}</Form.Label>
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
              placeholder={t('tests.before.recipeData.thermalCycle.unit')}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default ThermalCycleSection;
