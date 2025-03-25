import React from 'react';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';

// Sections importées
import TestTypeSection from './TestTypeSection';
import FurnaceDataSection from './FurnaceDataSection';
import LoadDataSection from './LoadDataSection';
import RecipeDataSection from './RecipeDataSection';

const BeforeTabContent = ({ formData, errors, loading, formHandlers }) => (
  <>
    <CollapsibleSection 
      title="Types de test" 
      isExpandedByDefault={true}
      sectionId="test-type"
      rememberState={true}
    >
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
    </CollapsibleSection>

    <CollapsibleSection 
      title="Données du four" 
      isExpandedByDefault={true}
      sectionId="test-furnace-data"
      rememberState={true}
    >
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
    </CollapsibleSection>

    <CollapsibleSection 
      title="Données de charge" 
      isExpandedByDefault={true}
      sectionId="test-load-data"
      rememberState={true}
    >
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
    </CollapsibleSection>

    <CollapsibleSection 
      title="Données de recette" 
      isExpandedByDefault={true}
      sectionId="test-recipe-data"
      rememberState={true}
    >      
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
    </CollapsibleSection>
  </>
);

export default BeforeTabContent;