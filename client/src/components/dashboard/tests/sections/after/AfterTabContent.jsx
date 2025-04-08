import React from 'react';
import ResultsDataSection from './ResultsDataSection';
import FurnaceReportSection from './FurnaceReportSection';
import SpecificationsSection from './SpecificationsSection';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';

const AfterTabContent = ({ formData, errors, loading, formHandlers, test, handleFileAssociationNeeded }) => {
  return (
    <>
      <CollapsibleSection 
        title="Spécifications de la pièce" 
        isExpandedByDefault={true}
        sectionId="test-specifications"
        rememberState={false}
      >
        <SpecificationsSection
          testNodeId={test ? test.id : null}
          parentId={formHandlers.parentId}
        />
      </CollapsibleSection>
          
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