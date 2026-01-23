import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';

const ConclusionSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  statusOptions,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  return (
    <div className="p-2">
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.after.conclusion.status')}</Form.Label>
            <Select
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
              placeholder={t('trials.after.conclusion.selectStatus')}
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
            <Form.Label>{t('trials.after.conclusion.conclusionText')}</Form.Label>
            <Form.Control
              as="textarea"
              name="conclusion"
              value={formData.conclusion || ''}
              onChange={handleChange}
              rows={4}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
              placeholder={t('trials.after.conclusion.conclusionPlaceholder')}
            />
          </Form.Group>
        </Col>
      </Row>
    </div>
  );
};

export default ConclusionSection;
