import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  // Fonction pour collecter les méthodes d'association des fichiers des sous-composants
  const [recipeGraphFileAssociation, setRecipeGraphFileAssociation] = useState(null);
  
  // Gestionnaire pour recevoir la fonction d'association des fichiers des graphes
  const handleRecipeGraphFileAssociationNeeded = (associateFunc) => {
    console.log("Recipe graph file association function received in RecipeDataSection");
    setRecipeGraphFileAssociation(() => associateFunc);
  };
  
  // Transmettre les méthodes d'association au parent
  React.useEffect(() => {
    if (handleFileAssociationNeeded && recipeGraphFileAssociation) {
      handleFileAssociationNeeded(recipeGraphFileAssociation);
    }
  }, [handleFileAssociationNeeded, recipeGraphFileAssociation]);
  
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
      
      <CollapsibleSection
        title={t('tests.before.recipeData.graphs.title')}
        isExpandedByDefault={true}
        sectionId="test-recipe-graph"
        rememberState={true}
        level={1}
      >  
        <RecipeGraphSection
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleRecipeGraphFileAssociationNeeded}
        />
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
