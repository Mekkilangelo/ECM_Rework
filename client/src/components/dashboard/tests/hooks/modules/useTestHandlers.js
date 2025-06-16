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
      samples: [
        {
          step: 1,
          description: '',
          hardnessPoints: [{
            location: '',
            value: '',
            unit: ''
          }],
          ecd: {
            hardnessValue: '',
            hardnessUnit: '',
            toothFlank: {
              distance: '',
              unit: ''
            },
            toothRoot: {
              distance: '',
              unit: ''
            },
            ecdPoints: [{ name: '', distance: '', unit: '' }]
          },
          hardnessUnit: 'HV',
          curveData: { points: [] }
        }
      ]
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
    }  }, [formData, setFormData]);

  // Gestion des échantillons
  const handleSampleAdd = useCallback((resultIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    const newSample = {
      step: (updatedResults[resultIndex].samples?.length || 0) + 1,
      description: '',
      hardnessPoints: [{
        location: '',
        value: '',
        unit: ''
      }],
      ecd: {
        hardnessValue: '',
        hardnessUnit: '',
        toothFlank: {
          distance: '',
          unit: ''
        },
        toothRoot: {
          distance: '',
          unit: ''
        },
        ecdPoints: [{ name: '', distance: '', unit: '' }]
      },
      hardnessUnit: 'HV',
      curveData: { points: [] }
    };
    
    updatedResults[resultIndex].samples = [...(updatedResults[resultIndex].samples || []), newSample];
    
    setFormData(prev => ({
      ...prev,
      resultsData: {
        ...prev.resultsData,
        results: updatedResults
      }
    }));
  }, [formData, setFormData]);

  const handleSampleRemove = useCallback((resultIndex, sampleIndex) => {
    if (formData.resultsData?.results?.[resultIndex]?.samples?.length > 1) {
      const updatedResults = [...formData.resultsData.results];
      const updatedSamples = updatedResults[resultIndex].samples.filter((_, i) => i !== sampleIndex);
      
      // Recalculer les étapes
      updatedSamples.forEach((item, i) => {
        item.step = i + 1;
      });
      
      updatedResults[resultIndex].samples = updatedSamples;
      
      setFormData(prev => ({
        ...prev,
        resultsData: {
          ...prev.resultsData,
          results: updatedResults
        }
      }));
    }  }, [formData, setFormData]);
  
  // Gestion des résultats de dureté (mis à jour pour les échantillons)
  const handleHardnessResultAdd = useCallback((resultIndex, sampleIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    // Ajouter un nouveau point de dureté au bon échantillon
    if (updatedResults[resultIndex]?.samples?.[sampleIndex]) {
      updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = [
        ...(updatedResults[resultIndex].samples[sampleIndex].hardnessPoints || []),
        {
          location: '',
          value: '',
          unit: formData.resultsData?.hardnessResultUnit || '' // Utiliser l'unité par défaut si disponible
        }
      ];
    }
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }    });
  }, [formData, handleChange]);
  
  const handleHardnessResultRemove = useCallback((resultIndex, sampleIndex, hardnessIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    if (updatedResults[resultIndex]?.samples?.[sampleIndex]?.hardnessPoints?.length > 1) {
      updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = 
        updatedResults[resultIndex].samples[sampleIndex].hardnessPoints.filter((_, i) => i !== hardnessIndex);
    }
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  }, [formData, handleChange]);
  // Nouvelle fonction pour gérer les positions ECD (mis à jour pour les échantillons)
  const handleEcdPositionAdd = useCallback((resultIndex, sampleIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    // S'assurer que l'objet ecd et son tableau de positions existent
    if (!updatedResults[resultIndex].samples[sampleIndex].ecd) {
      updatedResults[resultIndex].samples[sampleIndex].ecd = {
        hardnessValue: '',
        hardnessUnit: '',
        ecdPoints: []
      };
    }
    
    if (!updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints) {
      updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints = [];
    }
    
    // Ajouter une nouvelle position
    updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints.push({
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
  
  const handleEcdPositionRemove = useCallback((resultIndex, sampleIndex, positionIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    if (updatedResults[resultIndex].samples[sampleIndex].ecd?.ecdPoints && 
        updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints.length > 1) {
      updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints = 
        updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints.filter((_, i) => i !== positionIndex);
      
      handleChange({
        target: {
          name: 'resultsData.results',
          value: updatedResults
        }
      });
    }
  }, [formData, handleChange]);

  const handleEcdPositionChange = (resultIndex, sampleIndex, positionIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    
    // S'assurer que l'objet ecd et son tableau de positions existent
    if (!updatedResults[resultIndex].samples[sampleIndex].ecd) {
      updatedResults[resultIndex].samples[sampleIndex].ecd = {        hardnessValue: '',
        hardnessUnit: '',
        ecdPoints: []
      };
    }
    
    if (!updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints) {
      updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints = [{ name: '', distance: '', unit: '' }];
    }
    
    // Mettre à jour le champ spécifique
    if (field === 'unit') {
      updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints[positionIndex][field] = value ? value.value : '';
    } else {
      updatedResults[resultIndex].samples[sampleIndex].ecd.ecdPoints[positionIndex][field] = value;
    }
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonctions de conversion de temps pour les champs h/min/s
  const convertSecondsToHMS = useCallback((totalSeconds) => {
    if (!totalSeconds || totalSeconds === '') {
      return { hours: '', minutes: '', seconds: '' };
    }
    
    const total = parseInt(totalSeconds, 10);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    
    return {
      hours: hours > 0 ? hours.toString() : '',
      minutes: minutes > 0 ? minutes.toString() : '',
      seconds: seconds > 0 ? seconds.toString() : ''
    };
  }, []);
  
  const convertHMSToSeconds = useCallback((hours, minutes, seconds) => {
    const h = parseInt(hours || '0', 10);
    const m = parseInt(minutes || '0', 10);
    const s = parseInt(seconds || '0', 10);
    
    const totalSeconds = (h * 3600) + (m * 60) + s;
    return totalSeconds > 0 ? totalSeconds.toString() : '';
  }, []);
  
  // Gestionnaires pour les champs de temps décomposés
  const handleTimeComponentChange = useCallback((fieldBase, component, value) => {
    setFormData(prev => {
      const currentData = prev.recipeData || {};
      const currentHours = currentData[`${fieldBase}Hours`] || '';
      const currentMinutes = currentData[`${fieldBase}Minutes`] || '';
      const currentSeconds = currentData[`${fieldBase}Seconds`] || '';
      
      let newHours = currentHours;
      let newMinutes = currentMinutes;
      let newSecondsValue = currentSeconds;
      
      switch (component) {
        case 'hours':
          newHours = value;
          break;
        case 'minutes':
          newMinutes = value;
          break;
        case 'seconds':
          newSecondsValue = value;
          break;
      }
      
      // Convertir en secondes totales pour le stockage
      const totalSeconds = convertHMSToSeconds(newHours, newMinutes, newSecondsValue);
      
      return {
        ...prev,
        recipeData: {
          ...currentData,
          [fieldBase]: totalSeconds,
          [`${fieldBase}Hours`]: newHours,
          [`${fieldBase}Minutes`]: newMinutes,
          [`${fieldBase}Seconds`]: newSecondsValue
        }
      };
    });
  }, [setFormData, convertHMSToSeconds]);
  
  // Fonction pour initialiser les champs décomposés depuis la valeur en secondes
  const initializeTimeComponents = useCallback((fieldBase, totalSeconds) => {
    const { hours, minutes, seconds } = convertSecondsToHMS(totalSeconds);
    
    setFormData(prev => ({
      ...prev,
      recipeData: {
        ...prev.recipeData,
        [`${fieldBase}Hours`]: hours,
        [`${fieldBase}Minutes`]: minutes,
        [`${fieldBase}Seconds`]: seconds
      }
    }));
  }, [setFormData, convertSecondsToHMS]);
  
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
    handleSampleAdd,
    handleSampleRemove,
    handleHardnessResultAdd,
    handleHardnessResultRemove,
    handleEcdPositionAdd,
    handleEcdPositionRemove,
    handleEcdPositionChange,
    convertSecondsToHMS,
    convertHMSToSeconds,
    handleTimeComponentChange,
    initializeTimeComponents
  };
};

export default useTestHandlers;