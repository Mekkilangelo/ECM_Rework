// src/components/dashboard/parts/PartForm.jsx
import React from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';

// Custom hooks
import usePartForm from './hooks/usePartForm';

// Section components
import BasicInfoSection from './sections/BasicInfoSection';
import DimensionsSection from './sections/DimensionsSection';
import SpecificationsSection from './sections/SpecificationsSection';
import PhotosSection from './sections/PhotosSection';
import CollapsibleSection from '../../common/CollapsibleSection/CollapsibleSection';

const PartForm = ({ part, onClose, onPartCreated, onPartUpdated }) => {
  const {
    formData,
    errors,
    loading,
    fetchingPart,
    message,
    designationOptions,
    steelOptions,
    handleChange,
    handleSelectChange,
    handleSubmit,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles,
    handlePhotoUpload
  } = usePartForm(part, onClose, onPartCreated, onPartUpdated);

  if (fetchingPart) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

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
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        <CollapsibleSection 
          title="Informations de base" 
          isExpandedByDefault={true}
          sectionId="part-basic-info"
          rememberState={true}
        >
          <BasicInfoSection
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            getSelectedOption={getSelectedOption}
            designationOptions={designationOptions}
            loading={loading}
            selectStyles={selectStyles}
          />
        </CollapsibleSection>
        
        <CollapsibleSection 
          title="Dimensions" 
          isExpandedByDefault={false}
          sectionId="part-dimensions"
          rememberState={true}
        >
          <DimensionsSection
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            getSelectedOption={getSelectedOption}
            getLengthUnitOptions={getLengthUnitOptions}
            getWeightUnitOptions={getWeightUnitOptions}
            loading={loading}
            selectStyles={selectStyles}
          />
        </CollapsibleSection>
        
        <CollapsibleSection 
          title="Spécifications" 
          isExpandedByDefault={false}
          sectionId="part-specifications"
          rememberState={true}
        >
          <SpecificationsSection
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            getSelectedOption={getSelectedOption}
            steelOptions={steelOptions}
            getHardnessUnitOptions={getHardnessUnitOptions}
            loading={loading}
            selectStyles={selectStyles}
          />
        </CollapsibleSection>
        
        {/* Nouvelle section de photos */}
        <CollapsibleSection 
          title="Photos de la pièce" 
          isExpandedByDefault={false}
          sectionId="part-photos"
          rememberState={true}
        >
          <PhotosSection onUpload={handlePhotoUpload} />
        </CollapsibleSection>
        
        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading 
              ? (part ? 'Modification en cours...' : 'Création en cours...') 
              : (part ? 'Modifier' : 'Créer')
            }
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PartForm;
