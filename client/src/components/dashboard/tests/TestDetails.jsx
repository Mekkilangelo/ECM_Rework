import React from 'react';
import { Spinner, Alert } from 'react-bootstrap';
import TestForm from './TestForm';

/**
 * Composant d'affichage des détails d'un test en mode lecture seule
 * Réutilise le formulaire TestForm avec le mode viewMode activé
 */
const TestDetails = ({ testId, onClose }) => {
  if (!testId) {
    return <Alert variant="danger">ID de test invalide</Alert>;
  }

  return (
    <TestForm
      test={{ id: testId }}
      onClose={onClose}
      viewMode={true}
    />
  );
};

export default TestDetails;