import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form } from 'react-bootstrap';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';
import PreoxidationSection from './modules/preoxidation/PreoxidationSection';
import ThermalCycleSection from './modules/thermal_cycle/ThermalCycleSection';
import ChemicalCycleSection from './modules/chemical_cycle/ChemicalCycleSection';
import QuenchDataSection from './modules/quench/QuenchDataSection';
import RecipePreviewChart from './modules/recipe_preview/RecipePreviewChart';

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
  handleThermalCycleChange,
  calculateProgramDuration,
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
  trial,
  handleFileAssociationNeeded,
  viewMode = false,
  readOnlyFieldStyle = {}
}) => {
  const { t } = useTranslation();
  
  // Fonction pour calculer la durée totale du cycle chimique en minutes (incluant waitTime)
  const calculateChemicalCycleDuration = () => {
    if (!formData.recipeData?.chemicalCycle) return 0;
    
    // Somme des temps du cycle chimique en secondes
    const totalSeconds = formData.recipeData.chemicalCycle.reduce((total, step) => {
      return total + (parseInt(step.time) || 0);
    }, 0);
    
    // Convertir en minutes
    let totalMinutes = totalSeconds / 60;
    
    // Ajouter le waitTime s'il existe
    const waitTime = parseInt(formData.recipeData?.waitTime) || 0;
    totalMinutes += waitTime;
    
    return Math.round(totalMinutes); // Arrondi à la minute la plus proche (valeur entière)
  };
  
  return (
    <>    
      {/* Recipe Number */}
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>{t('trials.before.recipeData.recipeNumber')}</Form.Label>            <Form.Control
              type="text"
              name="recipeData.recipeNumber"
              value={formData.recipeData?.recipeNumber}
              onChange={handleChange}
              autoComplete="off"
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>
        </Col>
      </Row>
      
      {/* Preoxidation Section */}      <PreoxidationSection
        formData={formData}
        handleChange={handleChange}
        handleSelectChange={handleSelectChange}
        getSelectedOption={getSelectedOption}
        coolingMediaOptions={coolingMediaOptions}
        temperatureUnitOptions={temperatureUnitOptions}
        timeUnitOptions={timeUnitOptions}
        loading={loading}
        selectStyles={selectStyles}
        viewMode={viewMode}
        readOnlyFieldStyle={readOnlyFieldStyle}
      />
      
      <CollapsibleSection
        title={t('trials.before.recipeData.thermalCycle.title')}
        isExpandedByDefault={true}
        sectionId="trial-thermal-cycle"
        rememberState={true}
        level={1}
      >        {/* Thermal Cycle Section */}        <ThermalCycleSection
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          getSelectedOption={getSelectedOption}
          temperatureUnitOptions={temperatureUnitOptions}
          timeUnitOptions={timeUnitOptions}
          pressureUnitOptions={pressureUnitOptions}
          handleThermalCycleAdd={handleThermalCycleAdd}
          handleThermalCycleRemove={handleThermalCycleRemove}
          handleThermalCycleChange={handleThermalCycleChange}
          calculateProgramDuration={calculateProgramDuration}
          calculateChemicalCycleDuration={calculateChemicalCycleDuration}
          loading={loading}
          selectStyles={selectStyles}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('trials.before.recipeData.chemicalCycle.title')}
        isExpandedByDefault={true}
        sectionId="trial-chemical-cycle"
        rememberState={true}
        level={1}
      >  
        {/* Chemical Cycle Section */}        <ChemicalCycleSection
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          getSelectedOption={getSelectedOption}
          handleChemicalCycleAdd={handleChemicalCycleAdd}
          handleChemicalCycleRemove={handleChemicalCycleRemove}
          calculateProgramDuration={calculateProgramDuration}
          loading={loading}
          selectStyles={selectStyles}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
      
      {/* Ajout de la nouvelle section pour la prévisualisation du graphique */}
      <CollapsibleSection
        title={t('trials.before.recipeData.previewChart.title', 'Prévisualisation du graphique')}
        isExpandedByDefault={false}
        sectionId="trial-recipe-preview"
        rememberState={true}
        level={1}
      >
        <RecipePreviewChart formData={formData} />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('trials.before.recipeData.quenchData.title')}
        isExpandedByDefault={true}
        sectionId="trial-quench-data"
        rememberState={true}
        level={1}
      >
        {/* Quench Data Section - Imported from external component */}        <QuenchDataSection
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
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
    </>
  );
};

export default RecipeDataSection;
