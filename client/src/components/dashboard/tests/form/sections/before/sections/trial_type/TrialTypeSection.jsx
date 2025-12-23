import React from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { isValidNewOption, customFilterOption } from '../../../../../../../../utils/selectHelpers';

const TrialTypeSection = ({
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

  // DEBUG: Log pour vérifier les valeurs
  
  
  
  

  const handleCreateMountingType = (inputValue) =>
    handleCreateOption(inputValue, 'mountingType', 'trials', 'mounting_type');
  
  const handleCreatePositionType = (inputValue) =>
    handleCreateOption(inputValue, 'positionType', 'trials', 'position_type');
  
  const handleCreateProcessType = (inputValue) =>
    handleCreateOption(inputValue, 'processType', 'trials', 'process_type');
  
  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.trialType.mountingType')}</Form.Label>            <CreatableSelect
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
              placeholder={t('trials.before.trialType.selectOrAddMountingType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.trialType.positionType')}</Form.Label>            <CreatableSelect
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
              placeholder={t('trials.before.trialType.selectOrAddPositionType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.trialType.processType')}</Form.Label>            <CreatableSelect
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
              placeholder={t('trials.before.trialType.selectOrAddProcessType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default TrialTypeSection;
