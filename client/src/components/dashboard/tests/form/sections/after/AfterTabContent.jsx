import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ResultsDataSection from './sections/results/ResultsDataSection';
import FurnaceReportSection from './sections/furnace_report/FurnaceReportSection';
import SpecificationsSection from './sections/specifications/SpecificationsSection';
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
        isExpandedByDefault={true}
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
          onFileAssociationNeeded={handleFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('trials.after.results.title')}
        isExpandedByDefault={true}
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
          handleFileAssociationNeeded={handleFileAssociationNeeded}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
          fileInputRef={excelImportHandlers.fileInputRef}
          handleExcelImport={excelImportHandlers.handleExcelImport}
          processExcelData={excelImportHandlers.processExcelData}
          specifications={specifications}
        />
      </CollapsibleSection>    </>
  );
});

AfterTabContent.displayName = 'AfterTabContent';

export default React.memo(AfterTabContent);
