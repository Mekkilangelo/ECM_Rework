import React, { useState, useCallback, forwardRef, useEffect, useImperativeHandle } from 'react';
import { Form, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useTestForm from '../hooks/useTestForm';
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';
import CloseConfirmationModal from '../../../common/CloseConfirmation/CloseConfirmationModal';

// Sections importées
import BasicInfoSection from './sections/common/BasicInfoSection';
import BeforeTabContent from './sections/before/BeforeTabContent';
import AfterTabContent from './sections/after/AfterTabContent';
import ReportTabContent from './sections/report/ReportTabContent';

const TestForm = forwardRef(({ test, onClose, onTestCreated, onTestUpdated, viewMode = false }, ref) => {
  const { t } = useTranslation();

  // État pour stocker la fonction d'association de fichiers
  const [fileAssociationMethods, setFileAssociationMethods] = useState({
    before: null,
    after: null
  });

  // Gestionnaires pour recevoir les fonctions d'association des fichiers
  const handleBeforeFileAssociationNeeded = useCallback((associateFilesFunc) => {
    console.log("Before tab file association function received in TestForm");
    setFileAssociationMethods(prev => ({
      ...prev,
      before: associateFilesFunc
    }));
  }, []);
  
  const handleAfterFileAssociationNeeded = useCallback((associateFilesFunc) => {
    console.log("After tab file association function received in TestForm");
    setFileAssociationMethods(prev => ({
      ...prev,
      after: associateFilesFunc
    }));
  }, []);

  // Combiner toutes les fonctions d'association de fichiers
  const combineFileAssociations = React.useCallback(async (nodeId) => {
    console.log("Combining all file associations for nodeId:", nodeId);
    const promises = [];
    let results = { success: true };
    
    // Parcourir toutes les méthodes d'association disponibles
    Object.entries(fileAssociationMethods).forEach(([tab, method]) => {
      if (method) {
        console.log(`Calling file association method for tab: ${tab}`);
        promises.push(method(nodeId));
      }
    });
    
    if (promises.length > 0) {
      try {
        const associationResults = await Promise.all(promises);
        console.log("All association results:", associationResults);
        // Si l'un des résultats est false, on considère que l'opération a échoué
        if (associationResults.some(result => result === false)) {
          results.success = false;
        }
      } catch (error) {
        console.error("Error in file associations:", error);
        results.success = false;
        results.error = error;
      }
    } else {
      console.log("No file associations to process");
    }
    
    return results.success;
  }, [fileAssociationMethods]);

  // Exposer handleCloseRequest à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest
  }));  const {
    formData,
    errors,
    loading,
    fetchingTest,
    message,
    setFileAssociationCallback,
    handleSubmit,
    showConfirmModal,
    pendingClose,
    isModified,
    setModified,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    // Extraire les fonctions d'import Excel
    fileInputRef,
    getCurveSectionRef,
    handleExcelImport,
    processExcelData,
    handleEcdChange,
    handleHardnessChange,
    ...formHandlers
  } = useTestForm(test, onClose, onTestCreated, onTestUpdated, viewMode);

  // Style pour les champs en mode lecture seule
  const readOnlyFieldStyle = viewMode ? {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    cursor: 'default'
  } : {};

  // Fonction pour rendre les titres d'onglets avec mise en gras et rouge pour l'onglet actif
  const renderTabTitle = (title, eventKey) => {
    // Style de l'onglet actif : gras et rouge (utilisant la même couleur que Bootstrap danger)
    const activeStyle = {
      fontWeight: 'bold',
      color: '#dc3545' // Rouge Bootstrap danger, même couleur que pour les sections étendues
    };
    
    return (
      <span style={activeTab === eventKey ? activeStyle : {}}>
        {title}
      </span>
    );
  };

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change
  useEffect(() => {
    if (setFileAssociationCallback) {
      console.log("Setting combined file association callback in TestForm");
      setFileAssociationCallback(() => combineFileAssociations); // Utiliser une fonction qui retourne combineFileAssociations
    }
  }, [combineFileAssociations, setFileAssociationCallback]);

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
            {t(errors.parent)}
          </div>
        )}
        
        {/* Légende pour les champs obligatoires - masquée en mode lecture seule */}
        {!viewMode && (
          <div className="text-muted small mb-3">
            <span className="text-danger fw-bold">*</span> {t('form.requiredFields')}
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>

          <CollapsibleSection 
            title={t('tests.sections.basicInfo')}
            isExpandedByDefault={true}
            sectionId="test-basic-info"
            rememberState={true}
            nestingLevel={0}
          >
            {/* Section BasicInfo toujours visible */}            <BasicInfoSection
              formData={formData}
              errors={errors}
              handleChange={formHandlers.handleChange}
              handleSelectChange={formHandlers.handleSelectChange}
              getSelectedOption={formHandlers.getSelectedOption}
              locationOptions={formHandlers.locationOptions}
              statusOptions={formHandlers.statusOptions}
              loading={loading}
              selectStyles={formHandlers.selectStyles}
              viewMode={viewMode}
              readOnlyFieldStyle={readOnlyFieldStyle}
            />
          </CollapsibleSection>
          
          {/* Affichage conditionnel des onglets en fonction du mode */}
          {isEditMode ? (
            <Tabs
              activeKey={activeTab}
              onSelect={handleTabChange}
              className="mb-4 mt-4"
              id="test-form-tabs"
            >              <Tab eventKey="before" title={renderTabTitle(t('tests.tabs.before'), "before")}>
                <BeforeTabContent 
                  formData={formData}
                  errors={errors}
                  loading={loading}
                  formHandlers={formHandlers}
                  test={test}
                  handleFileAssociationNeeded={handleBeforeFileAssociationNeeded}
                  viewMode={viewMode}
                  readOnlyFieldStyle={readOnlyFieldStyle}
                />
              </Tab>              <Tab eventKey="after" title={renderTabTitle(t('tests.tabs.after'), "after")}>
                <AfterTabContent 
                  formData={formData}
                  errors={errors}
                  loading={loading}
                  formHandlers={formHandlers}
                  test={test}
                  handleFileAssociationNeeded={handleAfterFileAssociationNeeded}
                  viewMode={viewMode}
                  readOnlyFieldStyle={readOnlyFieldStyle}
                  // Passer les fonctions d'import Excel
                  excelImportHandlers={{
                    fileInputRef,
                    getCurveSectionRef,
                    handleExcelImport,
                    processExcelData,
                    handleEcdChange,
                    handleHardnessChange
                  }}
                />
              </Tab>
              <Tab eventKey="report" title={renderTabTitle(t('tests.tabs.report'), "report")}>
                <ReportTabContent 
                  testId={test.id}
                  partId={test.parent_id}  // Ajoutez directement l'ID de la pièce
                />
              </Tab>
            </Tabs>
          ) : (
            // En mode création, on affiche directement le contenu de l'onglet "Before"
            <div className="mt-4">              <BeforeTabContent 
                formData={formData}
                errors={errors}
                loading={loading}
                formHandlers={formHandlers}
                test={test}
                handleFileAssociationNeeded={handleBeforeFileAssociationNeeded}
                viewMode={viewMode}
                readOnlyFieldStyle={readOnlyFieldStyle}
              />
            </div>
          )}          {/* Boutons de soumission */}
          <div className="d-flex justify-content-end mt-4">
            {viewMode ? (
              <Button variant="secondary" onClick={onClose}>
                {t('common.close')}
              </Button>
            ) : (
              <>                <Button variant="secondary" onClick={() => {
                  console.log('🟢 Cancel button clicked in TestForm');
                  handleCloseRequest();
                }} className="mr-2">
                  {t('common.cancel')}
                </Button>
                <Button variant="warning" type="submit" disabled={loading}>
                  {loading 
                    ? (isEditMode ? t('tests.modifying') : t('tests.creating')) 
                    : (isEditMode ? t('common.edit') : t('common.create'))}
                </Button>
              </>
            )}
          </div>
        </Form>      </div>

      {/* Modal de confirmation pour la fermeture - non affichée en mode lecture seule */}
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
    </>
  );
});

export default TestForm;
