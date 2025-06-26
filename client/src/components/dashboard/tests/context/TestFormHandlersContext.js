// Context pour optimiser les handlers du formulaire de test
import React, { createContext, useContext, useMemo } from 'react';

const TestFormHandlersContext = createContext();

export const useTestFormHandlers = () => {
  const context = useContext(TestFormHandlersContext);
  if (!context) {
    throw new Error('useTestFormHandlers must be used within a TestFormHandlersProvider');
  }
  return context;
};

export const TestFormHandlersProvider = React.memo(({ children, formHandlers }) => {
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
    <TestFormHandlersContext.Provider value={memoizedHandlers}>
      {children}
    </TestFormHandlersContext.Provider>
  );
});

TestFormHandlersProvider.displayName = 'TestFormHandlersProvider';

export default TestFormHandlersContext;
