import React from 'react';
import ResultsDataSection from './ResultsDataSection';
import FurnaceReportSection from './FurnaceReportSection'
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';

const AfterTabContent = ({ formData, errors, loading, formHandlers, test, handleFileAssociationNeeded }) => {
  return (
    <>
      <CollapsibleSection 
        title="Rapport du four" 
        isExpandedByDefault={true}
        sectionId="test-furnace-report"
        rememberState={false}
      >
        <FurnaceReportSection
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleFileAssociationNeeded}
        />
      </CollapsibleSection>

      <CollapsibleSection 
        title="Controle" 
        isExpandedByDefault={true}
        sectionId="test-results"
        rememberState={false}
      >
        <ResultsDataSection
          formData={formData}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          getSelectedOption={formHandlers.getSelectedOption}
          lengthUnitOptions={formHandlers.lengthUnitOptions}
          hardnessUnitOptions={formHandlers.hardnessUnitOptions}
          handleResultBlocAdd={formHandlers.handleResultBlocAdd}
          handleResultBlocRemove={formHandlers.handleResultBlocRemove}
          handleHardnessResultAdd={formHandlers.handleHardnessResultAdd}
          handleHardnessResultRemove={formHandlers.handleHardnessResultRemove}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
          test={test}
          handleFileAssociationNeeded={handleFileAssociationNeeded}
        />
      </CollapsibleSection>
    </>
  );
};

export default AfterTabContent;