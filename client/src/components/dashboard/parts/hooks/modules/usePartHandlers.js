// usePartHandlers.js - Hook spécifique pour les pièces
import { useCallback } from 'react';
import useGlobalFormHandlers from '../../../../../hooks/useFormHandlers';

const usePartHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions = {}) => {
  // Récupérer les gestionnaires de formulaire globaux
  const globalHandlers = useGlobalFormHandlers(formData, setFormData, errors, setErrors, refreshOptionsFunctions);
  
  // Ici, pas de fonction spécifique pour les parts, on utilise uniquement les handlers globaux
  // Vous pouvez ajouter des fonctions spécifiques aux pièces si nécessaire
  
  return {
    ...globalHandlers
  };
};

export default usePartHandlers;