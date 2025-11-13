import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
// Sections importées
import TrialTypeSection from './sections/trial_type/TrialTypeSection';
import FurnaceDataSection from './sections/furnace/FurnaceDataSection';
import LoadDataSection from './sections/load_data/LoadDataSection';
import RecipeDataSection from './sections/recipe/RecipeDataSection';
import LoadDesignSection from './sections/load_design/LoadDesignSection';

const BeforeTabContent = React.memo(({ formData, errors, loading, formHandlers, trial, handleFileAssociationNeeded, viewMode = false, readOnlyFieldStyle = {}, calculateProgramDuration }) => {
  const { t } = useTranslation();
  
  // États pour stocker les fonctions d'association de fichiers des sous-sections
  const loadDesignFileAssociationRef = useRef(null);
  const recipeDataFileAssociationRef = useRef(null);
  
  // Ref pour éviter les re-renders inutiles
  const handleFileAssociationNeededRef = useRef(handleFileAssociationNeeded);
  
  // Mettre à jour la ref quand la prop change
  useEffect(() => {
    handleFileAssociationNeededRef.current = handleFileAssociationNeeded;
  }, [handleFileAssociationNeeded]);

  // Gestionnaires pour recevoir les fonctions d'association des fichiers
  const handleLoadDesignFileAssociationNeeded = React.useCallback((associateFunc) => {
    loadDesignFileAssociationRef.current = associateFunc;
  }, []);
  
  const handleRecipeDataFileAssociationNeeded = React.useCallback((associateFunc) => {
    recipeDataFileAssociationRef.current = associateFunc;
  }, []);

  // Créer une fonction d'association qui appellera toutes les fonctions d'association
  const combineFileAssociations = React.useCallback(async (nodeId) => {
    const promises = [];
    let results = { success: true };
    
    if (loadDesignFileAssociationRef.current) {
      promises.push(loadDesignFileAssociationRef.current(nodeId));
    }
    
    if (recipeDataFileAssociationRef.current) {
      promises.push(recipeDataFileAssociationRef.current(nodeId));
    }
    
    if (promises.length > 0) {
      try {
        const associationResults = await Promise.all(promises);
        // Si l'un des résultats est false, on considère que l'opération a échoué
        if (associationResults.some(result => result === false)) {
          results.success = false;
        }
      } catch (error) {
        console.error("Error in file associations:", error);
        results.success = false;
        results.error = error;
      }
    }
    
    return results.success;
  }, []); // Pas de dépendances car on utilise des refs

  // Transmettre la fonction combinée au parent une seule fois
  useEffect(() => {
    if (handleFileAssociationNeededRef.current) {
      handleFileAssociationNeededRef.current(combineFileAssociations);
    }
  }, []); // Pas de dépendances - on ne fait cela qu'une seule fois
  
  return (
    <>
      <CollapsibleSection
        title={t('trials.before.trialType.title')}
        isExpandedByDefault={true}
        sectionId="trial-type"
        rememberState={false}
      >
        <TrialTypeSection
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
        title={t('trials.before.furnaceData.title')}
        isExpandedByDefault={true}
        sectionId="trial-furnace-data"
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
        title={t('trials.before.loadData.title')}
        isExpandedByDefault={true}
        sectionId="trial-load-data"
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
        title={t('trials.before.loadDesign.title')}
        isExpandedByDefault={true}
        sectionId="trial-load-design"
        rememberState={true}
      >        <LoadDesignSection
          trialNodeId={trial ? trial.id : null}
          onFileAssociationNeeded={handleLoadDesignFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('trials.before.recipeData.title')}
        isExpandedByDefault={true}
        sectionId="trial-recipe-data"
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
          calculateProgramDuration={calculateProgramDuration}
          handleChemicalCycleAdd={formHandlers.handleChemicalCycleAdd}
          handleChemicalCycleRemove={formHandlers.handleChemicalCycleRemove}
          handleGasQuenchSpeedAdd={formHandlers.handleGasQuenchSpeedAdd}
          handleGasQuenchSpeedRemove={formHandlers.handleGasQuenchSpeedRemove}
          handleGasQuenchPressureAdd={formHandlers.handleGasQuenchPressureAdd}
          handleGasQuenchPressureRemove={formHandlers.handleGasQuenchPressureRemove}
          handleOilQuenchSpeedAdd={formHandlers.handleOilQuenchSpeedAdd}
          handleOilQuenchSpeedRemove={formHandlers.handleOilQuenchSpeedRemove}
          loading={loading}          selectStyles={formHandlers.selectStyles}
          trial={trial}
          handleFileAssociationNeeded={handleRecipeDataFileAssociationNeeded}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>    </>
  );
});

BeforeTabContent.displayName = 'BeforeTabContent';

export default BeforeTabContent;
