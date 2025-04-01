// src/components/dashboard/parts/sections/DimensionsSection.jsx
import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import Select from 'react-select';

const DimensionsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  getLengthUnitOptions,
  getWeightUnitOptions,
  loading,
  selectStyles
}) => {
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
  
  return (
    <>
      <h6 className="text-muted mb-2">Dimensions principales</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">Longueur</Form.Label>
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
            <Form.Label className="small">Largeur</Form.Label>
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
            <Form.Label className="small">Hauteur</Form.Label>
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
            <Form.Label className="small">Unité</Form.Label>
            <Select
              name="dimensionsUnit"
              value={getSelectedOption(getLengthUnitOptions(), formData.dimensionsUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'dimensionsUnit' })}
              options={getLengthUnitOptions()}
              isClearable
              styles={unitSelectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">Diamètres</h6>
      <div className="row mb-3 g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">Diamètre int.</Form.Label>
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
            <Form.Label className="small">Diamètre ext.</Form.Label>
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
            <Form.Label className="small">Unité</Form.Label>
            <Select
              name="diameterUnit"
              value={getSelectedOption(getLengthUnitOptions(), formData.diameterUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'diameterUnit' })}
              options={getLengthUnitOptions()}
              isClearable
              styles={unitSelectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </div>
      </div>

      <h6 className="text-muted mb-2">Poids</h6>
      <div className="row g-2 align-items-end">
        <div className="col">
          <Form.Group>
            <Form.Label className="small">Poids</Form.Label>
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
            <Form.Label className="small">Unité</Form.Label>
            <Select
              name="weightUnit"
              value={getSelectedOption(getWeightUnitOptions(), formData.weightUnit)}
              onChange={(option) => handleSelectChange(option, { name: 'weightUnit' })}
              options={getWeightUnitOptions()}
              isClearable
              styles={unitSelectStyles}
              placeholder="Unité"
              className="react-select-container"
              classNamePrefix="react-select"
              isLoading={loading}
            />
          </Form.Group>
        </div>
        <div className="col"></div>
      </div>
    </>
  );
};

export default DimensionsSection;
