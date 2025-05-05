// useTestHandlers.js - Hook spécifique pour les tests
import { useCallback } from 'react';
import useGlobalFormHandlers from '../../../../../hooks/useFormHandlers';

const useTestHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions = {}) => {
  // Récupérer les gestionnaires de formulaire globaux
  const globalHandlers = useGlobalFormHandlers(formData, setFormData, errors, setErrors, refreshOptionsFunctions);
  
  // Gestion du cycle thermique
  const handleThermalCycleAdd = useCallback(() => {
    const newStep = {
      step: (formData.recipeData?.thermalCycle?.length || 0) + 1,
      ramp: 'up',
      setpoint: '',
      duration: ''
    };
    
    // On n'utilise plus le handler global car on fait l'ajout directement ici
    setFormData(prev => ({
      ...prev,
      recipeData: {
        ...prev.recipeData,
        thermalCycle: [...(prev.recipeData?.thermalCycle || []), newStep]
      }
    }));
  }, [formData, setFormData]);
  
  const handleThermalCycleRemove = useCallback((index) => {
    // On n'utilise plus le handler global car on fait la suppression directement ici
    if (formData.recipeData?.thermalCycle?.length > 1) {
      const updatedThermalCycle = formData.recipeData.thermalCycle.filter((_, i) => i !== index);
      
      // Recalculer les étapes
      updatedThermalCycle.forEach((item, i) => {
        item.step = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        recipeData: {
          ...prev.recipeData,
          thermalCycle: updatedThermalCycle
        }
      }));
    }
  }, [formData, setFormData]);
  
  // Gestion du cycle chimique
  const handleChemicalCycleAdd = useCallback(() => {
    const newStep = {
      step: (formData.recipeData?.chemicalCycle?.length || 0) + 1,
      time: '',
      gas: '',
      debit: '',
      pressure: ''
    };
    
    setFormData(prev => ({
      ...prev,
      recipeData: {
        ...prev.recipeData,
        chemicalCycle: [...(prev.recipeData?.chemicalCycle || []), newStep]
      }
    }));
  }, [formData, setFormData]);
  
  const handleChemicalCycleRemove = useCallback((index) => {
    if (formData.recipeData?.chemicalCycle?.length > 1) {
      const updatedChemicalCycle = formData.recipeData.chemicalCycle.filter((_, i) => i !== index);
      
      // Recalculer les étapes
      updatedChemicalCycle.forEach((item, i) => {
        item.step = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        recipeData: {
          ...prev.recipeData,
          chemicalCycle: updatedChemicalCycle
        }
      }));
    }
  }, [formData, setFormData]);
  
  // Gestion de la trempe au gaz - vitesse
  const handleGasQuenchSpeedAdd = useCallback(() => {
    const newStep = {
      step: (formData.quenchData?.gasQuenchSpeed?.length || 0) + 1,
      duration: '',
      speed: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quenchData: {
        ...prev.quenchData,
        gasQuenchSpeed: [...(prev.quenchData?.gasQuenchSpeed || []), newStep]
      }
    }));
  }, [formData, setFormData]);
  
  const handleGasQuenchSpeedRemove = useCallback((index) => {
    if (formData.quenchData?.gasQuenchSpeed?.length > 1) {
      const updatedGasQuenchSpeed = formData.quenchData.gasQuenchSpeed.filter((_, i) => i !== index);
      
      // Recalculer les étapes
      updatedGasQuenchSpeed.forEach((item, i) => {
        item.step = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        quenchData: {
          ...prev.quenchData,
          gasQuenchSpeed: updatedGasQuenchSpeed
        }
      }));
    }
  }, [formData, setFormData]);
  
  // Gestion de la trempe au gaz - pression
  const handleGasQuenchPressureAdd = useCallback(() => {
    const newStep = {
      step: (formData.quenchData?.gasQuenchPressure?.length || 0) + 1,
      duration: '',
      pressure: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quenchData: {
        ...prev.quenchData,
        gasQuenchPressure: [...(prev.quenchData?.gasQuenchPressure || []), newStep]
      }
    }));
  }, [formData, setFormData]);
  
  const handleGasQuenchPressureRemove = useCallback((index) => {
    if (formData.quenchData?.gasQuenchPressure?.length > 1) {
      const updatedGasQuenchPressure = formData.quenchData.gasQuenchPressure.filter((_, i) => i !== index);
      
      // Recalculer les étapes
      updatedGasQuenchPressure.forEach((item, i) => {
        item.step = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        quenchData: {
          ...prev.quenchData,
          gasQuenchPressure: updatedGasQuenchPressure
        }
      }));
    }
  }, [formData, setFormData]);
  
  // Gestion de la trempe à l'huile
  const handleOilQuenchSpeedAdd = useCallback(() => {
    const newStep = {
      step: (formData.quenchData?.oilQuenchSpeed?.length || 0) + 1,
      duration: '',
      speed: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quenchData: {
        ...prev.quenchData,
        oilQuenchSpeed: [...(prev.quenchData?.oilQuenchSpeed || []), newStep]
      }
    }));
  }, [formData, setFormData]);
  
  const handleOilQuenchSpeedRemove = useCallback((index) => {
    if (formData.quenchData?.oilQuenchSpeed?.length > 1) {
      const updatedOilQuenchSpeed = formData.quenchData.oilQuenchSpeed.filter((_, i) => i !== index);
      
      // Recalculer les étapes
      updatedOilQuenchSpeed.forEach((item, i) => {
        item.step = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        quenchData: {
          ...prev.quenchData,
          oilQuenchSpeed: updatedOilQuenchSpeed
        }
      }));
    }
  }, [formData, setFormData]);

  // Gestion des résultats
  const handleResultBlocAdd = useCallback(() => {
    const newResult = {
      step: (formData.resultsData?.results?.length || 0) + 1,
      description: '',
      hardnessPoints: [{
        location: '',
        value: '',
        unit: ''
      }],
      ecd: {
        toothFlank: {
          distance: '',
          unit: ''
        },
        toothRoot: {
          distance: '',
          unit: ''
        }
      },
      comment: ''
    };
    
    setFormData(prev => ({
      ...prev,
      resultsData: {
        ...prev.resultsData,
        results: [...(prev.resultsData?.results || []), newResult]
      }
    }));
  }, [formData, setFormData]);
  
  const handleResultBlocRemove = useCallback((index) => {
    if (formData.resultsData?.results?.length > 1) {
      const updatedResults = formData.resultsData.results.filter((_, i) => i !== index);
      
      // Recalculer les étapes
      updatedResults.forEach((item, i) => {
        item.step = i + 1;
      });
      
      setFormData(prev => ({
        ...prev,
        resultsData: {
          ...prev.resultsData,
          results: updatedResults
        }
      }));
    }
  }, [formData, setFormData]);
  
  // Gestion des résultats de dureté
  const handleHardnessResultAdd = useCallback((resultIndex) => {
    setFormData(prev => {
      const updatedResults = [...(prev.resultsData?.results || [])];
      
      // Ajouter un nouveau point de dureté
      if (updatedResults[resultIndex]) {
        updatedResults[resultIndex].hardnessPoints = [
          ...(updatedResults[resultIndex].hardnessPoints || []),
          {
            location: '',
            value: '',
            unit: prev.resultsData?.hardnessResultUnit || '' // Utiliser l'unité par défaut si disponible
          }
        ];
      }
      
      return {
        ...prev,
        resultsData: {
          ...prev.resultsData,
          results: updatedResults
        }
      };
    });
  }, [setFormData]);
  
  const handleHardnessResultRemove = useCallback((resultIndex, hardnessIndex) => {
    setFormData(prev => {
      const updatedResults = [...(prev.resultsData?.results || [])];
      
      if (updatedResults[resultIndex]?.hardnessPoints?.length > 1) {
        updatedResults[resultIndex].hardnessPoints = 
          updatedResults[resultIndex].hardnessPoints.filter((_, i) => i !== hardnessIndex);
      }
      
      return {
        ...prev,
        resultsData: {
          ...prev.resultsData,
          results: updatedResults
        }
      };
    });
  }, [setFormData]);

  return {
    ...globalHandlers,
    handleThermalCycleAdd,
    handleThermalCycleRemove,
    handleChemicalCycleAdd,
    handleChemicalCycleRemove,
    handleGasQuenchSpeedAdd,
    handleGasQuenchSpeedRemove,
    handleGasQuenchPressureAdd,
    handleGasQuenchPressureRemove,
    handleOilQuenchSpeedAdd,
    handleOilQuenchSpeedRemove,
    handleResultBlocAdd,
    handleResultBlocRemove,
    handleHardnessResultAdd,
    handleHardnessResultRemove
  };
};

export default useTestHandlers;