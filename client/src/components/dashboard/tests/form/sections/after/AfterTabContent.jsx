import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ResultsDataSection from './sections/results/ResultsDataSection';
import FurnaceReportSection from './sections/furnace_report/FurnaceReportSection';
import DatapaqSection from './sections/furnace_report/DatapaqSection';
import PostTreatmentSection from './sections/furnace_report/PostTreatmentSection';
import SpecificationsSection from './sections/specifications/SpecificationsSection';
import ConclusionSection from './sections/conclusion/ConclusionSection';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
import trialService from '../../../../../../services/trialService';

const AfterTabContent = forwardRef(({
  formData,
  errors,
  loading,
  formHandlers,
  trial,
  handleFileAssociationNeeded,
  viewMode = false,
  readOnlyFieldStyle = {},
  excelImportHandlers = {}
}, ref) => {
  const { t } = useTranslation();
  const resultsDataSectionRef = useRef();
  const [specifications, setSpecifications] = useState(null);

  // États pour stocker les fonctions d'association de fichiers des sous-sections
  const furnaceFileAssociationRef = useRef(null);
  const datapaqFileAssociationRef = useRef(null);
  const postTreatmentFileAssociationRef = useRef(null);
  const resultsFileAssociationRef = useRef(null);

  const handleFileAssociationNeededRef = useRef(handleFileAssociationNeeded);

  // Mettre à jour la ref quand la prop change
  useEffect(() => {
    handleFileAssociationNeededRef.current = handleFileAssociationNeeded;
  }, [handleFileAssociationNeeded]);

  // Gestionnaires pour recevoir les fonctions d'association des fichiers
  const handleFurnaceFileAssociationNeeded = React.useCallback((associateFunc) => {
    furnaceFileAssociationRef.current = associateFunc;
  }, []);

  const handleDatapaqFileAssociationNeeded = React.useCallback((associateFunc) => {
    datapaqFileAssociationRef.current = associateFunc;
  }, []);

  const handlePostTreatmentFileAssociationNeeded = React.useCallback((associateFunc) => {
    postTreatmentFileAssociationRef.current = associateFunc;
  }, []);

  const handleResultsFileAssociationNeeded = React.useCallback((associateFunc) => {
    resultsFileAssociationRef.current = associateFunc;
  }, []);

  // Créer une fonction d'association qui appellera toutes les fonctions d'association
  const combineFileAssociations = React.useCallback(async (nodeId) => {
    const promises = [];
    let results = { success: true };

    if (furnaceFileAssociationRef.current) {
      promises.push(furnaceFileAssociationRef.current(nodeId));
    }

    if (datapaqFileAssociationRef.current) {
      promises.push(datapaqFileAssociationRef.current(nodeId));
    }

    if (postTreatmentFileAssociationRef.current) {
      promises.push(postTreatmentFileAssociationRef.current(nodeId));
    }

    if (resultsFileAssociationRef.current) {
      promises.push(resultsFileAssociationRef.current(nodeId));
    }

    if (promises.length > 0) {
      const allResults = await Promise.all(promises);
      // Si au moins une association échoue, marquer comme échec
      results.success = allResults.every(result => result !== false);
    }

    return results.success;
  }, []);

  // Transmettre la fonction combinée au parent une seule fois
  useEffect(() => {
    if (handleFileAssociationNeededRef.current) {
      handleFileAssociationNeededRef.current(combineFileAssociations);
    }
  }, []); // Pas de dépendances - on ne fait cela qu'une seule fois

  // Récupérer les spécifications de la pièce parente pour les passer aux courbes
  useEffect(() => {
    const fetchSpecifications = async () => {
      if (!trial || !trial.id || !trial.parent_id) {
        return;
      }

      try {
        const response = await trialService.getTrialSpecs(trial.id, trial.parent_id);
        
        
        
        if (response && response.specifications !== undefined && response.specifications !== null) {
          let specs = response.specifications;
          
          // Parser si c'est une chaîne JSON
          if (typeof specs === 'string') {
            try {
              specs = JSON.parse(specs);
              
            } catch (parseError) {
              console.error('Erreur parsing specs dans AfterTabContent:', parseError);
              specs = { hardnessSpecs: [], ecdSpecs: [] };
            }
          } else if (!specs || typeof specs !== 'object') {
            specs = { hardnessSpecs: [], ecdSpecs: [] };
          }
          
          
          
          
          setSpecifications(specs);
        }
      } catch (error) {
        console.error('Erreur récupération specs dans AfterTabContent:', error);
        setSpecifications({ hardnessSpecs: [], ecdSpecs: [] });
      }
    };

    fetchSpecifications();
  }, [trial]);

  // Expose flushAllCurves to parent
  useImperativeHandle(ref, () => ({
    flushAllCurves: () => {
      if (resultsDataSectionRef.current && resultsDataSectionRef.current.flushAllCurves) {
        resultsDataSectionRef.current.flushAllCurves();
      }
    }
  }));

  return (
    <>
      <CollapsibleSection
        title={t('trials.after.specifications.title')}
        isExpandedByDefault={false}
        sectionId="trial-specifications"
        rememberState={false}
      >        <SpecificationsSection
          trialNodeId={trial ? trial.id : null}
          parentId={trial ? trial.parent_id : null}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('trials.after.furnaceReport.title')}
        isExpandedByDefault={false}
        sectionId="trial-furnace-report"
        rememberState={false}
        level={0}
      >        <FurnaceReportSection
          trialNodeId={trial ? trial.id : null}
          onFileAssociationNeeded={handleFurnaceFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('trials.after.datapaq.title')}
        isExpandedByDefault={false}
        sectionId="trial-datapaq"
        rememberState={false}
        level={0}
      >
        <DatapaqSection
          trialNodeId={trial ? trial.id : null}
          onFileAssociationNeeded={handleDatapaqFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('trials.after.postTreatment.title')}
        isExpandedByDefault={false}
        sectionId="trial-post-treatment"
        rememberState={false}
        level={0}
      >
        <PostTreatmentSection
          trialNodeId={trial ? trial.id : null}
          onFileAssociationNeeded={handlePostTreatmentFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('trials.after.results.title')}
        isExpandedByDefault={false}
        sectionId="trial-results"
        rememberState={false}
        level={0}
      >
        <ResultsDataSection
          ref={resultsDataSectionRef}
          formData={formData}
          parentId={formHandlers.parentId}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          handleCreateOption={formHandlers.handleCreateOption}
          getSelectedOption={formHandlers.getSelectedOption}
          lengthUnitOptions={formHandlers.lengthUnitOptions}
          hardnessUnitOptions={formHandlers.hardnessUnitOptions}
          handleResultBlocAdd={formHandlers.handleResultBlocAdd}
          handleResultBlocRemove={formHandlers.handleResultBlocRemove}
          handleSampleAdd={formHandlers.handleSampleAdd}
          handleSampleRemove={formHandlers.handleSampleRemove}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
          trial={trial}
          handleFileAssociationNeeded={handleResultsFileAssociationNeeded}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
          fileInputRef={excelImportHandlers.fileInputRef}
          handleExcelImport={excelImportHandlers.handleExcelImport}
          processExcelData={excelImportHandlers.processExcelData}
          specifications={specifications}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t('trials.after.conclusion.title')}
        isExpandedByDefault={true}
        sectionId="trial-conclusion"
        rememberState={false}
        level={0}
      >
        <ConclusionSection
          formData={formData}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          getSelectedOption={formHandlers.getSelectedOption}
          statusOptions={formHandlers.statusOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
    </>
  );
});

AfterTabContent.displayName = 'AfterTabContent';

export default React.memo(AfterTabContent);
