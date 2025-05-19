import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';

const PreoxidationSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  coolingMediaOptions,
  temperatureUnitOptions,
  timeUnitOptions,
  loading,
  selectStyles
}) => {
  const { t } = useTranslation();

  return (
    <>
      <h5 className="mt-3 mb-2">{t('tests.before.recipeData.preoxidation.title')}</h5>
      <Row>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.preoxidation.media')}</Form.Label>
            <Select
              name="recipeData.preoxMedia"
              value={getSelectedOption(coolingMediaOptions, formData.recipeData?.preoxMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.preoxMedia' })}
              options={coolingMediaOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.recipeData.preoxidation.media')}
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.preoxidation.temperature')}</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.preoxTemp"
              value={formData.recipeData?.preoxTemp}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.preoxidation.unit')}</Form.Label>
            <Select
              name="recipeData.preoxTempUnit"
              value={formData.recipeData?.preoxTempUnit 
                ? getSelectedOption(temperatureUnitOptions, formData.recipeData?.preoxTempUnit) 
                : temperatureUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.preoxTempUnit' })}
              options={temperatureUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.recipeData.preoxidation.unit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.preoxidation.duration')}</Form.Label>
            <Form.Control
              type="number"
              name="recipeData.preoxDuration"
              value={formData.recipeData?.preoxDuration}
              onChange={handleChange}
              step="0.1"
              disabled={loading}
            />
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.preoxidation.unit')}</Form.Label>
            <Select
              name="recipeData.preoxDurationUnit"
              value={formData.recipeData?.preoxDurationUnit 
                ? getSelectedOption(timeUnitOptions, formData.recipeData?.preoxDurationUnit) 
                : timeUnitOptions[0] || null}
              onChange={(option) => handleSelectChange(option, { name: 'recipeData.preoxDurationUnit' })}
              options={timeUnitOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.recipeData.preoxidation.unit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isDisabled={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default PreoxidationSection;
