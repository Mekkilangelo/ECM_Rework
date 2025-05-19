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
  test
}) => {
  const { t } = useTranslation();
  
  return (
    <>    
      {/* Recipe Number */}
      <Row>
        <Col md={12}>
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.before.recipeData.recipeNumber')}</Form.Label>
            <Form.Control
              type="text"
              name="recipeData.recipeNumber"
              value={formData.recipeData?.recipeNumber}
              onChange={handleChange}
              autoComplete="off"
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
        title={t('tests.before.recipeData.thermalCycle.title')}
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
          handleThermalCycleChange={handleThermalCycleChange}
          loading={loading}
          selectStyles={selectStyles}
        />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('tests.before.recipeData.chemicalCycle.title')}
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
      
      {/* Ajout de la nouvelle section pour la prévisualisation du graphique */}
      <CollapsibleSection
        title={t('tests.before.recipeData.previewChart.title', 'Prévisualisation du graphique')}
        isExpandedByDefault={false}
        sectionId="test-recipe-preview"
        rememberState={true}
        level={1}
      >
        <RecipePreviewChart formData={formData} />
      </CollapsibleSection>
      
      <CollapsibleSection
        title={t('tests.before.recipeData.quenchData.title')}
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
