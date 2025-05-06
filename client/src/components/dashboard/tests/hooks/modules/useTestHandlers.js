// useTestHandlers.js - Hook spécifique pour les tests
import { useCallback } from 'react';
import useGlobalFormHandlers from '../../../../../hooks/useFormHandlers';

const useTestHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions = {}) => {
  // Récupérer les gestionnaires de formulaire globaux
  const globalHandlers = useGlobalFormHandlers(formData, setFormData, errors, setErrors, refreshOptionsFunctions);
  
  // Extraire la fonction handleChange de globalHandlers
  const { handleChange } = globalHandlers;
  
  // Fonction pour déterminer automatiquement la direction de la rampe en fonction des températures
  const determineRampDirection = (currentTemp, previousTemp) => {
    if (!previousTemp) return 'up'; // Par défaut, commencer avec une rampe montante
    
    if (currentTemp > previousTemp) {
      return 'up'; // Température qui augmente = rampe montante
    } else if (currentTemp < previousTemp) {
      return 'down'; // Température qui diminue = rampe descendante
    } else {
      return 'continue'; // Température identique = maintien
    }
  };
  
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
  
  // Nouvelle fonction pour mettre à jour une valeur dans le cycle thermique et 
  // recalculer automatiquement les rampes si besoin
  const handleThermalCycleChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updatedThermalCycle = [...(prev.recipeData?.thermalCycle || [])];
      
      // Mettre à jour la valeur spécifique
      updatedThermalCycle[index] = { 
        ...updatedThermalCycle[index], 
        [field]: value 
      };
      
      // Si on modifie un point de consigne (setpoint), recalculer les directions de rampe
      if (field === 'setpoint') {
        // Convertir à un nombre pour les comparaisons
        const newTemp = parseFloat(value);
        
        // Recalculer les rampes pour toutes les étapes
        updatedThermalCycle.forEach((cycle, idx) => {
          // Pour la première étape ou si la température n'est pas définie, on laisse la rampe telle quelle
          if (idx === 0 || isNaN(newTemp)) {
            return;
          }
          
          // Pour l'étape qui vient d'être modifiée, on recalcule sa rampe en fonction de l'étape précédente
          if (idx === index) {
            const prevTemp = parseFloat(updatedThermalCycle[idx - 1].setpoint);
            if (!isNaN(prevTemp)) {
              cycle.ramp = determineRampDirection(newTemp, prevTemp);
            }
          } 
          // Pour l'étape suivante (si elle existe), on recalcule sa rampe car l'étape précédente a changé
          else if (idx === index + 1) {
            const prevTemp = parseFloat(updatedThermalCycle[idx - 1].setpoint);
            const currentTemp = parseFloat(cycle.setpoint);
            if (!isNaN(prevTemp) && !isNaN(currentTemp)) {
              cycle.ramp = determineRampDirection(currentTemp, prevTemp);
            }
          }
        });
      }
      
      return {
        ...prev,
        recipeData: {
          ...prev.recipeData,
          thermalCycle: updatedThermalCycle
        }
      };
    });
  }, [setFormData]);
  
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
    // Utiliser le callback de setState pour être sûr de travailler avec les données les plus récentes
    setFormData(prev => {
      const updatedResults = [...(prev.resultsData?.results || [])];
      
      // Ajouter un nouveau point de dureté
      if (updatedResults[resultIndex]) {
        // Créer un nouveau tableau de points de dureté pour éviter les problèmes de référence
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

  // Nouvelle fonction pour gérer les positions ECD
  const handleEcdPositionAdd = useCallback((resultIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    // S'assurer que l'objet ecd et son tableau de positions existent
    if (!updatedResults[resultIndex].ecd) {
      updatedResults[resultIndex].ecd = {
        hardnessValue: '',
        hardnessUnit: '',
        ecdPoints: []
      };
    }
    
    if (!updatedResults[resultIndex].ecd.ecdPoints) {
      updatedResults[resultIndex].ecd.ecdPoints = [];
    }
    
    // Ajouter une nouvelle position
    updatedResults[resultIndex].ecd.ecdPoints.push({
      name: '',
      distance: '',
      unit: ''
    });
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  }, [formData, handleChange]);
  
  const handleEcdPositionRemove = useCallback((resultIndex, positionIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    if (updatedResults[resultIndex].ecd?.ecdPoints && 
        updatedResults[resultIndex].ecd.ecdPoints.length > 1) {
      updatedResults[resultIndex].ecd.ecdPoints = 
        updatedResults[resultIndex].ecd.ecdPoints.filter((_, i) => i !== positionIndex);
      
      handleChange({
        target: {
          name: 'resultsData.results',
          value: updatedResults
        }
      });
    }
  }, [formData, handleChange]);

  const handleEcdPositionChange = (resultIndex, positionIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    
    // S'assurer que l'objet ecd et son tableau de positions existent
    if (!updatedResults[resultIndex].ecd) {
      updatedResults[resultIndex].ecd = {
        hardnessValue: '',
        hardnessUnit: '',
        ecdPoints: []
      };
    }
    
    if (!updatedResults[resultIndex].ecd.ecdPoints) {
      updatedResults[resultIndex].ecd.ecdPoints = [{ name: '', distance: '', unit: '' }];
    }
    
    // Mettre à jour le champ spécifique
    if (field === 'unit') {
      updatedResults[resultIndex].ecd.ecdPoints[positionIndex][field] = value ? value.value : '';
    } else {
      updatedResults[resultIndex].ecd.ecdPoints[positionIndex][field] = value;
    }
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  return {
    ...globalHandlers,
    handleThermalCycleAdd,
    handleThermalCycleRemove,
    handleThermalCycleChange,
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
    handleHardnessResultRemove,
    handleEcdPositionAdd,
    handleEcdPositionRemove,
    handleEcdPositionChange
  };
};

export default useTestHandlers;