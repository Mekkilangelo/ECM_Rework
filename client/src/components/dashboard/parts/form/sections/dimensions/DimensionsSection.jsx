import React from 'react';
import { Form } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';
import { isValidNewOption, customFilterOption, sortOptionsByRelevance } from '../../../../../../utils/selectHelpers';

const DimensionsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  lengthUnitOptions, // Recevoir directement les tableaux d'options
  weightUnitOptions, // Recevoir directement les tableaux d'options
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {}
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
  
  // Styles modifiés pour le mode lecture seule
  const customSelectStyles = viewMode ? {
    ...unitSelectStyles,
    control: (provided) => ({
      ...provided,
      ...readOnlyFieldStyle,
      cursor: 'default'
    }),
    dropdownIndicator: () => ({ display: 'none' }),
    indicatorSeparator: () => ({ display: 'none' })
  } : unitSelectStyles;
  
  const handleCreateDimensionsUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'dimensionsUnit', 'units', 'length_units');
  };
  
  const handleCreateDiameterUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'diameterUnit', 'units', 'length_units');
  };
    const handleCreateWeightUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'weightUnit', 'units', 'weight_units');
  };

  // Debug logs uniquement en mode développement et si les options sont vides
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev && (!lengthUnitOptions.length || !weightUnitOptions.length)) {
    console.log("🔍 DimensionsSection - Missing options:", {
      lengthUnits: lengthUnitOptions.length,
      weightUnits: weightUnitOptions.length
    });
  }

  return (
    <>
      <h6 className="text-muted mb-2">{t('parts.dimensions.mainDimensions')}</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.length')}</Form.Label>
            <Form.Control
              type="number"
              name="length"
              value={formData.length || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.width')}</Form.Label>
            <Form.Control
              type="number"
              name="width"
              value={formData.width || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.height')}</Form.Label>
            <Form.Control
              type="number"
              name="height"
              value={formData.height || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="dimensionsUnit"
              value={formData.dimensionsUnit
                ? getSelectedOption(lengthUnitOptions, formData.dimensionsUnit)
                : (Array.isArray(lengthUnitOptions) && lengthUnitOptions.length > 0) ? lengthUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'dimensionsUnit' })}
              options={sortOptionsByRelevance(lengthUnitOptions || [], formData.dimensionsUnit || '')}
              isClearable={!viewMode}
              styles={customSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!lengthUnitOptions || !lengthUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateDimensionsUnit}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">{t('parts.dimensions.diameters')}</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.diameterIn')}</Form.Label>
            <Form.Control
              type="number"
              name="diameterIn"
              value={formData.diameterIn || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.diameterOut')}</Form.Label>
            <Form.Control
              type="number"
              name="diameterOut"
              value={formData.diameterOut || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="diameterUnit"
              value={formData.diameterUnit
                ? getSelectedOption(lengthUnitOptions, formData.diameterUnit)
                : (Array.isArray(lengthUnitOptions) && lengthUnitOptions.length > 0) ? lengthUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'diameterUnit' })}
              options={sortOptionsByRelevance(lengthUnitOptions || [], formData.diameterUnit || '')}
              isClearable={!viewMode}
              styles={customSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!lengthUnitOptions || !lengthUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateDiameterUnit}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">{t('parts.dimensions.weight')}</h6>
      <div className="row g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.weight')}</Form.Label>
            <Form.Control
              type="number"
              name="weight"
              value={formData.weight || ''}
              onChange={handleChange}
              step="0.01"
              size="sm"
              disabled={viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </div>
        <div className="col-auto">
          <Form.Group>
            <Form.Label className="small">{t('common.unit')}</Form.Label>
            <CreatableSelect
              name="weightUnit"
              value={formData.weightUnit
                ? getSelectedOption(weightUnitOptions, formData.weightUnit)
                : (Array.isArray(weightUnitOptions) && weightUnitOptions.length > 0) ? weightUnitOptions[0] : null}
              onChange={(option) => handleSelectChange(option, { name: 'weightUnit' })}
              options={sortOptionsByRelevance(weightUnitOptions || [], formData.weightUnit || '')}
              isClearable={!viewMode}
              styles={customSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading && (!weightUnitOptions || !weightUnitOptions.length)}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateWeightUnit}
              isDisabled={viewMode}
              isValidNewOption={isValidNewOption}
              filterOption={customFilterOption}
            />
          </Form.Group>
        </div>
        <div className="col"></div>
      </div>
    </>
  );
};

export default DimensionsSection;
