import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';

const BasicInfoSection = ({
  formData,
  errors,
  handleChange,
  handleSelectChange,
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

  return (
    <>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.basicInfo.loadNumber')}</Form.Label>            <Form.Control
              type="text"
              name="loadNumber"
              value={formData.loadNumber || ''}
              onChange={handleChange}
              autocomplete="off"
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.basicInfo.testDate')} <span className="text-danger fw-bold">*</span></Form.Label>            <Form.Control
              type="date"
              name="testDate"
              value={formData.testDate || ''}
              onChange={handleChange}
              data-date-format={dateFormat}
              title={dateFormat}
              isInvalid={!!errors.testDate}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
            {errors.testDate && (
              <Form.Control.Feedback type="invalid">
                {t(errors.testDate)}
              </Form.Control.Feedback>
            )}
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.basicInfo.location')}</Form.Label>            <Select
              name="location"
              value={getSelectedOption(locationOptions, formData.location)}
              onChange={(option) => handleSelectChange(option, { name: 'location' })}
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
              placeholder={t('tests.basicInfo.selectLocation')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.basicInfo.status')}</Form.Label>            <Select
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
              placeholder={t('tests.basicInfo.selectStatus')}
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
            <Form.Label>{t('tests.basicInfo.description')}</Form.Label>            <Form.Control
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
      </Row>
    </>
  );
};

export default BasicInfoSection;
