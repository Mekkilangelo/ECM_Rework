// src/components/dashboard/parts/sections/SpecificationsSection.jsx
import React from 'react';
import { Form } from 'react-bootstrap';
import Select from 'react-select';

const SpecificationsSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  steelOptions,
  getHardnessUnitOptions,
  loading,
  selectStyles
}) => (
  <>
    {/* Core Hardness */}
    <div className="row">
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Dureté à cœur (min)</Form.Label>
          <Form.Control
            type="number"
            name="coreHardnessMin"
            value={formData.coreHardnessMin}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Dureté à cœur (max)</Form.Label>
          <Form.Control
            type="number"
            name="coreHardnessMax"
            value={formData.coreHardnessMax}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Unité (dureté à cœur)</Form.Label>
          <Select
            name="coreHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.coreHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'coreHardnessUnit' })}
            options={getHardnessUnitOptions()}
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
    
    {/* Surface Hardness */}
    <div className="row">
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Dureté superficielle (min)</Form.Label>
          <Form.Control
            type="number"
            name="surfaceHardnessMin"
            value={formData.surfaceHardnessMin}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Dureté superficielle (max)</Form.Label>
          <Form.Control
            type="number"
            name="surfaceHardnessMax"
            value={formData.surfaceHardnessMax}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <Form.Group className="mb-3">
          <Form.Label>Unité (dureté superficielle)</Form.Label>
          <Select
            name="surfaceHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.surfaceHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'surfaceHardnessUnit' })}
            options={getHardnessUnitOptions()}
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
    
    {/* ECD Hardness */}
    <div className="row">
      <div className="col-md-3">
        <Form.Group className="mb-3">
          <Form.Label>Profondeur ECD (min)</Form.Label>
          <Form.Control
            type="number"
            name="ecdDepthMin"
            value={formData.ecdDepthMin}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-3">
        <Form.Group className="mb-3">
          <Form.Label>Profondeur ECD (max)</Form.Label>
          <Form.Control
            type="number"
            name="ecdDepthMax"
            value={formData.ecdDepthMax}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-3">
        <Form.Group className="mb-3">
          <Form.Label>Dureté ECD</Form.Label>
          <Form.Control
            type="number"
            name="ecdHardness"
            value={formData.ecdHardness}
            onChange={handleChange}
            step="0.1"
          />
        </Form.Group>
      </div>
      <div className="col-md-3">
        <Form.Group className="mb-3">
          <Form.Label>Unité (dureté ECD)</Form.Label>
          <Select
            name="ecdHardnessUnit"
            value={getSelectedOption(getHardnessUnitOptions(), formData.ecdHardnessUnit)}
            onChange={(option) => handleSelectChange(option, { name: 'ecdHardnessUnit' })}
            options={getHardnessUnitOptions()}
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
    
    {/* Additional Details */}
    <div className="row">
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Acier</Form.Label>
          <Select
            name="steel"
            value={getSelectedOption(steelOptions, formData.steel)}
            onChange={(option) => handleSelectChange(option, { name: 'steel' })}
            options={steelOptions}
            isClearable
            styles={selectStyles}
            placeholder="Sélectionner un acier"
            className="react-select-container"
            classNamePrefix="react-select"
            isLoading={loading}
          />
        </Form.Group>
      </div>
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
        </Form.Group>
      </div>
    </div>
  </>
);

export default SpecificationsSection;
