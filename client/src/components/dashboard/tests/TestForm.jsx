import React from 'react';
import { Form, Button } from 'react-bootstrap';
import useTestForm from './hooks/useTestForm';

// Sections importées
import BasicInfoSection from './sections/BasicInfoSection';
import TestTypeSection from './sections/TestTypeSection';
import FurnaceDataSection from './sections/FurnaceDataSection';
import LoadDataSection from './sections/LoadDataSection';
import RecipeDataSection from './sections/RecipeDataSection';

const TestForm = ({ onClose, onTestCreated }) => {
  const {
    formData,
    errors,
    loading,
    message,
    ...formHandlers
  } = useTestForm(onClose, onTestCreated);

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      {errors.parent && (
        <div className="alert alert-danger mb-3">
          {errors.parent}
        </div>
      )}
      
      <Form onSubmit={formHandlers.handleSubmit}>
        <BasicInfoSection
          formData={formData}
          errors={errors}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          getSelectedOption={formHandlers.getSelectedOption}
          locationOptions={formHandlers.locationOptions}
          statusOptions={formHandlers.statusOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
        />
        
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

        {/* Boutons de soumission */}
        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default TestForm;