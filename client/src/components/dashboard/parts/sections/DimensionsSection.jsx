// src/components/dashboard/parts/sections/DimensionsSection.jsx
import React from 'react';
import { Form } from 'react-bootstrap';
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
}) => (
  <>
    <div className="row">
      {/* Dimensions (Length, Width, Height) */}
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Longueur</Form.Label>
          <Form.Control
            type="number"
            name="length"
            value={formData.length}
            onChange={handleChange}
            step="0.01"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Largeur</Form.Label>
          <Form.Control
            type="number"
            name="width"
            value={formData.width}
            onChange={handleChange}
            step="0.01"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Hauteur</Form.Label>
          <Form.Control
            type="number"
            name="height"
            value={formData.height}
            onChange={handleChange}
            step="0.01"
          />
        </Form.Group>
      </div>
    </div>
    
    <div className="row">
      {/* Dimensions Unit */}
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Unité (dimensions)</Form.Label>
          <Select
            name="dimensionsUnit"
            value={getSelectedOption(getLengthUnitOptions(), formData.dimensionsUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'dimensionsUnit' })}
            options={getLengthUnitOptions()}
            isClearable
            styles={selectStyles}
            placeholder="Sélectionner une unité"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </Form.Group>
      </div>
      
      {/* Diameters */}
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Diamètre intérieur</Form.Label>
          <Form.Control
            type="number"
            name="diameterIn"
            value={formData.diameterIn}
            onChange={handleChange}
            step="0.01"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Diamètre extérieur</Form.Label>
          <Form.Control
            type="number"
            name="diameterOut"
            value={formData.diameterOut}
            onChange={handleChange}
            step="0.01"
          />
        </Form.Group>
      </div>
    </div>
    
    <div className="row">
      {/* Diameter Unit */}
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Unité (diamètres)</Form.Label>
          <Select
            name="diameterUnit"
            value={getSelectedOption(getLengthUnitOptions(), formData.diameterUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'diameterUnit' })}
            options={getLengthUnitOptions()}
            isClearable
            styles={selectStyles}
            placeholder="Sélectionner une unité"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </Form.Group>
      </div>
      
      {/* Weight */}
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Poids</Form.Label>
          <Form.Control
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            step="0.01"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Unité (poids)</Form.Label>
          <Select
            name="weightUnit"
            value={getSelectedOption(getWeightUnitOptions(), formData.weightUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'weightUnit' })}
            options={getWeightUnitOptions()}
            isClearable
            styles={selectStyles}
            placeholder="Sélectionner une unité"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </Form.Group>
      </div>
    </div>
  </>
);

export default DimensionsSection;
