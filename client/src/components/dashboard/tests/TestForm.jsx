import React, { useState, useCallback, forwardRef } from 'react';
import { Form, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import useTestForm from './hooks/useTestForm';
import CollapsibleSection from '../../common/CollapsibleSection/CollapsibleSection';
import CloseConfirmationModal from '../../common/CloseConfirmation/CloseConfirmationModal';

// Sections importées
import BasicInfoSection from './sections/BasicInfoSection';
import BeforeTabContent from './sections/before/BeforeTabContent';
import AfterTabContent from './sections/after/AfterTabContent';
import ReportTabContent from './sections/report/ReportTabContent';

const TestForm = forwardRef(({ test, onClose, onTestCreated, onTestUpdated }, ref) => {

  // État pour stocker la fonction d'association de fichiers
  const [fileAssociationMethod, setFileAssociationMethod] = useState(null);

  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationMethod(() => associateFilesFunc);
  }, []);

  const {
    formData,
    errors,
    loading,
    fetchingTest,
    message,
    setFileAssociationCallback,
    handleSubmit,
    showConfirmModal,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    ...formHandlers
  } = useTestForm( test, onClose, onTestCreated, onTestUpdated);

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change
  React.useEffect(() => {
    if (setFileAssociationCallback) {
      setFileAssociationCallback(fileAssociationMethod);
    }
  }, [fileAssociationMethod, setFileAssociationCallback]);

  // État pour gérer l'onglet actif
  const [activeTab, setActiveTab] = useState('before');

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Détermine si nous sommes en mode édition
  const isEditMode = Boolean(test);

  if (fetchingTest) {
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
        
        <Form onSubmit={handleSubmit}>

          <CollapsibleSection 
            title="Informations de base" 
            isExpandedByDefault={true}
            sectionId="test-basic-info"
            rememberState={true}
          >
            {/* Section BasicInfo toujours visible */}
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
          </CollapsibleSection>
          
          {/* Affichage conditionnel des onglets en fonction du mode */}
          {isEditMode ? (
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabChange}
              className="mb-4 mt-4"
              id="test-form-tabs"
            >
              <Tab eventKey="before" title="Before">
                <BeforeTabContent 
                  formData={formData}
                  errors={errors}
                  loading={loading}
                  formHandlers={formHandlers}
                  test={test}
                  handleFileAssociationNeeded={handleFileAssociationNeeded}
                />
              </Tab>
              <Tab eventKey="after" title="After">
                <AfterTabContent 
                  formData={formData}
                  errors={errors}
                  loading={loading}
                  formHandlers={formHandlers}
                  test={test}
                  handleFileAssociationNeeded={handleFileAssociationNeeded}
                />
              </Tab>
              <Tab eventKey="report" title="Report">
                <ReportTabContent 
                  testId={test.id}
                />
              </Tab>
            </Tabs>
          ) : (
            // En mode création, on affiche directement le contenu de l'onglet "Before"
            <div className="mt-4">
              <BeforeTabContent 
                formData={formData}
                errors={errors}
                loading={loading}
                formHandlers={formHandlers}
                test={test}
                handleFileAssociationNeeded={handleFileAssociationNeeded}
              />
            </div>
          )}

          {/* Boutons de soumission */}
          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" onClick={handleCloseRequest} className="me-2">
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (isEditMode ? 'Modification en cours...' : 'Création en cours...') : (isEditMode ? 'Modifier' : 'Créer')}
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
  </>
  );
});

export default TestForm;