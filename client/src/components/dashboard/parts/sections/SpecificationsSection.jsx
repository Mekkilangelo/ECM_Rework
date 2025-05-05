import React from 'react';
import { Form, InputGroup, Row, Col } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';

const SpecificationsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  hardnessUnitOptions, // Recevoir directement le tableau d'options d'unités de dureté
  loading,
  selectStyles
}) => {
  const { t } = useTranslation();

  // Styles compact pour les selects d'unités
  const unitSelectStyles = {
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
    return handleCreateOption(inputValue, 'toothHardnessUnit', 'units', 'hardness_units');
  };
  
  const handleCreateEcdHardnessUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'ecdHardnessUnit', 'units', 'hardness_units');
  };

  // Debug
  console.log("SpecificationsSection - hardnessUnitOptions:", hardnessUnitOptions);

  return (
    <>
      <h6 className="text-muted mb-2">{t('parts.specifications.coreHardness')}</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.min')}</Form.Label>
            <Form.Control
              type="number"
              name="coreHardnessMin"
              value={formData.coreHardnessMin || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.max')}</Form.Label>
            <Form.Control
              type="number"
              name="coreHardnessMax"
              value={formData.coreHardnessMax || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="coreHardnessUnit"
              value={formData.coreHardnessUnit 
                ? getSelectedOption(hardnessUnitOptions, formData.coreHardnessUnit) 
                : (Array.isArray(hardnessUnitOptions) && hardnessUnitOptions.length > 0) ? hardnessUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'coreHardnessUnit' })}
              options={hardnessUnitOptions || []}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!hardnessUnitOptions || !hardnessUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateCoreHardnessUnit}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">{t('parts.specifications.surfaceHardness')}</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.min')}</Form.Label>
            <Form.Control
              type="number"
              name="surfaceHardnessMin"
              value={formData.surfaceHardnessMin || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.max')}</Form.Label>
            <Form.Control
              type="number"
              name="surfaceHardnessMax"
              value={formData.surfaceHardnessMax || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="surfaceHardnessUnit"
              value={formData.surfaceHardnessUnit 
                ? getSelectedOption(hardnessUnitOptions, formData.surfaceHardnessUnit) 
                : (Array.isArray(hardnessUnitOptions) && hardnessUnitOptions.length > 0) ? hardnessUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'surfaceHardnessUnit' })}
              options={hardnessUnitOptions || []}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!hardnessUnitOptions || !hardnessUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateSurfaceHardnessUnit}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">{t('parts.specifications.toothHardness')}</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.min')}</Form.Label>
            <Form.Control
              type="number"
              name="toothHardnessMin"
              value={formData.toothHardnessMin || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.max')}</Form.Label>
            <Form.Control
              type="number"
              name="toothHardnessMax"
              value={formData.toothHardnessMax || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="toothHardnessUnit"
              value={formData.toothHardnessUnit 
                ? getSelectedOption(hardnessUnitOptions, formData.toothHardnessUnit) 
                : (Array.isArray(hardnessUnitOptions) && hardnessUnitOptions.length > 0) ? hardnessUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'toothHardnessUnit' })}
              options={hardnessUnitOptions || []}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!hardnessUnitOptions || !hardnessUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateToothHardnessUnit}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">{t('parts.specifications.ecdDepth')}</h6>
      <div className="row g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.min')}</Form.Label>
            <Form.Control
              type="number"
              name="ecdDepthMin"
              value={formData.ecdDepthMin || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('common.max')}</Form.Label>
            <Form.Control
              type="number"
              name="ecdDepthMax"
              value={formData.ecdDepthMax || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.specifications.ecdHardness')}</Form.Label>
            <Form.Control
              type="number"
              name="ecdHardness"
              value={formData.ecdHardness || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="ecdHardnessUnit"
              value={formData.ecdHardnessUnit 
                ? getSelectedOption(hardnessUnitOptions, formData.ecdHardnessUnit) 
                : (Array.isArray(hardnessUnitOptions) && hardnessUnitOptions.length > 0) ? hardnessUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'ecdHardnessUnit' })}
              options={hardnessUnitOptions || []}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!hardnessUnitOptions || !hardnessUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateEcdHardnessUnit}
            />
          </Form.Group>
        </div>
      </div>
    </>
  );
};

export default SpecificationsSection;
