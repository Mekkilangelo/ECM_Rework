// Context pour optimiser les handlers du formulaire de trial
import React, { createContext, useContext, useMemo } from 'react';

const TrialFormHandlersContext = createContext();

export const useTrialFormHandlers = () => {
  const context = useContext(TrialFormHandlersContext);
  if (!context) {
    throw new Error('useTrialFormHandlers must be used within a TrialFormHandlersProvider');
  }
  return context;
};

export const TrialFormHandlersProvider = React.memo(({ children, formHandlers }) => {
  // Memoiser les handlers pour éviter les re-renders inutiles
  const memoizedHandlers = useMemo(() => formHandlers, [
    // Dépendances critiques seulement
    formHandlers.handleChange,
    formHandlers.handleSelectChange,
    formHandlers.handleMultiSelectChange,
    formHandlers.getSelectedOption,
    formHandlers.selectStyles
  ]);

  return (
    <TrialFormHandlersContext.Provider value={memoizedHandlers}>
      {children}
    </TrialFormHandlersContext.Provider>
  );
});

TrialFormHandlersProvider.displayName = 'TrialFormHandlersProvider';

export default TrialFormHandlersContext;
