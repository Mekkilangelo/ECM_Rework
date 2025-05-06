import React from 'react';
import { useTranslation } from 'react-i18next';
import ResultsDataSection from './ResultsDataSection';
import FurnaceReportSection from './FurnaceReportSection';
import SpecificationsSection from './SpecificationsSection';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';

const AfterTabContent = ({ formData, errors, loading, formHandlers, test, handleFileAssociationNeeded }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <CollapsibleSection
        title={t('tests.after.specifications.title')}
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
        title={t('tests.after.furnaceReport.title')}
        isExpandedByDefault={false}
        sectionId="test-furnace-report"
        rememberState={false}
        level={0}
      >
        <FurnaceReportSection
          testNodeId={test ? test.id : null}
          onFileAssociationNeeded={handleFileAssociationNeeded}
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
