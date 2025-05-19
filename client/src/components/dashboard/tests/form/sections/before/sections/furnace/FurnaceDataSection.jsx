import React from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';

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
}) => {
  const { t } = useTranslation();

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
            <Form.Label>{t('tests.before.furnaceData.furnaceType')}</Form.Label>
            <CreatableSelect
              name="furnaceType"
              value={getSelectedOption(furnaceTypeOptions, formData.furnaceType)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceType' })}
              onCreateOption={handleCreateFurnaceType}
              options={furnaceTypeOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.furnaceData.selectOrAddFurnaceType')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.furnaceData.heatingCell')}</Form.Label>
            <CreatableSelect
              name="heatingCell"
              value={getSelectedOption(heatingCellOptions, formData.heatingCell)}
              onChange={(option) => handleSelectChange(option, { name: 'heatingCell' })}
              onCreateOption={handleCreateHeatingCell}
              options={heatingCellOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.furnaceData.selectOrAddHeatingCell')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.furnaceData.coolingMedia')}</Form.Label>
            <CreatableSelect
              name="coolingMedia"
              value={getSelectedOption(coolingMediaOptions, formData.coolingMedia)}
              onChange={(option) => handleSelectChange(option, { name: 'coolingMedia' })}
              onCreateOption={handleCreateCoolingMedia}
              options={coolingMediaOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.furnaceData.selectOrAddCoolingMedia')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.furnaceData.furnaceSize')}</Form.Label>
            <CreatableSelect
              name="furnaceSize"
              value={getSelectedOption(furnaceSizeOptions, formData.furnaceSize)}
              onChange={(option) => handleSelectChange(option, { name: 'furnaceSize' })}
              onCreateOption={handleCreateFurnaceSize}
              options={furnaceSizeOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.furnaceData.selectOrAddFurnaceSize')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.furnaceData.quenchCell')}</Form.Label>
            <CreatableSelect
              name="quenchCell"
              value={getSelectedOption(quenchCellOptions, formData.quenchCell)}
              onChange={(option) => handleSelectChange(option, { name: 'quenchCell' })}
              onCreateOption={handleCreateQuenchCell}
              options={quenchCellOptions}
              isClearable
              styles={selectStyles}
              placeholder={t('tests.before.furnaceData.selectOrAddQuenchCell')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </Col>
      </Row>
    </>
  );
};

export default FurnaceDataSection;
