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
  selectStyles
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
      <h5 className="mt-4 mb-2">{t('tests.before.recipeData.quenchData.oil.speedParameters')}</h5>
      <Table responsive bordered size="sm" className="mt-2">
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('tests.before.recipeData.quenchData.common.step')}</th>
            <th>{t('tests.before.recipeData.quenchData.common.duration')}</th>
            <th>{t('tests.before.recipeData.quenchData.oil.speed')}</th>
            <th style={{ width: '80px' }}>{t('common.actions')}</th>
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
                  disabled={loading}
                />
              </td>
              <td>
                <Form.Control
                  type="number"
                  value={step.speed || ''}
                  onChange={(e) => handleOilQuenchSpeedChange(index, 'speed', e.target.value)}
                  step="0.1"
                  disabled={loading}
                />
              </td>
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
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="text-end mb-3">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleOilQuenchSpeedAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.before.recipeData.quenchData.common.addStep')}
        </Button>
      </div>

      <h5 className="mt-4 mb-2">{t('tests.before.recipeData.quenchData.oil.parameters')}</h5>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.temperature')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilTemperature"
              value={formData.quenchData?.oilTemperature || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.tempUnit')}</Form.Label>
            <Select
              name="quenchData.oilTempUnit"
              value={getSelectedOption(temperatureUnitOptions, formData.quenchData?.oilTempUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'quenchData.oilTempUnit' })}
              options={temperatureUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.recipeData.quenchData.common.selectUnit')}
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.inertingPressure')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilInertingPressure"
              value={formData.quenchData?.oilInertingPressure || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.inertingDelay')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilInertingDelay"
              value={formData.quenchData?.oilInertingDelay || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.delayUnit')}</Form.Label>
            <Select
              name="quenchData.oilInertingDelayUnit"
              value={getSelectedOption(timeUnitOptions, formData.quenchData?.oilInertingDelayUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'quenchData.oilInertingDelayUnit' })}
              options={timeUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.recipeData.quenchData.common.selectUnit')}
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.drippingTime')}</Form.Label>
            <Form.Control
              type="number"
              name="quenchData.oilDrippingTime"
              value={formData.quenchData?.oilDrippingTime || ''}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.quenchData.oil.drippingUnit')}</Form.Label>
            <Select
              name="quenchData.oilDrippingTimeUnit"
              value={getSelectedOption(timeUnitOptions, formData.quenchData?.oilDrippingTimeUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'quenchData.oilDrippingTimeUnit' })}
              options={timeUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.recipeData.quenchData.common.selectUnit')}
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default OilQuenchSection;
