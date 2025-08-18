import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ResultsDataSection from './sections/results/ResultsDataSection';
import FurnaceReportSection from './sections/furnace_report/FurnaceReportSection';
import SpecificationsSection from './sections/specifications/SpecificationsSection';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
import testService from '../../../../../../services/testService';

const AfterTabContent = forwardRef(({
  formData, 
  errors, 
  loading, 
  formHandlers, 
  test, 
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
      if (!test || !test.id || !test.parent_id) {
        return;
      }

      try {
        const response = await testService.getTestSpecs(test.id, test.parent_id);
        
        console.log('🔍 AfterTabContent - Réponse testService:', response);
        
        if (response && response.specifications !== undefined && response.specifications !== null) {
          let specs = response.specifications;
          
          // Parser si c'est une chaîne JSON
          if (typeof specs === 'string') {
            try {
              specs = JSON.parse(specs);
              console.log('🔍 AfterTabContent - Specs parsées:', specs);
            } catch (parseError) {
              console.error('Erreur parsing specs dans AfterTabContent:', parseError);
              specs = { hardnessSpecs: [], ecdSpecs: [] };
            }
          } else if (!specs || typeof specs !== 'object') {
            specs = { hardnessSpecs: [], ecdSpecs: [] };
          }
          
          console.log('🔍 AfterTabContent - Specs finales à passer aux courbes:', specs);
          console.log('🔍 AfterTabContent - EcdSpecs trouvées:', specs.ecdSpecs);
          
          setSpecifications(specs);
        }
      } catch (error) {
        console.error('Erreur récupération specs dans AfterTabContent:', error);
        setSpecifications({ hardnessSpecs: [], ecdSpecs: [] });
      }
    };

    fetchSpecifications();
  }, [test]);

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
        title={t('tests.after.specifications.title')}
        isExpandedByDefault={true}
        sectionId="test-specifications"
        rememberState={false}
      >        <SpecificationsSection
          testNodeId={test ? test.id : null}
          parentId={test ? test.parent_id : null}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('tests.after.furnaceReport.title')}
        isExpandedByDefault={false}
        sectionId="test-furnace-report"
        rememberState={false}
        level={0}
      >        <FurnaceReportSection
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleFileAssociationNeeded}
          viewMode={viewMode}
        />
      </CollapsibleSection>
      <CollapsibleSection
        title={t('tests.after.results.title')}
        isExpandedByDefault={true}
        sectionId="test-results"
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
          test={test}
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
