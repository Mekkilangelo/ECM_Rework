import React, { useState, useCallback, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faCheckCircle, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import useTrialForm from '../hooks/useTrialForm';
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';
import CloseConfirmationModal from '../../../common/CloseConfirmation/CloseConfirmationModal';
import { useRenderTracker } from '../../../../utils/performanceMonitor';
import './TrialForm.css';

// Sections importées
import BasicInfoSection from './sections/common/BasicInfoSection';
import BeforeTabContent from './sections/before/BeforeTabContent';
import AfterTabContent from './sections/after/AfterTabContent';
import { ReportConfiguration } from '../../../../features/reports';

const TrialForm = forwardRef(({ 
  trial, 
  onClose, 
  onTrialCreated, 
  onTrialUpdated, 
  viewMode = false,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
  useExternalNavigation = false
}, ref) => {
  const { t } = useTranslation();
  
  // Tracker les performances
  useRenderTracker('TrialForm');
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

  // Exposer handleCloseRequest et copy/paste à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest,
    handleCopy,
    handlePaste,
    setActiveTab: (tab) => {
      if (!useExternalNavigation) {
        setInternalActiveTab(tab);
      }
    }
  }));  const {
    formData,
    errors,
    loading,
    fetchingTrial,
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
    // Copy/Paste functionality
    handleCopy,
    handlePaste,
    ...formHandlers
  } = useTrialForm(trial, onClose, onTrialCreated, onTrialUpdated, viewMode);

  // Style pour les champs en mode lecture seule
  const readOnlyFieldStyle = viewMode ? {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    cursor: 'default'
  } : {};

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change (optimisé)
  useEffect(() => {
    if (setFileAssociationCallback) {
      setFileAssociationCallback(() => combineFileAssociations); // Utiliser une fonction qui retourne combineFileAssociations
    }
  }, [combineFileAssociations, setFileAssociationCallback]); // Dépendances précises

  // État pour gérer l'onglet actif (interne seulement si pas de navigation externe)
  const [internalActiveTab, setInternalActiveTab] = useState('before');

  // Utiliser l'état externe si disponible, sinon utiliser l'état interne
  const activeTab = useExternalNavigation ? externalActiveTab : internalActiveTab;

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (key) => {
    if (useExternalNavigation && externalOnTabChange) {
      externalOnTabChange(key);
    } else {
      setInternalActiveTab(key);
    }
  };

  // Détermine si nous sommes en mode édition
  const isEditMode = Boolean(trial);
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

  if (fetchingTrial) {
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
            title={t('trials.sections.basicInfo')}
            isExpandedByDefault={false}
            sectionId="trial-basic-info"
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
          
          {/* Navigation verticale à gauche avec contenu principal */}
          {isEditMode ? (
            <div className="trial-form-layout d-flex">
              {/* Navigation verticale à gauche - masquée si navigation externe */}
              {!useExternalNavigation && (
                <div className="trial-navigation">
                <div className="trial-nav-item" onClick={() => handleTabChange('before')}>
                  <div className={`trial-nav-button ${activeTab === 'before' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faFlask} className="trial-nav-icon" />
                    <span className="trial-nav-text">{t('trials.tabs.before')}</span>
                  </div>
                </div>
                <div className="trial-nav-item" onClick={() => handleTabChange('after')}>
                  <div className={`trial-nav-button ${activeTab === 'after' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faCheckCircle} className="trial-nav-icon" />
                    <span className="trial-nav-text">{t('trials.tabs.after')}</span>
                  </div>
                </div>
                <div className="trial-nav-item" onClick={() => handleTabChange('report')}>
                  <div className={`trial-nav-button ${activeTab === 'report' ? 'active' : ''}`}>
                    <FontAwesomeIcon icon={faFileAlt} className="trial-nav-icon" />
                    <span className="trial-nav-text">{t('trials.tabs.report')}</span>
                  </div>
                </div>
              </div>
              )}
              
              {/* Contenu principal */}
              <div className={`trial-content ${useExternalNavigation ? 'full-width' : ''}`}>
                {activeTab === 'before' && (
                  <BeforeTabContent 
                    formData={formData}
                    errors={errors}
                    loading={loading}
                    formHandlers={formHandlers}
                    trial={trial}
                    handleFileAssociationNeeded={handleBeforeFileAssociationNeeded}
                    viewMode={viewMode}
                    readOnlyFieldStyle={readOnlyFieldStyle}
                    calculateProgramDuration={calculateProgramDuration}
                  />
                )}
                
                {activeTab === 'after' && (
                  <AfterTabContent
                    ref={afterTabContentRef}
                    formData={formData}
                    errors={errors}
                    loading={loading}
                    formHandlers={formHandlers}
                    trial={trial}
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
                )}
                
                {activeTab === 'report' && (
                  <ReportConfiguration 
                    trialId={trial.id}
                    partId={trial.parent_id}
                  />
                )}
              </div>
            </div>
          ) : (
            // En mode création, on affiche directement le contenu de l'onglet "Before"
            <div className="mt-4">
              <BeforeTabContent 
                formData={formData}
                errors={errors}
                loading={loading}
                formHandlers={formHandlers}
                trial={trial}
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
                    ? (isEditMode ? t('trials.modifying') : t('trials.creating')) 
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

export default TrialForm;
