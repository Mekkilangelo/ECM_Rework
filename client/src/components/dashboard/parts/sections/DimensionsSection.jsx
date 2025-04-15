import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';

const DimensionsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  handleCreateOption,
  getSelectedOption,
  getLengthUnitOptions,
  getWeightUnitOptions,
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
  
  const handleCreateDimensionsUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'dimensionsUnit', 'units', 'length_units');
  };
  
  const handleCreateDiameterUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'diameterUnit', 'units', 'length_units');
  };
  
  const handleCreateWeightUnit = (inputValue) => {
    return handleCreateOption(inputValue, 'weightUnit', 'units', 'weight_units');
  };

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
              value={formData.length}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.width')}</Form.Label>
            <Form.Control
              type="number"
              name="width"
              value={formData.width}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.height')}</Form.Label>
            <Form.Control
              type="number"
              name="height"
              value={formData.height}
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
              name="dimensionsUnit"
              value={getSelectedOption(getLengthUnitOptions(), formData.dimensionsUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'dimensionsUnit' })}
              options={getLengthUnitOptions()}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateDimensionsUnit}
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
              value={formData.diameterIn}
              onChange={handleChange}
              step="0.01"
              size="sm"
            />
          </Form.Group>
        </div>
        <div className="col">
          <Form.Group>
            <Form.Label className="small">{t('parts.dimensions.diameterOut')}</Form.Label>
            <Form.Control
              type="number"
              name="diameterOut"
              value={formData.diameterOut}
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
              name="diameterUnit"
              value={getSelectedOption(getLengthUnitOptions(), formData.diameterUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'diameterUnit' })}
              options={getLengthUnitOptions()}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateDiameterUnit}
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
              value={formData.weight}
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
              name="weightUnit"
              value={getSelectedOption(getWeightUnitOptions(), formData.weightUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'weightUnit' })}
              options={getWeightUnitOptions()}
              isClearable
              styles={unitSelectStyles}
              placeholder={t('common.selectUnit')}
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
              formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
              onCreateOption={handleCreateWeightUnit}
            />
          </Form.Group>
        </div>
        <div className="col"></div>
      </div>
    </>
  );
};

export default DimensionsSection;
