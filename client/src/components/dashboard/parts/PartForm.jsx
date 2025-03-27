// src/components/dashboard/parts/PartForm.jsx
import React, { useState, useCallback } from 'react';
import { Modal, Form, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import SteelForm from '../steels/SteelForm';

// Custom hooks
import usePartForm from './hooks/usePartForm';

// Section components
import BasicInfoSection from './sections/BasicInfoSection';
import DimensionsSection from './sections/DimensionsSection';
import SpecificationsSection from './sections/SpecificationsSection';
import PhotosSection from './sections/PhotosSection';
import CollapsibleSection from '../../common/CollapsibleSection/CollapsibleSection';

const PartForm = ({ part, onClose, onPartCreated, onPartUpdated }) => {
  // État pour stocker la fonction d'association de fichiers
  const [fileAssociationMethod, setFileAssociationMethod] = useState(null);

  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationMethod(() => associateFilesFunc);
  }, []);
  
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
    refreshSteels,
    setFileAssociationCallback 
  } = usePartForm(part, onClose, onPartCreated, onPartUpdated);

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change
  React.useEffect(() => {
    if (setFileAssociationCallback) {
      setFileAssociationCallback(fileAssociationMethod);
    }
  }, [fileAssociationMethod, setFileAssociationCallback]);

  // État pour gérer la modal de création d'acier
  const [showSteelModal, setShowSteelModal] = useState(false);
  
  // Fonction pour ouvrir la modal d'acier
  const handleOpenSteelModal = () => {
    setShowSteelModal(true);
  };
  
  // Fonction pour fermer la modal d'acier
  const handleCloseSteelModal = () => {
    setShowSteelModal(false);
  };
  
  // Fonction appelée lorsqu'un nouvel acier est créé
  const handleSteelCreated = async (newSteel) => {
    // Fermez la modal
    setShowSteelModal(false);
    
    // Rafraîchir la liste des aciers si la fonction existe
    if (refreshSteels) {
      await refreshSteels();
    }
    
    // Sélectionner automatiquement le nouvel acier
    if (newSteel && newSteel.grade) {
      handleSelectChange(
        { value: newSteel.grade, label: `${newSteel.grade} (${newSteel.standard || ''})` }, 
        { name: 'steel' }
      );
    }
  };

  if (fetchingPart) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <>
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
              onOpenSteelModal={handleOpenSteelModal}
            />
          </CollapsibleSection>
          
          {/* Section de photos */}
          <CollapsibleSection 
            title="Photos de la pièce" 
            isExpandedByDefault={false}
            sectionId="part-photos"
            rememberState={true}
          >
            <PhotosSection
              partNodeId={part ? part.id : null}
              onFileAssociationNeeded={handleFileAssociationNeeded}
            />
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

      {/* Modal de création d'acier */}
      <Modal 
        show={showSteelModal} 
        onHide={handleCloseSteelModal} 
        size="lg" 
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un nouvel acier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <SteelForm 
            onClose={handleCloseSteelModal}
            onSteelCreated={handleSteelCreated}
          />
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PartForm;
