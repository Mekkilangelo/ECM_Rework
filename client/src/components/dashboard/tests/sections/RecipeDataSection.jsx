import React, { useState } from 'react';
import { Row, Col, Form, Button, Nav } from 'react-bootstrap';
import Select from 'react-select';
import PreoxidationSection from './recipe/PreoxidationSection';
import ThermalCycleSection from './recipe/ThermalCycleSection';
import ChemicalCycleSection from './recipe/ChemicalCycleSection';
import QuenchDataSection from './recipe/QuenchDataSection';

const RecipeDataSection = ({ 
  formData, 
  handleChange,
  handleSelectChange,
  getSelectedOption,
  temperatureUnitOptions,
  timeUnitOptions,
  pressureUnitOptions,
  handleThermalCycleAdd,
  handleThermalCycleRemove,
  handleChemicalCycleAdd,
  handleChemicalCycleRemove,
  handleGasQuenchSpeedAdd,
  handleGasQuenchSpeedRemove,
  handleGasQuenchPressureAdd,
  handleGasQuenchPressureRemove,
  handleOilQuenchSpeedAdd,
  handleOilQuenchSpeedRemove,
  loading,
  selectStyles
}) => {
  return (
    <>
      <h4 className="mt-4 mb-3">Données de recette</h4>
      
      {/* Recipe Number */}
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>Numéro de recette</Form.Label>
            <Form.Control
              type="text"
              name="recipeData.recipeNumber"
              value={formData.recipeData?.recipeNumber}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>
      
      {/* Preoxidation Section */}
      <PreoxidationSection 
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        getSelectedOption={getSelectedOption}
        temperatureUnitOptions={temperatureUnitOptions}
        timeUnitOptions={timeUnitOptions}
        loading={loading}
        selectStyles={selectStyles}
      />
      
      {/* Thermal Cycle Section */}
      <ThermalCycleSection 
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        getSelectedOption={getSelectedOption}
        temperatureUnitOptions={temperatureUnitOptions}
        timeUnitOptions={timeUnitOptions}
        pressureUnitOptions={pressureUnitOptions}
        handleThermalCycleAdd={handleThermalCycleAdd}
        handleThermalCycleRemove={handleThermalCycleRemove}
        loading={loading}
        selectStyles={selectStyles}
      />
      
      {/* Chemical Cycle Section */}
      <ChemicalCycleSection 
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        getSelectedOption={getSelectedOption}
        handleChemicalCycleAdd={handleChemicalCycleAdd}
        handleChemicalCycleRemove={handleChemicalCycleRemove}
        loading={loading}
        selectStyles={selectStyles}
      />
      
      {/* Quench Data Section - Imported from external component */}
      <QuenchDataSection
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        getSelectedOption={getSelectedOption}
        temperatureUnitOptions={temperatureUnitOptions}
        handleGasQuenchSpeedAdd={handleGasQuenchSpeedAdd}
        handleGasQuenchSpeedRemove={handleGasQuenchSpeedRemove}
        handleGasQuenchPressureAdd={handleGasQuenchPressureAdd}
        handleGasQuenchPressureRemove={handleGasQuenchPressureRemove}
        handleOilQuenchSpeedAdd={handleOilQuenchSpeedAdd}
        handleOilQuenchSpeedRemove={handleOilQuenchSpeedRemove}
        timeUnitOptions={timeUnitOptions}
        loading={loading}
        selectStyles={selectStyles}
      />
    </>
  );
};

export default RecipeDataSection;