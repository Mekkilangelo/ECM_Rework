import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

const OilQuenchSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  temperatureUnitOptions,
  timeUnitOptions,
  handleOilQuenchSpeedAdd,
  handleOilQuenchSpeedRemove,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  const handleOilQuenchSpeedChange = (index, field, value) => {
    const updatedOilQuenchSpeed = [...formData.quenchData.oilQuenchSpeed];
    updatedOilQuenchSpeed[index] = { ...updatedOilQuenchSpeed[index], [field]: value };
    handleChange({
      target: {
        name: 'quenchData.oilQuenchSpeed',
        value: updatedOilQuenchSpeed
      }
    });
  };

  return (
    <>
      <h5 className="mt-4 mb-2">{t('trials.before.recipeData.quenchData.oil.speedParameters')}</h5>
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('trials.before.recipeData.quenchData.common.step')}</th>
            <th>{t('trials.before.recipeData.quenchData.common.duration')} (s)</th>
            <th>{t('trials.before.recipeData.quenchData.oil.speed')} (rpm)</th>
            {!viewMode && <th style={{ width: '80px' }}>{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {formData.quenchData?.oilQuenchSpeed?.map((step, index) => (
            <tr key={`oil-quench-speed-${index}`}>
              <td className="text-center align-middle">{step.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={step.duration || ''}
                  onChange={(e) => handleOilQuenchSpeedChange(index, 'duration', e.target.value)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.speed || ''}
                  onChange={(e) => handleOilQuenchSpeedChange(index, 'speed', e.target.value)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                />
              </td>
              {!viewMode && (
                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleOilQuenchSpeedRemove(index)}
                    disabled={formData.quenchData?.oilQuenchSpeed?.length <= 1 || loading}
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
            onClick={handleOilQuenchSpeedAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('trials.before.recipeData.quenchData.common.addStep')}
          </Button>
        </div>
      )}

      <h5 className="mt-4 mb-2">{t('trials.before.recipeData.quenchData.oil.parameters')}</h5>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.temperature')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilTemperature"
              value={formData.quenchData?.oilTemperature || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading || viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.tempUnit')}</Form.Label>
            <Select
              name="quenchData.oilTempUnit"
              value={formData.quenchData?.oilTempUnit 
                ? getSelectedOption(temperatureUnitOptions, formData.quenchData?.oilTempUnit) 
                : temperatureUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'quenchData.oilTempUnit' })}
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
              placeholder={t('trials.before.recipeData.quenchData.common.selectUnit')}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.inertingPressure')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilInertingPressure"
              value={formData.quenchData?.oilInertingPressure || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading || viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.inertingDelay')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilInertingDelay"
              value={formData.quenchData?.oilInertingDelay || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading || viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.delayUnit')}</Form.Label>
            <Select
              name="quenchData.oilInertingDelayUnit"
              value={formData.quenchData?.oilInertingDelayUnit 
                ? getSelectedOption(timeUnitOptions, formData.quenchData?.oilInertingDelayUnit) 
                : timeUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'quenchData.oilInertingDelayUnit' })}
              options={timeUnitOptions}
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
              placeholder={t('trials.before.recipeData.quenchData.common.selectUnit')}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.drippingTime')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilDrippingTime"
              value={formData.quenchData?.oilDrippingTime || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading || viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.quenchData.oil.drippingUnit')}</Form.Label>
            <Select
              name="quenchData.oilDrippingTimeUnit"
              value={formData.quenchData?.oilDrippingTimeUnit
                ? getSelectedOption(timeUnitOptions, formData.quenchData?.oilDrippingTimeUnit) 
                : timeUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'quenchData.oilDrippingTimeUnit' })}
              options={timeUnitOptions}
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
              placeholder={t('trials.before.recipeData.quenchData.common.selectUnit')}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default OilQuenchSection;
