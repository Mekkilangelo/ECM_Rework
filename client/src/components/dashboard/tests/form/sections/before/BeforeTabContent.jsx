import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
// Sections importées
import TestTypeSection from './sections/test_type/TestTypeSection';
import FurnaceDataSection from './sections/furnace/FurnaceDataSection';
import LoadDataSection from './sections/load_data/LoadDataSection';
import RecipeDataSection from './sections/recipe/RecipeDataSection';
import LoadDesignSection from './sections/load_design/LoadDesignSection';

const BeforeTabContent = ({ formData, errors, loading, formHandlers, test, handleFileAssociationNeeded, viewMode = false, readOnlyFieldStyle = {} }) => {
  const { t } = useTranslation();
  
  // États pour stocker les fonctions d'association de fichiers des sous-sections
  const [loadDesignFileAssociation, setLoadDesignFileAssociation] = useState(null);
  const [recipeDataFileAssociation, setRecipeDataFileAssociation] = useState(null);
  
  // Gestionnaires pour recevoir les fonctions d'association des fichiers
  const handleLoadDesignFileAssociationNeeded = (associateFunc) => {
    console.log("Load design file association function received in BeforeTabContent");
    setLoadDesignFileAssociation(() => associateFunc);
  };
  
  const handleRecipeDataFileAssociationNeeded = (associateFunc) => {
    console.log("Recipe data file association function received in BeforeTabContent");
    setRecipeDataFileAssociation(() => associateFunc);
  };
  
  // Créer une fonction d'association qui appeelra toutes les fonctions d'association
  const combineFileAssociations = React.useCallback(async (nodeId) => {
    console.log("Combining file associations for nodeId:", nodeId);
    const promises = [];
    let results = { success: true };
    
    if (loadDesignFileAssociation) {
      console.log("Calling loadDesignFileAssociation");
      promises.push(loadDesignFileAssociation(nodeId));
    }
    
    if (recipeDataFileAssociation) {
      console.log("Calling recipeDataFileAssociation");
      promises.push(recipeDataFileAssociation(nodeId));
    }
    
    if (promises.length > 0) {
      try {
        const associationResults = await Promise.all(promises);
        console.log("Association results:", associationResults);
        // Si l'un des résultats est false, on considère que l'opération a échoué
        if (associationResults.some(result => result === false)) {
          results.success = false;
        }
      } catch (error) {
        console.error("Error in file associations:", error);
        results.success = false;
        results.error = error;
      }
    } else {
      console.log("No file associations to process");
    }
    
    return results.success;
  }, [loadDesignFileAssociation, recipeDataFileAssociation]);
  
  // Transmettre la fonction combinée au parent
  useEffect(() => {
    if (handleFileAssociationNeeded) {
      console.log("Setting combined file association in BeforeTabContent");
      handleFileAssociationNeeded(combineFileAssociations);
    }
  }, [handleFileAssociationNeeded, combineFileAssociations]);
  
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
          mountingTypeOptions={formHandlers.mountingTypeOptions}          positionTypeOptions={formHandlers.positionTypeOptions}
          processTypeOptions={formHandlers.processTypeOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
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
          furnaceSizeOptions={formHandlers.furnaceSizeOptions}          quenchCellOptions={formHandlers.quenchCellOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
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
          lengthUnitOptions={formHandlers.lengthUnitOptions}          weightUnitOptions={formHandlers.weightUnitOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('tests.before.loadDesign.title')}
        isExpandedByDefault={false}
        sectionId="test-load-design"
        rememberState={true}
      >        <LoadDesignSection
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleLoadDesignFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('tests.before.recipeData.title')}
        isExpandedByDefault={true}
        sectionId="test-recipe-data"
        rememberState={true}
      >        <RecipeDataSection
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
          handleThermalCycleChange={formHandlers.handleThermalCycleChange}
          handleTimeComponentChange={formHandlers.handleTimeComponentChange}
          handleChemicalCycleAdd={formHandlers.handleChemicalCycleAdd}
          handleChemicalCycleRemove={formHandlers.handleChemicalCycleRemove}
          handleGasQuenchSpeedAdd={formHandlers.handleGasQuenchSpeedAdd}
          handleGasQuenchSpeedRemove={formHandlers.handleGasQuenchSpeedRemove}
          handleGasQuenchPressureAdd={formHandlers.handleGasQuenchPressureAdd}
          handleGasQuenchPressureRemove={formHandlers.handleGasQuenchPressureRemove}
          handleOilQuenchSpeedAdd={formHandlers.handleOilQuenchSpeedAdd}
          handleOilQuenchSpeedRemove={formHandlers.handleOilQuenchSpeedRemove}
          loading={loading}          selectStyles={formHandlers.selectStyles}
          test={test}
          handleFileAssociationNeeded={handleRecipeDataFileAssociationNeeded}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
    </>
  );
};

export default BeforeTabContent;
