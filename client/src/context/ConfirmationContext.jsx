import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '../components/common/ConfirmationModal/ConfirmationModal';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

export const ConfirmationProvider = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'danger',
    size: 'md'
  });
  
  const [resolveRef, setResolveRef] = useState(null);

  const showConfirmation = useCallback(({
    title = "Confirmation",
    message = "Êtes-vous sûr de vouloir continuer ?",
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "danger",
    size = "md"
  }) => {
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
      setConfirmationState({
        show: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        size
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolveRef) {
      resolveRef(true);
    }
    setConfirmationState(prev => ({ ...prev, show: false }));
    setResolveRef(null);
  }, [resolveRef]);

  const handleCancel = useCallback(() => {
    if (resolveRef) {
      resolveRef(false);
    }
    setConfirmationState(prev => ({ ...prev, show: false }));
    setResolveRef(null);
  }, [resolveRef]);

  return (
    <ConfirmationContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationModal
        show={confirmationState.show}
        onHide={handleCancel}
        onConfirm={handleConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        variant={confirmationState.variant}
        size={confirmationState.size}
      />
    </ConfirmationContext.Provider>
  );
};
