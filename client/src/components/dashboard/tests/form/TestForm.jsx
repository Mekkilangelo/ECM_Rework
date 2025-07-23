import React, { useState, useCallback, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Form, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useTestForm from '../hooks/useTestForm';
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';
import CloseConfirmationModal from '../../../common/CloseConfirmation/CloseConfirmationModal';
import { useRenderTracker } from '../../../../utils/performanceMonitor';

// Sections importées
import BasicInfoSection from './sections/common/BasicInfoSection';
import BeforeTabContent from './sections/before/BeforeTabContent';
import AfterTabContent from './sections/after/AfterTabContent';
import ReportTabContent from './sections/report/ReportTabContent';

const TestForm = forwardRef(({ test, onClose, onTestCreated, onTestUpdated, viewMode = false }, ref) => {
  const { t } = useTranslation();
  
  // Tracker les performances
  useRenderTracker('TestForm');
  // État pour stocker la fonction d'association de fichiers (memoized)
  const [fileAssociationMethods, setFileAssociationMethods] = useState({
    before: null,
    after: null
  });
  // Gestionnaires pour recevoir les fonctions d'association des fichiers (optimisés)
  const handleBeforeFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationMethods(prev => ({
      ...prev,
      before: associateFilesFunc
    }));
  }, []);
  
  const handleAfterFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationMethods(prev => ({
      ...prev,
      after: associateFilesFunc
    }));
  }, []);
  // Combiner toutes les fonctions d'association de fichiers (optimisé)
  const combineFileAssociations = useCallback(async (nodeId) => {
    const promises = [];
    let results = { success: true };
    
    // Parcourir toutes les méthodes d'association disponibles
    Object.entries(fileAssociationMethods).forEach(([tab, method]) => {
      if (method) {
        promises.push(method(nodeId));
      }
    });    
    if (promises.length > 0) {
      try {
        const associationResults = await Promise.all(promises);
        // Si l'un des résultats est false, on considère que l'opération a échoué
        if (associationResults.some(result => result === false)) {
          results.success = false;
        }
      } catch (error) {
        console.error("Error in file associations:", error);
        results.success = false;
        results.error = error;
      }
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
    calculateProgramDuration,
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
  };  // Mettre à jour le callback d'association de fichiers dans le hook quand il change (optimisé)
  useEffect(() => {
    if (setFileAssociationCallback) {
      setFileAssociationCallback(() => combineFileAssociations); // Utiliser une fonction qui retourne combineFileAssociations
    }
  }, [combineFileAssociations, setFileAssociationCallback]); // Dépendances précises

  // État pour gérer l'onglet actif
  const [activeTab, setActiveTab] = useState('before');

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Détermine si nous sommes en mode édition
  const isEditMode = Boolean(test);
  const afterTabContentRef = useRef();

  // Wrapper for form submit to flush curves before submit
  const handleFormSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Flush all curves before submit
    if (afterTabContentRef.current && afterTabContentRef.current.flushAllCurves) {
      await afterTabContentRef.current.flushAllCurves();
    }
    // Now call the real handleSubmit
    handleSubmit(e);
  };

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
        
        <Form onSubmit={handleFormSubmit}>

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
                  calculateProgramDuration={calculateProgramDuration}
                />
              </Tab>              <Tab eventKey="after" title={renderTabTitle(t('tests.tabs.after'), "after")}>
                <AfterTabContent
                  ref={afterTabContentRef}
                  formData={(() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('=== TESTFORM -> AFTERTABCONTENT ===');
                      console.log('formData being passed:', formData);
                      console.log('formData.resultsData:', formData.resultsData);
                      if (formData.resultsData?.results?.length > 0) {
                        console.log('First result samples:', formData.resultsData.results[0].samples?.length || 0);
                        if (formData.resultsData.results[0].samples?.length > 0) {
                          const firstSample = formData.resultsData.results[0].samples[0];
                          console.log('First sample curveData from TestForm:', firstSample.curveData);
                          console.log('First sample curveData NOUVEAU FORMAT - distances:', firstSample.curveData?.distances?.length || 0);
                          console.log('First sample curveData NOUVEAU FORMAT - series:', firstSample.curveData?.series?.length || 0);
                          console.log('First sample curveData ANCIEN FORMAT - points:', firstSample.curveData?.points?.length || 0);
                          if (firstSample.curveData?.distances?.length > 0 || firstSample.curveData?.series?.length > 0) {
                            console.log('✅ TestForm détecte des données de courbe au NOUVEAU FORMAT');
                          } else if (firstSample.curveData?.points?.length > 0) {
                            console.log('⚠️ TestForm détecte des données de courbe à l\'ANCIEN FORMAT');
                          } else {
                            console.log('❌ TestForm ne détecte AUCUNE donnée de courbe');
                          }
                        }
                      }
                    }
                    return formData;
                  })()}
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
                calculateProgramDuration={calculateProgramDuration}
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
