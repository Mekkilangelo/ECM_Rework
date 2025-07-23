import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

/**
 * Hook pour gérer les données du tableau dynamique des courbes
 * Structure moderne: { distances: [0, 1, 2], series: [{name: "Courbe 1", values: [100, 120, 110]}] }
 */
export const useCurveDataTable = (onChange) => {
  // État initial propre avec une distance de base
  const getInitialState = () => ({
    distances: [0],
    series: []
  });

  const [curveData, setCurveData] = useState(getInitialState);
  const [distanceStep, setDistanceStep] = useState(1); // Pas de distance configurable
  const lastSentDataRef = useRef(null);
  const timeoutRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // Maintenir la référence à jour
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Fonction utilitaire pour déclencher les changements avec optimisation et debouncing
  const triggerChange = useCallback((newData) => {
    if (onChangeRef.current) {
      // Convertir les valeurs vides en 0 pour la sauvegarde
      const dataForSave = {
        ...newData,
        series: newData.series.map(serie => ({
          ...serie,
          values: serie.values.map(value => value === '' ? 0 : (parseFloat(value) || 0))
        }))
      };
      
      // Éviter les appels inutiles en comparant avec les dernières données envoyées
      const newDataString = JSON.stringify(dataForSave);
      if (lastSentDataRef.current !== newDataString) {
        lastSentDataRef.current = newDataString;
        
        // Debouncing pour éviter les appels trop fréquents
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          onChangeRef.current(dataForSave);
        }, 100); // 100ms de délai
      }
    }
  }, []); // Pas de dépendances pour éviter les re-créations

  // Ajouter une distance
  const addDistance = useCallback((distance = 0) => {
    setCurveData(prev => {
      const newDistances = [...prev.distances, distance];
      // Ajouter une valeur vide pour chaque série existante
      const newSeries = prev.series.map(serie => ({
        ...serie,
        values: [...serie.values, ''] // Valeur vide au lieu de 0
      }));
      
      const newData = {
        distances: newDistances,
        series: newSeries
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Supprimer une distance (mais garder au moins une distance)
  const removeDistance = useCallback((distanceIndex) => {
    setCurveData(prev => {
      if (prev.distances.length <= 1) return prev; // Garder au moins une distance
      
      const newDistances = prev.distances.filter((_, index) => index !== distanceIndex);
      // Supprimer la valeur correspondante dans chaque série
      const newSeries = prev.series.map(serie => ({
        ...serie,
        values: serie.values.filter((_, index) => index !== distanceIndex)
      }));
      
      const newData = {
        distances: newDistances,
        series: newSeries
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Mettre à jour une distance
  const updateDistance = useCallback((distanceIndex, newDistance) => {
    setCurveData(prev => {
      const newDistances = [...prev.distances];
      // Accepter les valeurs vides mais les traiter comme 0 en interne
      newDistances[distanceIndex] = newDistance === '' ? '' : (parseFloat(newDistance) || 0);
      
      const newData = {
        ...prev,
        distances: newDistances
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Ajouter une série (colonne)
  const addSeries = useCallback((name = '') => {
    setCurveData(prev => {
      const newSeries = [...prev.series, {
        name: name,
        values: new Array(prev.distances.length).fill('') // Valeurs vides au lieu de 0
      }];
      
      const newData = {
        ...prev,
        series: newSeries
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Supprimer une série
  const removeSeries = useCallback((seriesIndex) => {
    setCurveData(prev => {
      const newSeries = prev.series.filter((_, index) => index !== seriesIndex);
      
      const newData = {
        ...prev,
        series: newSeries
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Mettre à jour le nom d'une série
  const updateSeriesName = useCallback((seriesIndex, newName) => {
    setCurveData(prev => {
      const newSeries = [...prev.series];
      newSeries[seriesIndex] = {
        ...newSeries[seriesIndex],
        name: newName
      };
      
      const newData = {
        ...prev,
        series: newSeries
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Mettre à jour une valeur dans une série
  const updateSeriesValue = useCallback((seriesIndex, distanceIndex, newValue) => {
    setCurveData(prev => {
      const newSeries = [...prev.series];
      const newValues = [...newSeries[seriesIndex].values];
      // Garder la valeur telle quelle (vide ou numérique) dans l'interface
      newValues[distanceIndex] = newValue;
      
      newSeries[seriesIndex] = {
        ...newSeries[seriesIndex],
        values: newValues
      };
      
      const newData = {
        ...prev,
        series: newSeries
      };
      
      triggerChange(newData);
      return newData;
    });
  }, [triggerChange]);

  // Réinitialiser les données
  const resetData = useCallback(() => {
    const initialData = getInitialState();
    setCurveData(initialData);
    triggerChange(initialData);
  }, [triggerChange]);

  // Définir les données manuellement (pour import externe comme Excel)
  const setData = useCallback((newData) => {
    if (newData) {
      // Gérer la rétrocompatibilité avec l'ancien format {points: [...]}
      if (newData.points && Array.isArray(newData.points)) {
        // Convertir l'ancien format vers le nouveau
        const convertedData = convertOldFormatToNew(newData);
        setCurveData(convertedData);
        triggerChange(convertedData);
      } else if (newData.distances && newData.series) {
        // Nouveau format déjà correct
        setCurveData(newData);
        triggerChange(newData);
      } else {
        // Données vides ou invalides
        const initialData = getInitialState();
        setCurveData(initialData);
        triggerChange(initialData);
      }
    }
  }, [triggerChange]);

  // Fonction utilitaire pour convertir l'ancien format vers le nouveau
  const convertOldFormatToNew = useCallback((oldData) => {
    if (!oldData.points || !Array.isArray(oldData.points) || oldData.points.length === 0) {
      return getInitialState();
    }

    // Extraire les distances uniques
    const distances = [...new Set(oldData.points.map(p => parseFloat(p.distance) || 0))].sort((a, b) => a - b);
    
    // Extraire les noms de séries (colonnes autres que 'distance')
    const firstPoint = oldData.points[0];
    const seriesNames = Object.keys(firstPoint).filter(key => key !== 'distance');
    
    // Créer les séries
    const series = seriesNames.map(seriesName => {
      const values = distances.map(distance => {
        const point = oldData.points.find(p => parseFloat(p.distance) === distance);
        return point ? (point[seriesName] || '') : '';
      });
      
      return {
        name: seriesName,
        values: values
      };
    });

    return {
      distances: distances,
      series: series
    };
  }, []);

  // Import spécifique pour Excel (méthode dédiée pour la future fonctionnalité)
  const importFromExcel = useCallback((excelData) => {
    // Cette méthode sera utilisée spécifiquement pour l'import Excel
    // Elle ignore complètement le pas de distance et utilise les données telles qu'importées
    if (excelData && excelData.distances && excelData.series) {
      setCurveData(excelData);
      triggerChange(excelData);
      return true; // Succès
    }
    return false; // Échec
  }, [triggerChange]);

  // Fonction utilitaire pour convertir le nouveau format vers l'ancien pour la soumission
  const convertNewFormatToOld = useCallback((newData) => {
    if (!newData.distances || !newData.series || 
        !Array.isArray(newData.distances) || !Array.isArray(newData.series)) {
      return { points: [] };
    }

    const points = [];
    
    // Pour chaque distance, créer un point avec toutes les valeurs des séries
    newData.distances.forEach((distance, distanceIndex) => {
      const point = { distance: distance };
      
      // Ajouter les valeurs de chaque série pour cette distance
      newData.series.forEach(serie => {
        const value = serie.values[distanceIndex];
        // Convertir les valeurs vides en 0 pour la base de données
        point[serie.name] = (value === '' || value === null || value === undefined) ? 0 : parseFloat(value) || 0;
      });
      
      points.push(point);
    });

    return { points: points };
  }, []);

  // Exposer la fonction de conversion pour usage externe
  const getCurveDataForSubmission = useCallback(() => {
    return convertNewFormatToOld(curveData);
  }, [curveData, convertNewFormatToOld]);

  // Gérer le changement du pas de distance
  const handleDistanceStepChange = useCallback((newStep) => {
    const step = Math.max(0.01, parseFloat(newStep) || 0.01);
    setDistanceStep(step);
  }, []);

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    curveData,
    setCurveData: setData,
    addDistance,
    removeDistance,
    updateDistance,
    addSeries,
    removeSeries,
    updateSeriesName,
    updateSeriesValue,
    resetData,
    // Nouvelles fonctionnalités pour le pas
    distanceStep,
    onDistanceStepChange: handleDistanceStepChange,
    // Méthode pour l'import Excel (future fonctionnalité)
    importFromExcel,
    // Méthode pour la conversion vers l'ancien format (soumission)
    getCurveDataForSubmission
  };
};