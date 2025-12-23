import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';
import { isValidNewOption, customFilterOption } from '../../../../../../../../utils/selectHelpers';

const FurnaceDataSection = ({
  formData,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  furnaceTypeOptions,
  heatingCellOptions,
  coolingMediaOptions,
  furnaceSizeOptions,
  quenchCellOptions,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();

  // DEBUG: Log pour vérifier les valeurs
  
  

  const handleCreateFurnaceType = (inputValue) =>
    handleCreateOption(inputValue, 'furnaceType', 'furnaces', 'furnace_type');
  const handleCreateHeatingCell = (inputValue) =>
    handleCreateOption(inputValue, 'heatingCell', 'furnaces', 'heating_cell_type');
  const handleCreateCoolingMedia = (inputValue) =>
    handleCreateOption(inputValue, 'coolingMedia', 'furnaces', 'cooling_media');
  const handleCreateFurnaceSize = (inputValue) =>
    handleCreateOption(inputValue, 'furnaceSize', 'furnaces', 'furnace_size');
  const handleCreateQuenchCell = (inputValue) =>
    handleCreateOption(inputValue, 'quenchCell', 'furnaces', 'quench_cell');

  return (
    <>
      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.furnaceData.furnaceType')}</Form.Label>
            <CreatableSelect
              name="furnaceData.furnaceType"
              value={getSelectedOption(furnaceTypeOptions, formData.furnaceData?.furnaceType)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.furnaceType' })}
              onCreateOption={handleCreateFurnaceType}
              options={furnaceTypeOptions}
              isClearable={!viewMode}
              isDisabled={viewMode}
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
              placeholder={t('trials.before.furnaceData.selectOrAddFurnaceType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.furnaceData.heatingCell')}</Form.Label>
            <CreatableSelect
              name="furnaceData.heatingCell"
              value={getSelectedOption(heatingCellOptions, formData.furnaceData?.heatingCell)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.heatingCell' })}
              onCreateOption={handleCreateHeatingCell}
              options={heatingCellOptions}
              isClearable={!viewMode}
              isDisabled={viewMode}
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
              placeholder={t('trials.before.furnaceData.selectOrAddHeatingCell')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.furnaceData.coolingMedia')}</Form.Label>
            <CreatableSelect
              name="furnaceData.coolingMedia"
              value={getSelectedOption(coolingMediaOptions, formData.furnaceData?.coolingMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.coolingMedia' })}
              onCreateOption={handleCreateCoolingMedia}
              options={coolingMediaOptions}
              isClearable={!viewMode}
              isDisabled={viewMode}
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
              placeholder={t('trials.before.furnaceData.selectOrAddCoolingMedia')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.furnaceData.furnaceSize')}</Form.Label>
            <CreatableSelect
              name="furnaceData.furnaceSize"
              value={getSelectedOption(furnaceSizeOptions, formData.furnaceData?.furnaceSize)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.furnaceSize' })}
              onCreateOption={handleCreateFurnaceSize}
              options={furnaceSizeOptions}
              isClearable={!viewMode}
              isDisabled={viewMode}
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
              placeholder={t('trials.before.furnaceData.selectOrAddFurnaceSize')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.furnaceData.quenchCell')}</Form.Label>
            <CreatableSelect
              name="furnaceData.quenchCell"
              value={getSelectedOption(quenchCellOptions, formData.furnaceData?.quenchCell)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceData.quenchCell' })}
              onCreateOption={handleCreateQuenchCell}
              options={quenchCellOptions}
              isClearable={!viewMode}
              isDisabled={viewMode}
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
              placeholder={t('trials.before.furnaceData.selectOrAddQuenchCell')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default FurnaceDataSection;
