import React, { forwardRef, useState, useCallback, useImperativeHandle } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import SteelForm from '../steels/SteelForm';
import CloseConfirmationModal from '../../common/CloseConfirmation/CloseConfirmationModal';

// Custom hooks
import usePartForm from './hooks/usePartForm';

// Section components
import BasicInfoSection from './sections/BasicInfoSection';
import DimensionsSection from './sections/DimensionsSection';
import SpecificationsSection from './sections/SpecificationsSection';
import SteelSection from './sections/SteelSection';
import PhotosSection from './sections/PhotosSection';
import CollapsibleSection from '../../common/CollapsibleSection/CollapsibleSection';

const PartForm = forwardRef(({ part, onClose, onPartCreated, onPartUpdated }, ref) => {
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
    handleCreateOption,
    handleSubmit,
    getSelectedOption,
    getLengthUnitOptions,
    getWeightUnitOptions,
    getHardnessUnitOptions,
    selectStyles,
    refreshSteels,
    setFileAssociationCallback,
    showConfirmModal,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
  } = usePartForm(part, onClose, onPartCreated, onPartUpdated);

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change
  React.useEffect(() => {
    if (setFileAssociationCallback) {
      setFileAssociationCallback(fileAssociationMethod);
    }
  }, [fileAssociationMethod, setFileAssociationCallback]);

  // Exposer handleCloseRequest à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest
  }));

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
              handleCreateOption={handleCreateOption}
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
          
          {/* Nouvelle section pour l'acier */}
          <CollapsibleSection
            title="Acier"
            isExpandedByDefault={false}
            sectionId="part-steel"
            rememberState={true}
          >
            <SteelSection
              formData={formData}
              handleSelectChange={handleSelectChange}
              getSelectedOption={getSelectedOption}
              steelOptions={steelOptions}
              loading={loading}
              selectStyles={selectStyles}
              onOpenSteelModal={handleOpenSteelModal}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title="Spécifications LPC"
            isExpandedByDefault={false}
            sectionId="part-specifications"
            rememberState={true}
          >
            <SpecificationsSection
              formData={formData}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              getSelectedOption={getSelectedOption}
              getHardnessUnitOptions={getHardnessUnitOptions}
              loading={loading}
              selectStyles={selectStyles}
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
            <Button variant="secondary" onClick={handleCloseRequest} className="me-2">
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
      
      {/* Modal de confirmation pour la fermeture */}
      <CloseConfirmationModal
        show={showConfirmModal}
        onHide={cancelClose}
        onCancel={cancelClose}
        onContinue={confirmClose}
        onSave={saveAndClose}
        title="Confirmer la fermeture"
        message="Vous avez des modifications non enregistrées."
      />
      
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
});

export default PartForm;