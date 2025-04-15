import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';

const SpecificationsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  getHardnessUnitOptions,
  loading,
  selectStyles
}) => {
  const { t } = useTranslation();

  // Style compact pour les Select
  const compactSelectStyles = {
    ...selectStyles,
    container: (provided) => ({
      ...provided,
      width: '100%',
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      height: '38px',
      fontSize: '0.9rem',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '38px',
      padding: '0 6px',
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '38px',
    }),
  };

  const handleCreateCoreHardnessUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'coreHardnessUnit', 'units', 'hardness_units');
  };

  const handleCreateSurfaceHardnessUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'surfaceHardnessUnit', 'units', 'hardness_units');
  };

  const handleCreateToothHardnessUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'toothHardnessUnit', 'units', 'hardness_units');;
  };

  const handleCreateEcdHardnessUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'ecdHardnessUnit', 'units', 'hardness_units');
  };

  return (
    <>
      {/* Section Duretés */}
      <h6 className="text-muted mb-2">{t('parts.specifications.hardnessSpecs')}</h6>
      {/* Dureté à cœur */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">{t('parts.specifications.coreHardness')}</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.min')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="coreHardnessMin"
              value={formData.coreHardnessMin}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.max')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="coreHardnessMax"
              value={formData.coreHardnessMax}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <CreatableSelect
            name="coreHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.coreHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'coreHardnessUnit' })}
            options={getHardnessUnitOptions()}
            isClearable
            styles={compactSelectStyles}
            placeholder={t('common.unit')}
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
            formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
            onCreateOption={handleCreateCoreHardnessUnit}
          />
        </div>
      </div>
      {/* Dureté en surface */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">{t('parts.specifications.surfaceHardness')}</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.min')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="surfaceHardnessMin"
              value={formData.surfaceHardnessMin}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.max')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="surfaceHardnessMax"
              value={formData.surfaceHardnessMax}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <CreatableSelect
            name="surfaceHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.surfaceHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'surfaceHardnessUnit' })}
            options={getHardnessUnitOptions()}
            isClearable
            styles={compactSelectStyles}
            placeholder={t('common.unit')}
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
            formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
            onCreateOption={handleCreateSurfaceHardnessUnit}
          />
        </div>
      </div>
      {/* Nouveau: Dureté PdD */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">{t('parts.specifications.toothHardness')}</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.min')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="toothHardnessMin"
              value={formData.toothHardnessMin || ''}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.max')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="toothHardnessMax"
              value={formData.toothHardnessMax || ''}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <CreatableSelect
            name="toothHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.toothHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'toothHardnessUnit' })}
            options={getHardnessUnitOptions()}
            isClearable
            styles={compactSelectStyles}
            placeholder={t('common.unit')}
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
            formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
            onCreateOption={handleCreateToothHardnessUnit}
          />
        </div>
      </div>
      {/* ECD */}
      <div className="row mb-3 g-2 align-items-end">
        <div className="col-md-2">
          <Form.Group>
            <Form.Label className="small">{t('parts.specifications.ecdDepth')}</Form.Label>
          </Form.Group>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.min')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="ecdDepthMin"
              value={formData.ecdDepthMin}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-3">
          <InputGroup size="sm">
            <InputGroup.Text>{t('common.max')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="ecdDepthMax"
              value={formData.ecdDepthMax}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <InputGroup size="sm">
            <InputGroup.Text>{t('parts.specifications.hardness')}</InputGroup.Text>
            <Form.Control
              type="number"
              name="ecdHardness"
              value={formData.ecdHardness}
              onChange={handleChange}
              step="0.1"
              size="sm"
            />
            <CreatableSelect
              name="ecdHardnessUnit"
              value={getSelectedOption(getHardnessUnitOptions(), formData.ecdHardnessUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'ecdHardnessUnit' })}
              options={getHardnessUnitOptions()}
              isClearable
              styles={compactSelectStyles}
              placeholder={t('common.unit')}
              className="react-select-container flex-grow-1"
              classNamePrefix="react-select"
              isLoading={loading}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateEcdHardnessUnit}
            />
          </InputGroup>
        </div>
      </div>
    </>
  );
};

export default SpecificationsSection;
