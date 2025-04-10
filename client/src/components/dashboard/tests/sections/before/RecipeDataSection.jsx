import React, { useState } from 'react';
import { Row, Col, Form, Button, Nav } from 'react-bootstrap';
import Select from 'react-select';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';

import PreoxidationSection from './recipe/PreoxidationSection';
import ThermalCycleSection from './recipe/ThermalCycleSection';
import ChemicalCycleSection from './recipe/ChemicalCycleSection';
import QuenchDataSection from './recipe/QuenchDataSection';
import RecipeGraphSection from './recipe/RecipeGraphSection';

const RecipeDataSection = ({ 
  formData, 
  handleChange,
  handleSelectChange,
  getSelectedOption,
  coolingMediaOptions,
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
  selectStyles,
  test,
  handleFileAssociationNeeded
}) => {
  return (
    <>    
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
        coolingMediaOptions={coolingMediaOptions}
        temperatureUnitOptions={temperatureUnitOptions}
        timeUnitOptions={timeUnitOptions}
        loading={loading}
        selectStyles={selectStyles}
      />
      
      <CollapsibleSection 
        title="Cycle Thermique" 
        isExpandedByDefault={true}
        sectionId="test-thermal-cycle"
        rememberState={true}
        level={1}
      >
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
      </CollapsibleSection>
      
      <CollapsibleSection 
        title="Cycle Chimique" 
        isExpandedByDefault={true}
        sectionId="test-chemical-cycle"
        rememberState={true}
        level={1}
      >  
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
      </CollapsibleSection>

      <CollapsibleSection 
        title="Graphiques" 
        isExpandedByDefault={true}
        sectionId="test-recipe-graph"
        rememberState={true}
        level={1}
      >  
        <RecipeGraphSection 
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleFileAssociationNeeded}
        />
      </CollapsibleSection>
      
      <CollapsibleSection 
        title="Données de trempe" 
        isExpandedByDefault={true}
        sectionId="test-quench-data"
        rememberState={true}
        level={1}
      >
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
      </CollapsibleSection>
    </>
  );
};

export default RecipeDataSection;