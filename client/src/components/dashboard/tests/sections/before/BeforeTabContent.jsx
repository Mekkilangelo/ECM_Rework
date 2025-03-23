import React from 'react';

// Sections importées
import TestTypeSection from './TestTypeSection';
import FurnaceDataSection from './FurnaceDataSection';
import LoadDataSection from './LoadDataSection';
import RecipeDataSection from './RecipeDataSection';

const BeforeTabContent = ({ formData, errors, loading, formHandlers }) => (
  <>
    <TestTypeSection
      formData={formData}
      handleSelectChange={formHandlers.handleSelectChange}
      getSelectedOption={formHandlers.getSelectedOption}
      mountingTypeOptions={formHandlers.mountingTypeOptions}
      positionTypeOptions={formHandlers.positionTypeOptions}
      processTypeOptions={formHandlers.processTypeOptions}
      loading={loading}
      selectStyles={formHandlers.selectStyles}
    />
    
    <FurnaceDataSection
      formData={formData}
      handleSelectChange={formHandlers.handleSelectChange}
      getSelectedOption={formHandlers.getSelectedOption}
      furnaceTypeOptions={formHandlers.furnaceTypeOptions}
      heatingCellOptions={formHandlers.heatingCellOptions}
      coolingMediaOptions={formHandlers.coolingMediaOptions}
      furnaceSizeOptions={formHandlers.furnaceSizeOptions}
      quenchCellOptions={formHandlers.quenchCellOptions}
      loading={loading}
      selectStyles={formHandlers.selectStyles}
    />
    
    <LoadDataSection
      formData={formData}
      handleChange={formHandlers.handleChange}
      handleSelectChange={formHandlers.handleSelectChange}
      getSelectedOption={formHandlers.getSelectedOption}
      lengthUnitOptions={formHandlers.lengthUnitOptions}
      weightUnitOptions={formHandlers.weightUnitOptions}
      loading={loading}
      selectStyles={formHandlers.selectStyles}
    />
    
    <RecipeDataSection
      formData={formData}
      handleChange={formHandlers.handleChange}
      handleSelectChange={formHandlers.handleSelectChange}
      getSelectedOption={formHandlers.getSelectedOption}
      temperatureUnitOptions={formHandlers.temperatureUnitOptions}
      timeUnitOptions={formHandlers.timeUnitOptions}
      pressureUnitOptions={formHandlers.pressureUnitOptions}
      handleThermalCycleAdd={formHandlers.handleThermalCycleAdd}
      handleThermalCycleRemove={formHandlers.handleThermalCycleRemove}
      handleChemicalCycleAdd={formHandlers.handleChemicalCycleAdd}
      handleChemicalCycleRemove={formHandlers.handleChemicalCycleRemove}
      handleGasQuenchSpeedAdd={formHandlers.handleGasQuenchSpeedAdd}
      handleGasQuenchSpeedRemove={formHandlers.handleGasQuenchSpeedRemove}
      handleGasQuenchPressureAdd={formHandlers.handleGasQuenchPressureAdd}
      handleGasQuenchPressureRemove={formHandlers.handleGasQuenchPressureRemove}
      handleOilQuenchSpeedAdd={formHandlers.handleOilQuenchSpeedAdd}
      handleOilQuenchSpeedRemove={formHandlers.handleOilQuenchSpeedRemove}
      loading={loading}
      selectStyles={formHandlers.selectStyles}
    />
  </>
);

export default BeforeTabContent;