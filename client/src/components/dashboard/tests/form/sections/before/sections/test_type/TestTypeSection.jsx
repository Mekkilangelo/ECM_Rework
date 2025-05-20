import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';

const TestTypeSection = ({
  formData,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  mountingTypeOptions,
  positionTypeOptions,
  processTypeOptions,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  const handleCreateMountingType = (inputValue) =>
    handleCreateOption(inputValue, 'mountingType', 'tests', 'mounting_type');
  
  const handleCreatePositionType = (inputValue) =>
    handleCreateOption(inputValue, 'positionType', 'tests', 'position_type');
  
  const handleCreateProcessType = (inputValue) =>
    handleCreateOption(inputValue, 'processType', 'tests', 'process_type');
  
  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.testType.mountingType')}</Form.Label>            <CreatableSelect
              name="mountingType"
              value={getSelectedOption(mountingTypeOptions, formData.mountingType)}
              onChange={(option) => handleSelectChange(option, { name: 'mountingType' })}
              onCreateOption={handleCreateMountingType}
              options={mountingTypeOptions}
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
              placeholder={t('tests.before.testType.selectOrAddMountingType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.testType.positionType')}</Form.Label>            <CreatableSelect
              name="positionType"
              value={getSelectedOption(positionTypeOptions, formData.positionType)}
              onChange={(option) => handleSelectChange(option, { name: 'positionType' })}
              onCreateOption={handleCreatePositionType}
              options={positionTypeOptions}
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
              placeholder={t('tests.before.testType.selectOrAddPositionType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.testType.processType')}</Form.Label>            <CreatableSelect
              name="processType"
              value={getSelectedOption(processTypeOptions, formData.processType)}
              onChange={(option) => handleSelectChange(option, { name: 'processType' })}
              onCreateOption={handleCreateProcessType}
              options={processTypeOptions}
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
              placeholder={t('tests.before.testType.selectOrAddProcessType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default TestTypeSection;
