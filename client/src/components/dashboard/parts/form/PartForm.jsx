import React, { forwardRef, useState, useCallback, useImperativeHandle } from 'react';
import { Modal, Form, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import SteelForm from '../../steels/form/SteelForm';
import CloseConfirmationModal from '../../../common/CloseConfirmation/CloseConfirmationModal';
// Custom hooks
import usePartForm from '../hooks/usePartForm';
// Section components
import BasicInfoSection from './sections/basic_infos/BasicInfoSection';
import DimensionsSection from './sections/dimensions/DimensionsSection';
import SpecificationsSection from './sections/specifications/SpecificationsSection';
import SteelSection from './sections/steel/SteelSection';
import PhotosSection from './sections/photos/PhotosSection';
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';

const PartForm = forwardRef(({ part, onClose, onPartCreated, onPartUpdated, viewMode = false }, ref) => {
  const { t } = useTranslation();
  
  // État pour stocker la fonction d'association de fichiers
  const [fileAssociationMethod, setFileAssociationMethod] = useState(null);
  
  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    console.log("File association function received in PartForm");
    setFileAssociationMethod(() => associateFilesFunc);
  }, []);  const {
    formData,
    errors,
    loading,
    fetchingPart,
    message,
    designationOptions,
    steelOptions,
    lengthUnitOptions,
    weightUnitOptions, 
    hardnessUnitOptions,
    handleChange,
    handleSelectChange,
    handleCreateOption,
    handleSubmit,
    getSelectedOption,
    selectStyles,
    refreshSteels,
    setFileAssociationCallback,
    // Handlers spécifiques aux spécifications
    addHardnessSpec,
    removeHardnessSpec,
    updateHardnessSpec,
    addEcdSpec,
    removeEcdSpec,
    updateEcdSpec,
    showConfirmModal,
    setShowConfirmModal, // Ajout pour les tests de debug
    pendingClose,
    isModified,
    setModified,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
  } = usePartForm(part, onClose, onPartCreated, onPartUpdated, viewMode);

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change
  React.useEffect(() => {
    if (setFileAssociationCallback && fileAssociationMethod) {
      console.log("Setting file association callback in PartForm");
      setFileAssociationCallback(() => fileAssociationMethod);
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

  // Style pour les champs en mode lecture seule
  const readOnlyFieldStyle = viewMode ? {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    cursor: 'default'
  } : {};

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
        
        {/* Légende pour les champs obligatoires - masquée en mode lecture seule */}
        {!viewMode && (
          <div className="text-muted small mb-3">
            <span className="text-danger fw-bold">*</span> {t('form.requiredFields')}
          </div>
        )}
        
        <Form onSubmit={handleSubmit} autoComplete="off">
          <CollapsibleSection
            title={t('parts.sections.basicInfo')}
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
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title={t('parts.sections.dimensions')}
            isExpandedByDefault={false}
            sectionId="part-dimensions"
            rememberState={true}
          >
            <DimensionsSection
              formData={formData}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              handleCreateOption={handleCreateOption}
              getSelectedOption={getSelectedOption}
              lengthUnitOptions={lengthUnitOptions}
              weightUnitOptions={weightUnitOptions}
              loading={loading}
              selectStyles={selectStyles}
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title={t('parts.sections.steel')}
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
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title={t('parts.sections.specifications')}
            isExpandedByDefault={false}
            sectionId="part-specifications"
            rememberState={true}
          >            <SpecificationsSection
              formData={formData}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              handleCreateOption={handleCreateOption}
              getSelectedOption={getSelectedOption}
              hardnessUnitOptions={hardnessUnitOptions}
              depthUnitOptions={lengthUnitOptions} // Utiliser lengthUnitOptions pour les unités de profondeur
              loading={loading}
              selectStyles={selectStyles}
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
              // Nouveaux handlers spécialisés
              addHardnessSpec={addHardnessSpec}
              removeHardnessSpec={removeHardnessSpec}
              updateHardnessSpec={updateHardnessSpec}
              addEcdSpec={addEcdSpec}
              removeEcdSpec={removeEcdSpec}
              updateEcdSpec={updateEcdSpec}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title={t('parts.sections.photos')}
            isExpandedByDefault={false}
            sectionId="part-photos"
            rememberState={true}
          >
            <PhotosSection
              partNodeId={part ? part.id : null}
              onFileAssociationNeeded={handleFileAssociationNeeded}
              viewMode={viewMode}
            />
          </CollapsibleSection>
          
          <div className="d-flex justify-content-end mt-4">
            {viewMode ? (
              <Button variant="secondary" onClick={onClose}>
                {t('common.close')}
              </Button>
            ) : (              <>
                <Button variant="secondary" onClick={() => {
                  console.log('🟢 Cancel button clicked in PartForm');
                  handleCloseRequest();
                }} className="mr-2">
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="warning"
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? (part ? t('common.modifying') : t('common.creating'))
                    : (part ? t('common.edit') : t('common.create'))
                  }
                </Button>
              </>
            )}
          </div>
        </Form>
      </div>
      
      {/* Modal de confirmation pour la fermeture - non affiché en mode lecture seule */}
      {!viewMode && (
        <CloseConfirmationModal
          show={showConfirmModal}
          onHide={cancelClose}
          onCancel={cancelClose}
          onContinue={confirmClose}
          onSave={saveAndClose}
          title={t('closeModal.title')}
          message={t('closeModal.unsavedChanges')}
        />
      )}
      
      {/* Modal de création d'acier - non affichée en mode lecture seule */}
      {!viewMode && (
        <Modal
          show={showSteelModal}
          onHide={handleCloseSteelModal}
          size="lg"
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>{t('steels.add')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <SteelForm
              onClose={handleCloseSteelModal}
              onSteelCreated={handleSteelCreated}
            />
          </Modal.Body>
        </Modal>
      )}
    </>
  );
});

export default PartForm;
