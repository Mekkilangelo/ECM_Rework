import React from 'react';
import { useTranslation } from 'react-i18next';
import ResultsDataSection from './sections/results/ResultsDataSection';
import FurnaceReportSection from './sections/furnace_report/FurnaceReportSection';
import SpecificationsSection from './sections/specifications/SpecificationsSection';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';

const AfterTabContent = ({ formData, errors, loading, formHandlers, test, handleFileAssociationNeeded, viewMode = false, readOnlyFieldStyle = {} }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <CollapsibleSection
        title={t('tests.after.specifications.title')}
        isExpandedByDefault={true}
        sectionId="test-specifications"
        rememberState={false}
      >        <SpecificationsSection
          testNodeId={test ? test.id : null}
          parentId={formHandlers.parentId}
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
          formData={formData}
          parentId={formHandlers.parentId}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          getSelectedOption={formHandlers.getSelectedOption}
          lengthUnitOptions={formHandlers.lengthUnitOptions}
          hardnessUnitOptions={formHandlers.hardnessUnitOptions}
          handleResultBlocAdd={formHandlers.handleResultBlocAdd}
          handleResultBlocRemove={formHandlers.handleResultBlocRemove}
          handleHardnessResultAdd={formHandlers.handleHardnessResultAdd}
          handleHardnessResultRemove={formHandlers.handleHardnessResultRemove}
          handleEcdPositionAdd={formHandlers.handleEcdPositionAdd}
          handleEcdPositionRemove={formHandlers.handleEcdPositionRemove}
          handleEcdPositionChange={formHandlers.handleEcdPositionChange}
          loading={loading}          selectStyles={formHandlers.selectStyles}
          test={test}
          handleFileAssociationNeeded={handleFileAssociationNeeded}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
        />
      </CollapsibleSection>
    </>
  );
};

export default AfterTabContent;
