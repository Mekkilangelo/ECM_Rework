import React from 'react';
import ResultsDataSection from './ResultsDataSection';

const AfterTabContent = ({ formData, errors, loading, formHandlers }) => {
  return (
    <div className="mt-4">
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
      />
    </div>
  );
};

export default AfterTabContent;