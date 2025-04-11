import React from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';
// Sections importées
import TestTypeSection from './TestTypeSection';
import FurnaceDataSection from './FurnaceDataSection';
import LoadDataSection from './LoadDataSection';
import RecipeDataSection from './RecipeDataSection';
import LoadDesignSection from './LoadDesignSection';

const BeforeTabContent = ({ formData, errors, loading, formHandlers, test, handleFileAssociationNeeded }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <CollapsibleSection
        title={t('tests.before.testType.title')}
        isExpandedByDefault={true}
        sectionId="test-type"
        rememberState={false}
      >
        <TestTypeSection
          formData={formData}
          handleSelectChange={formHandlers.handleSelectChange}
          handleCreateOption={formHandlers.handleCreateOption}
          getSelectedOption={formHandlers.getSelectedOption}
          mountingTypeOptions={formHandlers.mountingTypeOptions}
          positionTypeOptions={formHandlers.positionTypeOptions}
          processTypeOptions={formHandlers.processTypeOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('tests.before.furnaceData.title')}
        isExpandedByDefault={true}
        sectionId="test-furnace-data"
        rememberState={true}
      >
        <FurnaceDataSection
          formData={formData}
          handleSelectChange={formHandlers.handleSelectChange}
          handleCreateOption={formHandlers.handleCreateOption}
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
        title={t('tests.before.loadData.title')}
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
        title={t('tests.before.loadDesign.title')}
        isExpandedByDefault={false}
        sectionId="test-load-design"
        rememberState={true}
      >
        <LoadDesignSection
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleFileAssociationNeeded}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('tests.before.recipeData.title')}
        isExpandedByDefault={true}
        sectionId="test-recipe-data"
        rememberState={true}
      >      
        <RecipeDataSection
          formData={formData}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          getSelectedOption={formHandlers.getSelectedOption}
          coolingMediaOptions={formHandlers.coolingMediaOptions}
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
          test={test}
          handleFileAssociationNeeded={handleFileAssociationNeeded}
        />
      </CollapsibleSection>
    </>
  );
};

export default BeforeTabContent;
