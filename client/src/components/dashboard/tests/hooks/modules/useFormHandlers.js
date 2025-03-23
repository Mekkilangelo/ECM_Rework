const useFormHandlers = (formData, setFormData, errors, setErrors) => {
  // Gestionnaire d'événements pour les champs de formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Traiter les noms imbriqués (avec des points)
    if (name.includes('.')) {
      const parts = name.split('.');
      
      // Mise à jour de l'état avec une gestion des objets imbriqués
      setFormData(prevData => {
        const newData = { ...prevData };
        let current = newData;
        
        // Navigue dans l'objet jusqu'au dernier niveau
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Définit la valeur à la propriété finale
        current[parts[parts.length - 1]] = value;
        
        return newData;
      });
    } else {
      // Gestion des propriétés au niveau racine
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Efface les erreurs pour ce champ si nécessaire
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Gestionnaire pour les changements de Select
  const handleSelectChange = (selectedOption, { name }) => {
    // Gérer les propriétés imbriquées (avec notation par point)
    if (name.includes('.')) {
      const parts = name.split('.');
      
      setFormData(prevData => {
        const newData = { ...prevData };
        let current = newData;
        
        // Navigue dans l'objet jusqu'au dernier niveau
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Définit la valeur à la propriété finale
        current[parts[parts.length - 1]] = selectedOption ? selectedOption.value : null;
        
        return newData;
      });
    } else {
      // Gestion des propriétés au niveau racine
      setFormData(prevData => ({
        ...prevData,
        [name]: selectedOption ? selectedOption.value : null
      }));
    }
  };
  
  // Gestion du cycle thermique
  const handleThermalCycleAdd = () => {
    const newStep = {
      step: formData.recipeData.thermalCycle.length + 1,
      ramp: 'up',
      setpoint: '',
      duration: ''
    };
    
    setFormData(prev => ({
      ...prev,
      recipeData: {
        ...prev.recipeData,
        thermalCycle: [...prev.recipeData.thermalCycle, newStep]
      }
    }));
  };
  
  const handleThermalCycleRemove = (index) => {
    if (formData.recipeData.thermalCycle.length > 1) {
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
  };
  
  // Gestion du cycle chimique
  const handleChemicalCycleAdd = () => {
    const newStep = {
      step: formData.recipeData.chemicalCycle.length + 1,
      time: '',
      gas: '',
      debit: '',
      pressure: ''
    };
    
    setFormData(prev => ({
      ...prev,
      recipeData: {
        ...prev.recipeData,
        chemicalCycle: [...prev.recipeData.chemicalCycle, newStep]
      }
    }));
  };
  
  const handleChemicalCycleRemove = (index) => {
    if (formData.recipeData.chemicalCycle.length > 1) {
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
  };
  
  // Gestion de la trempe au gaz - vitesse
  const handleGasQuenchSpeedAdd = () => {
    const newStep = {
      step: formData.quenchData.gasQuenchSpeed.length + 1,
      duration: '',
      speed: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quenchData: {
        ...prev.quenchData,
        gasQuenchSpeed: [...prev.quenchData.gasQuenchSpeed, newStep]
      }
    }));
  };
  
  const handleGasQuenchSpeedRemove = (index) => {
    if (formData.quenchData.gasQuenchSpeed.length > 1) {
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
  };
  
  // Gestion de la trempe au gaz - pression
  const handleGasQuenchPressureAdd = () => {
    const newStep = {
      step: formData.quenchData.gasQuenchPressure.length + 1,
      duration: '',
      pressure: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quenchData: {
        ...prev.quenchData,
        gasQuenchPressure: [...prev.quenchData.gasQuenchPressure, newStep]
      }
    }));
  };
  
  const handleGasQuenchPressureRemove = (index) => {
    if (formData.quenchData.gasQuenchPressure.length > 1) {
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
  };
  
  // Gestion de la trempe à l'huile
  const handleOilQuenchSpeedAdd = () => {
    const newStep = {
      step: formData.quenchData.oilQuenchSpeed.length + 1,
      duration: '',
      speed: ''
    };
    
    setFormData(prev => ({
      ...prev,
      quenchData: {
        ...prev.quenchData,
        oilQuenchSpeed: [...prev.quenchData.oilQuenchSpeed, newStep]
      }
    }));
  };
  
  const handleOilQuenchSpeedRemove = (index) => {
    if (formData.quenchData.oilQuenchSpeed.length > 1) {
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
  };

  // Gestion des résultats
  const handleResultBlocAdd = () => {
    // Créer un nouveau bloc de résultat avec index incrémenté
    const newResult = {
      step: formData.resultsData.results.length + 1,
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
        results: [...prev.resultsData.results, newResult]
      }
    }));
  };
  
  const handleResultBlocRemove = (index) => {
    if (formData.resultsData.results.length > 1) {
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
  };
  
  // Gestion des résultats de dureté
  const handleHardnessResultAdd = (resultIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    // Ajouter un nouveau point de dureté
    updatedResults[resultIndex].hardnessPoints.push({
      location: '',
      value: '',
      unit: formData.resultsData.hardnessResultUnit || '' // Utiliser l'unité par défaut si disponible
    });
    
    setFormData(prev => ({
      ...prev,
      resultsData: {
        ...prev.resultsData,
        results: updatedResults
      }
    }));
  };
  
  const handleHardnessResultRemove = (resultIndex, hardnessIndex) => {
    const updatedResults = [...formData.resultsData.results];
    
    if (updatedResults[resultIndex].hardnessPoints.length > 1) {
      updatedResults[resultIndex].hardnessPoints = 
        updatedResults[resultIndex].hardnessPoints.filter((_, i) => i !== hardnessIndex);
        
      setFormData(prev => ({
        ...prev,
        resultsData: {
          ...prev.resultsData,
          results: updatedResults
        }
      }));
    }
  };

  return {
    handleChange,
    handleSelectChange,
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
    handleHardnessResultAdd,
    handleHardnessResultRemove,
    handleResultBlocAdd,
    handleResultBlocRemove
  };
};

export default useFormHandlers;