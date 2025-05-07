import React from 'react';
import { Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';

const BasicInfoSection = ({
  formData,
  errors,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  designationOptions,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  const handleCreateDesignation = (inputValue) => {
    return handleCreateOption(inputValue, 'designation', 'parts', 'designation');
  };

  // Styles modifiés pour le mode lecture seule
  const customSelectStyles = viewMode ? {
    ...selectStyles,
    control: (provided) => ({
      ...provided,
      ...readOnlyFieldStyle,
      cursor: 'default'
    }),
    dropdownIndicator: () => ({ display: 'none' }),
    indicatorSeparator: () => ({ display: 'none' })
  } : selectStyles;

  return (
    <div className="row">
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>{t('parts.basicInfo.designation')} {!viewMode && <span className="text-danger fw-bold">*</span>}</Form.Label>
          <CreatableSelect
            name="designation"
            value={getSelectedOption(designationOptions, formData.designation)}
            onChange={(option) => handleSelectChange(option, { name: 'designation' })}
            options={designationOptions}
            isClearable={!viewMode}
            styles={customSelectStyles}
            placeholder={t('parts.basicInfo.selectDesignation')}
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
            formatCreateLabel={(inputValue) =>  `${t('common.addOption')} "${inputValue}"`}
            onCreateOption={handleCreateDesignation}
            isDisabled={viewMode}
          />
          {!viewMode && errors.designation && (
            <div className="text-danger mt-1 small">
              {t(errors.designation)}
            </div>
          )}
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>{t('parts.basicInfo.clientDesignation')}</Form.Label>
          <Form.Control
            type="text"
            name="clientDesignation"
            value={formData.clientDesignation || ''}
            onChange={handleChange}
            isInvalid={!viewMode && !!errors.clientDesignation}
            autoComplete="off"
            disabled={viewMode}
            readOnly={viewMode}
            style={viewMode ? readOnlyFieldStyle : {}}
          />
          {!viewMode && (
            <Form.Control.Feedback type="invalid">
              {errors.clientDesignation}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>{t('parts.basicInfo.reference')}</Form.Label>
          <Form.Control
            type="text"
            name="reference"
            value={formData.reference || ''}
            onChange={handleChange}
            isInvalid={!viewMode && !!errors.reference}
            autoComplete="off"
            disabled={viewMode}
            readOnly={viewMode}
            style={viewMode ? readOnlyFieldStyle : {}}
          />
          {!viewMode && (
            <Form.Control.Feedback type="invalid">
              {errors.reference}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>{t('parts.quantity')}</Form.Label>
          <Form.Control
            type="number"
            name="quantity"
            value={formData.quantity || ''}
            onChange={handleChange}
            isInvalid={!viewMode && !!errors.quantity}
            autoComplete="off"
            disabled={viewMode}
            readOnly={viewMode}
            style={viewMode ? readOnlyFieldStyle : {}}
          />
          {!viewMode && (
            <Form.Control.Feedback type="invalid">
              {errors.quantity}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      </div>
      <div className="col-md-12">
        <Form.Group className="mb-3">
          <Form.Label>{t('parts.basicInfo.description')}</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            isInvalid={!viewMode && !!errors.description}
            autoComplete="off"
            disabled={viewMode}
            readOnly={viewMode}
            style={viewMode ? readOnlyFieldStyle : {}}
          />
          {!viewMode && (
            <Form.Control.Feedback type="invalid">
              {errors.description}
            </Form.Control.Feedback>
          )}
        </Form.Group>
      </div>
    </div>
  );
};

export default BasicInfoSection;
