import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';
import { isValidNewOption, customFilterOption } from '../../../../../../utils/selectHelpers';

const BasicInfoSection = React.memo(({
  formData,
  errors,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  locationOptions,
  statusOptions,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t, i18n } = useTranslation();
  
  // Définir le format de date en fonction de la langue
  const dateFormat = i18n.language === 'fr' ? 'JJ/MM/AAAA' : 'DD/MM/YYYY';

  // Handler pour créer une nouvelle location
  const handleCreateLocation = (inputValue) =>
    handleCreateOption(inputValue, 'location', 'trials', 'location');

  return (
    <>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.basicInfo.loadNumber')}</Form.Label>            <Form.Control
              type="text"
              name="loadNumber"
              value={formData.loadNumber || ''}
              onChange={handleChange}
              autoComplete="off"
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.basicInfo.trialDate')} <span className="text-danger fw-bold">*</span></Form.Label>
            <Form.Control
              type="date"
              name="trialDate"
              value={formData.trialDate || ''}
              onChange={handleChange}
              data-date-format={dateFormat}
              title={dateFormat}
              isInvalid={!!errors.trialDate}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
            {errors.trialDate && (
              <Form.Control.Feedback type="invalid">
                {t(errors.trialDate)}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.basicInfo.location')}</Form.Label>            <CreatableSelect
              name="location"
              value={getSelectedOption(locationOptions, formData.location)}
              onChange={(option) => handleSelectChange(option, { name: 'location' })}
              onCreateOption={handleCreateLocation}
              options={locationOptions}
              isClearable
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
              placeholder={t('trials.basicInfo.selectOrAddLocation')}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.basicInfo.status')}</Form.Label>            <Select
              name="status"
              value={getSelectedOption(statusOptions, formData.status)}
              onChange={(option) => handleSelectChange(option, { name: 'status' })}
              options={statusOptions}
              isClearable
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
              placeholder={t('trials.basicInfo.selectStatus')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.basicInfo.description')}</Form.Label>            <Form.Control
              as="textarea"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
      </Row>    </>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';

export default BasicInfoSection;
