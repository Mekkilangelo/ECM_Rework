import React from 'react';
import { useState, useEffect, useImperativeHandle, forwardRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Nav, Table, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import testService from '../../../../../../../../../services/testService';
import { useRenderTracker } from '../../../../../../../../../utils/performanceMonitor';

// Enregistrement des composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Palette de 6 couleurs distinctes pour les courbes
const colorPalette = [
  { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },   // Rose
  { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },   // Turquoise
  { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' },   // Bleu
  { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' },   // Orange
  { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' }, // Violet
  { borderColor: 'rgb(255, 205, 86)', backgroundColor: 'rgba(255, 205, 86, 0.5)' }    // Jaune
];

const ResultCurveSection = React.memo(forwardRef(({
  result,
  resultIndex,
  sampleIndex,  // Ajout du sampleIndex
  curveData, // Nouvelle prop pour les données de courbe directes
  handleChange,
  handleSelectChange,
  getSelectedOption,
  hardnessUnitOptions,
  loading,
  selectStyles,
  test,
  // Ne pas passer formData entier, seulement les données nécessaires
  parentId,
  viewMode = false,
  readOnlyFieldStyle = {}
}, ref) => {
  const { t } = useTranslation();
  
  // Tracking des re-renders avec le hook existant
  useRenderTracker('ResultCurveSection');
  
  // Debug du prop result
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== RESULT PROP CHANGE [${resultIndex}-${sampleIndex}] ===`);
      console.log('result prop:', result);
      console.log('result.curveData:', result?.curveData);
      console.log('result.curveData.points length:', result?.curveData?.points?.length || 0);
      if (result?.curveData?.points?.length > 0) {
        console.log('First curve point:', result.curveData.points[0]);
      }
    }
  }, [result, resultIndex, sampleIndex]);
  
  // Memoisation des positions ECD pour éviter les recalculs - DOIT ÊTRE DÉCLARÉ EN PREMIER
  const ecdPositions = useMemo(() => {
    return result?.ecd?.ecdPoints || [];
  }, [result?.ecd?.ecdPoints]);

  // Memoisation de l'unité de dureté
  const hardnessUnit = useMemo(() => {
    return result?.ecd?.hardnessUnit || "HV";
  }, [result?.ecd?.hardnessUnit]);

  // Fonction utilitaire pour normaliser le nom d'une position (doit être cohérente avec useExcelImport)
  const normalizePositionName = useCallback((positionName) => {
    return positionName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  }, []);

  // Génère un nom de champ unique pour chaque position ECD - optimisé avec useCallback
  const getFieldNameForPosition = useCallback((positionName) => {
    // Normaliser le nom : supprimer espaces, caractères spéciaux et mettre en minuscules
    return normalizePositionName(positionName);
  }, [normalizePositionName]);

  // Obtenir la valeur de dureté pour une position et un point donné - optimisé avec useCallback
  const getHardnessForPosition = useCallback((point, positionName) => {
    const normalizedFieldName = getFieldNameForPosition(positionName);
    return point[normalizedFieldName] !== undefined ? point[normalizedFieldName] : '';
  }, [getFieldNameForPosition]);

  // Fonction pour normaliser la structure des points de courbe avant sauvegarde
  const normalizePointsForSave = useCallback((points) => {
    if (!points || points.length === 0) return [];
    return points.map(point => {
      const normalizedPoint = { distance: point.distance || '' };
      ecdPositions.forEach(position => {
        const normalizedFieldName = normalizePositionName(position.name);
        normalizedPoint[normalizedFieldName] = point[normalizedFieldName] !== undefined ? point[normalizedFieldName] : '';
      });
      return normalizedPoint;
    });
  }, [ecdPositions, normalizePositionName]);
  
  const [activeTab, setActiveTab] = useState('curve');// Structure de données pour les points de mesure
  const [dataPoints, setDataPoints] = useState([]);
  
  // État séparé pour l'affichage du tableau (données triées)
  const [displayPoints, setDisplayPoints] = useState([]);
    // Ref pour gérer le timeout de mise à jour du parent
  const updateParentTimeoutRef = React.useRef(null);
  
  // Nettoyage des timeouts au démontage du composant
  React.useEffect(() => {
    return () => {
      if (updateParentTimeoutRef.current) {
        clearTimeout(updateParentTimeoutRef.current);
        updateParentTimeoutRef.current = null;
      }
    };
  }, []);

  // Effet pour synchroniser les données quand result change (optimisé avec useMemo)
  const synchronizedData = useMemo(() => {
    // Utiliser la prop curveData directe en priorité, puis fallback sur result
    const curveDataSource = curveData || result?.curveData || result?.curve_data;
    
    if (curveDataSource && curveDataSource.points) {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== SYNCHRONISATION CURVE DATA ===');
        console.log(`ResultIndex: ${resultIndex}, SampleIndex: ${sampleIndex}`);
        console.log('Points bruts chargés:', curveDataSource.points.length);
        console.log('Source utilisée:', curveData ? 'curveData prop' : 'result prop');
        if (curveDataSource.points.length > 0) {
          const filteredKeys = Object.keys(curveDataSource.points[0]);
          console.log('Exemple de point brut:', curveDataSource.points[0]);
          console.log('Clés dans le point brut:', filteredKeys);
        }
      }
      // --- Synchronisation simple : ne pas nettoyer, juste copier les points ---
      const points = curveDataSource.points.map(point => ({ ...point }));
      // Trier les points pour l'affichage
      const sortedPoints = [...points].sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distA - distB;
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('Points synchronisés:', points.length);
        if (points.length > 0) {
          console.log('Exemple de point synchronisé:', points[0]);
          console.log('Clés dans le point synchronisé:', Object.keys(points[0]));
        }
      }
      return { points, sortedPoints };
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(`=== AUCUNE DONNÉE DE COURBE [${resultIndex}-${sampleIndex}] ===`);
        console.log('curveData prop:', curveData);
        console.log('result reçu:', result);
        console.log('result.curveData:', result?.curveData);
        console.log('result.curve_data:', result?.curve_data);
      }
      return { points: [], sortedPoints: [] };
    }
  }, [curveData, result?.curveData, result?.curve_data, resultIndex, sampleIndex]);
  // Effet pour mettre à jour les états locaux uniquement quand synchronizedData change
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== EFFECT UPDATE DATA POINTS [${resultIndex}-${sampleIndex}] ===`);
      console.log('synchronizedData.points:', synchronizedData.points);
      console.log('Nombre de points:', synchronizedData.points.length);
      console.log('Current dataPoints length:', dataPoints.length);
      console.log('Points equal?', JSON.stringify(synchronizedData.points) === JSON.stringify(dataPoints));
    }
    
    setDataPoints(synchronizedData.points);
    setDisplayPoints(synchronizedData.sortedPoints);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Updated dataPoints length:', synchronizedData.points.length);
    }
  }, [synchronizedData.points, synchronizedData.sortedPoints, resultIndex, sampleIndex]); // Ajout deps pour debug
    // Ajout du state pour le pas d'incrémentation
  const [stepValue, setStepValue] = useState(0.1);
  const [specData, setSpecData] = useState([]);
  
  // Log pour debugger les colonnes dynamiques (uniquement en dev et seulement si les positions changent)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && ecdPositions.length > 0) {
      // Mise à jour des positions ECD disponibles
    }
  }, [ecdPositions]);

  // Synchronise les dataPoints si les positions ECD changent (pour garantir que toutes les colonnes existent)
useEffect(() => {
  if (!ecdPositions || ecdPositions.length === 0 || dataPoints.length === 0) return;

  let changed = false;
  const updatedPoints = dataPoints.map(point => {
    const updatedPoint = { ...point };
    ecdPositions.forEach(position => {
      const normalizedFieldName = normalizePositionName(position.name);
      // Si la colonne n'existe pas, on tente de la remplir à partir d'autres formats ou on met une valeur vide
      if (
        updatedPoint[normalizedFieldName] === undefined &&
        updatedPoint[position.name] === undefined
      ) {
        // Cherche une valeur existante dans d'autres formats
        const value = point[position.name] || point[position.name.toLowerCase()] || point[`hardness_${normalizedFieldName}`] || '';
        updatedPoint[normalizedFieldName] = value;
        updatedPoint[position.name] = value;
        changed = true;
      }
    });
    return updatedPoint;
  });
  if (changed) {
    setDataPoints(updatedPoints);
    // Met à jour aussi displayPoints si besoin (trié)
    const sortedPoints = [...updatedPoints].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
    setDisplayPoints(sortedPoints);
  }
}, [ecdPositions, dataPoints, normalizePositionName]);
  
  // Memoizer la clé de cache pour les spécifications
  const specsKey = useMemo(() => {
    return test?.id && parentId ? `${test.id}-${parentId}` : null;
  }, [test?.id, parentId]);
    // Effet pour charger les spécifications ECD depuis l'API (avec deps optimisées)
  useEffect(() => {
    if (!specsKey) return;
    
    const fetchSpecData = async () => {
      try {
        // Appeler la nouvelle méthode du service pour récupérer les spécifications
        const response = await testService.getTestSpecs(test.id, parentId);
        if (process.env.NODE_ENV === 'development') {
          // Réponse du service getTestSpecs reçue
        }
        
        let specifications = null;
        
        // Extraction des spécifications selon la structure de réponse
        if (response && response.specifications) {
          specifications = typeof response.specifications === 'string' 
            ? JSON.parse(response.specifications) 
            : response.specifications;
        } else if (response && response.data && response.data.specifications) {
          specifications = typeof response.data.specifications === 'string'
            ? JSON.parse(response.data.specifications)
            : response.data.specifications;
        }
        
        if (specifications) {
          const specLines = [];
          
          // Nouveau format : traitement des spécifications ECD multiples
          if (specifications.ecdSpecs && Array.isArray(specifications.ecdSpecs)) {
              if (process.env.NODE_ENV === 'development') {
                // Spécifications ECD multiples trouvées
              }
              
              specifications.ecdSpecs.forEach((ecdSpec, index) => {
                if (ecdSpec.hardness && (ecdSpec.depthMin !== undefined || ecdSpec.depthMax !== undefined)) {
                  const depthMin = parseFloat(ecdSpec.depthMin) || 0.0;
                  const depthMax = parseFloat(ecdSpec.depthMax) || 1.0;
                  const hardnessValue = parseFloat(ecdSpec.hardness);
                  
                  // Créer une ligne de spécification pour cette ECD
                  const specLine = {
                    name: ecdSpec.name || `ECD ${index + 1}`,
                    points: [
                      { distance: depthMin, value: hardnessValue },
                      { distance: depthMax, value: hardnessValue }
                    ],
                    unit: ecdSpec.hardnessUnit || 'HV'
                  };
                  
                  specLines.push(specLine);
                }
              });
            }
            // Format ancien : compatibilité avec l'ancien format ECD unique
            else if (specifications.ecd && specifications.ecd.hardness) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Spécification ECD unique trouvée (format ancien):', specifications.ecd);
              }
              
              const depthMin = parseFloat(specifications.ecd.depthMin) || 0.0;
              const depthMax = parseFloat(specifications.ecd.depthMax) || 1.0;
              const hardnessValue = parseFloat(specifications.ecd.hardness);
              
              const specLine = {
                name: 'ECD',
                points: [
                  { distance: depthMin, value: hardnessValue },
                  { distance: depthMax, value: hardnessValue }
                ],
                unit: specifications.ecd.unit || 'HV'
              };
                specLines.push(specLine);
            }
              if (process.env.NODE_ENV === 'development') {
                // Lignes de spécification générées
              }
            setSpecData(specLines);
          } else {
            console.warn('Aucune spécification trouvée dans la réponse');
            setSpecData([]);
          }
        } catch (error) {
          console.error(t('tests.after.results.resultCurve.specError'), error);
          setSpecData([]);
        }
      };
    
    fetchSpecData();
  }, [specsKey, t]); // Dépendances optimisées  // Fonction utilitaire pour comparer les arrays de points sans références circulaires
  const arePointsEqual = useCallback((points1, points2) => {
    if (!points1 && !points2) return true;
    if (!points1 || !points2) return false;
    if (points1.length !== points2.length) return false;
    
    return points1.every((point1, index) => {
      const point2 = points2[index];
      if (!point1 && !point2) return true;
      if (!point1 || !point2) return false;
      
      // Comparer seulement les propriétés importantes, pas les références DOM
      const keys = Object.keys(point1).filter(key => 
        !key.startsWith('__') && 
        typeof point1[key] !== 'function' &&
        typeof point1[key] !== 'object' ||
        point1[key] === null
      );
      
      return keys.every(key => point1[key] === point2[key]);
    });
  }, []);

  // Mettre à jour le formData parent avec les nouvelles données (optimisé avec useCallback)
  const updateParentFormData = useCallback((newPoints) => {
    // Éviter les mises à jour en boucle en vérifiant si les données ont vraiment changé
    const currentPoints = result?.curveData?.points || [];
    
    if (arePointsEqual(currentPoints, newPoints)) {
      return; // Pas de changement, éviter la mise à jour
    }
    
    // Normaliser les points avant la sauvegarde
    const normalizedPoints = normalizePointsForSave(newPoints);
    
    // Debug : vérifier le format des données avant sauvegarde
    if (process.env.NODE_ENV === 'development' && normalizedPoints.length > 0) {
      console.log('=== DEBUG SAUVEGARDE CURVE DATA ===');
      console.log(`Path: resultsData.results[${resultIndex}].samples[${sampleIndex}].curveData`);
      console.log('Nombre de points:', normalizedPoints.length);
      console.log('Exemple de point normalisé (premier):', normalizedPoints[0]);
      console.log('Clés disponibles dans le point normalisé:', Object.keys(normalizedPoints[0]));
      console.log('Positions ECD définies:', ecdPositions.map(p => p.name));
      
      // Vérifier que chaque point a les bonnes propriétés
      normalizedPoints.forEach((point, index) => {
        if (index < 3) { // Vérifier seulement les 3 premiers points pour éviter trop de logs
          ecdPositions.forEach(position => {
            const normalizedName = normalizePositionName(position.name);
            const hasNormalized = point.hasOwnProperty(normalizedName);
            const hasOriginal = point.hasOwnProperty(position.name);
            const value = point[normalizedName] || point[position.name] || '';
            
            console.log(`Point ${index}, Position "${position.name}": normalized(${normalizedName})=${hasNormalized}, original=${hasOriginal}, value="${value}"`);
          });
        }
      });
    }
    
    // Créer l'objet de changement pour le parent
    const changeEvent = {
      target: {
        name: `resultsData.results[${resultIndex}].samples[${sampleIndex}].curveData`,
        value: { points: normalizedPoints }
      }
    };
    
    // Debug : vérifier l'objet de changement complet
    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG CHANGE EVENT ===');
      console.log('Full change event:', changeEvent);
      console.log('Expected path:', `resultsData.results[${resultIndex}].samples[${sampleIndex}].curveData`);
      console.log('resultIndex:', resultIndex);
      console.log('sampleIndex:', sampleIndex);
      console.log('Points being sent:', normalizedPoints.length);
      console.log('First point being sent:', normalizedPoints[0]);
    }
    
    // Appeler handleChange directement sans setTimeout pour éviter les boucles
    try {
      handleChange(changeEvent);
      
      // Debug : confirmer que handleChange a été appelé
      if (process.env.NODE_ENV === 'development') {
        console.log('handleChange called successfully for curve data');
      }
    } catch (error) {
      console.error('Error updating parent form data:', error);
    }
  }, [handleChange, resultIndex, sampleIndex, arePointsEqual, ecdPositions, normalizePositionName, normalizePointsForSave, result?.curveData?.points]);

  // Mise à jour d'un point de données (pendant la saisie) - optimisé avec useCallback et throttle
  const handlePointChange = useCallback((index, field, value) => {
    setDataPoints(prevPoints => {
      const newPoints = [...prevPoints];
      
      // Vérifier si la valeur a vraiment changé
      if (newPoints[index] && newPoints[index][field] === value) {
        return prevPoints; // Pas de changement, éviter la mise à jour
      }
      
      newPoints[index] = { ...newPoints[index], [field]: value };
      
      // Débouncer la mise à jour du parent pour éviter trop de mises à jour
      if (updateParentTimeoutRef.current) {
        clearTimeout(updateParentTimeoutRef.current);
      }
      updateParentTimeoutRef.current = setTimeout(() => {
        updateParentFormData(newPoints);
      }, 500); // Augmenter le délai à 500ms pour plus de stabilité
      
      return newPoints;
    });
  }, [updateParentFormData]);

  // Mettre à jour la valeur de dureté pour une position et un point donné - optimisé avec useCallback
  const setHardnessForPosition = useCallback((index, positionName, value) => {
    const normalizedFieldName = getFieldNameForPosition(positionName);
    handlePointChange(index, normalizedFieldName, value);
  }, [getFieldNameForPosition, handlePointChange]);

  // Gestion du changement de la valeur du pas - optimisé avec useCallback
  const handleStepChange = useCallback((e) => {
    setStepValue(parseFloat(e.target.value) || 0.1);
  }, []);    // Trier les données après la fin de la saisie - optimisé avec useCallback
  const handleBlur = useCallback(() => {
    // Annuler le timeout en cours et mettre à jour immédiatement
    if (updateParentTimeoutRef.current) {
      clearTimeout(updateParentTimeoutRef.current);
      updateParentTimeoutRef.current = null;
    }
    
    setDataPoints(prevPoints => {
      // Trier les points par distance
      const sorted = [...prevPoints].sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distA - distB;
      });
      
      // Mettre à jour l'affichage et les données parent immédiatement
      setDisplayPoints(sorted);
      updateParentFormData(sorted);
      return sorted;
    });
  }, [updateParentFormData]);  // Ajouter un nouveau point de données avec incrémentation automatique - optimisé avec useCallback
  const addDataPoint = useCallback((customData = null) => {
    setDataPoints(prevPoints => {
      let nextDistance = '';
      // Calculer la prochaine distance en ajoutant le pas à la dernière valeur
      if (prevPoints.length > 0 && !customData) {
        const sortedPoints = [...prevPoints].sort((a, b) => {
          const distA = parseFloat(a.distance) || 0;
          const distB = parseFloat(b.distance) || 0;
          return distB - distA; // Tri décroissant pour avoir la plus grande valeur en premier
        });
        const lastDistance = parseFloat(sortedPoints[0].distance) || 0;
        nextDistance = (lastDistance + stepValue).toFixed(2); // Arrondir à 2 décimales
      }
      
      // Créer un nouveau point avec champs pour toutes les positions ECD
      const newPoint = {
        distance: customData ? customData.distance : nextDistance
      };
      
      // Ajouter un champ pour chaque position ECD
      ecdPositions.forEach(position => {
        const normalizedFieldName = getFieldNameForPosition(position.name);
        newPoint[normalizedFieldName] = customData && customData[normalizedFieldName] ? customData[normalizedFieldName] : '';
      });
      
      const newPoints = [...prevPoints, newPoint];
      setDisplayPoints(newPoints);
      
      // Utiliser un timeout pour éviter les conflits avec d'autres mises à jour
      setTimeout(() => {
        updateParentFormData(newPoints);
      }, 100);
      
      return newPoints;
    });
  }, [ecdPositions, stepValue, updateParentFormData, getFieldNameForPosition]);    // Ajouter plusieurs points de données en une fois (pour l'import Excel) - optimisé avec useCallback
  const addMultipleDataPoints = useCallback((pointsData) => {
    if (!pointsData || pointsData.length === 0) return;
    setDataPoints(prevPoints => {
      const newPoints = pointsData.map(pointData => {
        const newPoint = {
          distance: pointData.distance || ''
        };
        ecdPositions.forEach(position => {
          const normalizedFieldName = getFieldNameForPosition(position.name);
          newPoint[normalizedFieldName] = pointData[normalizedFieldName] !== undefined ? pointData[normalizedFieldName] : '';
        });
        return newPoint;
      });
      const allPoints = [...prevPoints, ...newPoints];
      const sortedPoints = allPoints.sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distA - distB;
      });
      setDisplayPoints(sortedPoints);
      updateParentFormData(sortedPoints);
      return sortedPoints;
    });
  }, [ecdPositions, updateParentFormData, getFieldNameForPosition]);
  // Supprimer un point de données - optimisé avec useCallback
  const removeDataPoint = useCallback((index) => {
    setDataPoints(prevPoints => {
      const newPoints = prevPoints.filter((_, i) => i !== index);
      setDisplayPoints(newPoints);
      
      // Utiliser un timeout pour éviter les conflits avec d'autres mises à jour
      setTimeout(() => {
        updateParentFormData(newPoints);
      }, 100);
      
      return newPoints;
    });
  }, [updateParentFormData]);

  // Exposer les méthodes au composant parent via ref
  useImperativeHandle(ref, () => ({
    addDataPoint,
    addMultipleDataPoints,
    removeDataPoint,
    // Nouvelle méthode pour forcer la synchro immédiate des points locaux vers le parent
    flushCurveDataToParent: () => {
      updateParentFormData(dataPoints);
    }
  }));

  // Préparer les données pour le graphique - optimisé avec useMemo
  const chartData = useMemo(() => {
    // Utiliser des points triés pour le graphique
    const sortedPoints = [...dataPoints].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
    
    // Créer un dataset pour chaque position ECD
    const datasets = ecdPositions.map((position, index) => {
      const positionName = position.name;
      const colorIndex = index % colorPalette.length; // Utiliser l'opérateur modulo pour recycler les couleurs si plus de 6 positions
      
      // Filtrer les points valides pour cette position
      const validPoints = sortedPoints.filter(p => 
        p.distance && getHardnessForPosition(p, positionName)
      );
      
      return {
        label: positionName,
        data: validPoints.map(p => ({
          x: parseFloat(p.distance), 
          y: parseFloat(getHardnessForPosition(p, positionName))
        })),
        borderColor: colorPalette[colorIndex].borderColor,
        backgroundColor: colorPalette[colorIndex].backgroundColor,
        tension: 0.1
      };
    });
    
    // Pour maintenir la compatibilité avec le format d'affichage précédent
    if (datasets.length === 0 && (
      sortedPoints.some(p => p.flankHardness) || 
      sortedPoints.some(p => p.rootHardness)
    )) {
      // Ajouter les anciens datasets si aucun nouveau n'a été créé
      const flankPoints = sortedPoints.filter(p => p.distance && p.flankHardness);
      const rootPoints = sortedPoints.filter(p => p.distance && p.rootHardness);
      
      if (flankPoints.length > 0) {
        datasets.push({
          label: t('tests.after.results.resultCurve.flankHardness'),
          data: flankPoints.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.flankHardness)})),
          borderColor: colorPalette[0].borderColor,
          backgroundColor: colorPalette[0].backgroundColor,
          tension: 0.1
        });
      }
      
      if (rootPoints.length > 0) {
        datasets.push({
          label: t('tests.after.results.resultCurve.rootHardness'),
          data: rootPoints.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.rootHardness)})),
          borderColor: colorPalette[1].borderColor,
          backgroundColor: colorPalette[1].backgroundColor,
          tension: 0.1
        });
      }
    }

    // Ajouter les courbes de spécification si disponibles
    if (specData && specData.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        // Ajout des données de spécification à la courbe
      }
      
      specData.forEach((spec, index) => {
        if (spec.points && spec.points.length > 0) {
          datasets.push({
            label: `${t('tests.after.results.resultCurve.specification')} - ${spec.name}`,
            data: spec.points.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.value)})),
            borderColor: 'rgb(0, 0, 0)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderDash: [5, 5],
            tension: 0,
            pointRadius: 3,
            pointHoverRadius: 5
          });
        }
      });
    }
    
    return { datasets };
  }, [dataPoints, ecdPositions, getHardnessForPosition, specData, t]);
    // Options pour le graphique - optimisé avec useMemo
  const chartOptions = useMemo(() => ({
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: t('tests.after.results.resultCurve.distanceMm')
        }
      },
      y: {
        title: {
          display: true,
          text: t('tests.after.results.resultCurve.hardnessWithUnit', { unit: hardnessUnit })
        }
      }
    }
  }), [t, hardnessUnit]);
  
  // Générer les en-têtes dynamiques pour le tableau
  const renderTableHeaders = () => {
    const headers = [
      <th key="distance" style={{ width: `${25}%` }}>{t('tests.after.results.resultCurve.distanceMm')}</th>
    ];
    
    // Ajouter un en-tête pour chaque position ECD
    ecdPositions.forEach((position, index) => {
      const widthPercentage = ecdPositions.length <= 3 ? 
        Math.floor(60 / ecdPositions.length) : 
        Math.floor(75 / ecdPositions.length);
      
      headers.push(
        <th key={`hardness-${index}`} style={{ width: `${widthPercentage}%` }}>
          {position.name}
        </th>
      );
    });
    
    headers.push(
      <th key="actions" style={{ width: '15%' }}>{t('common.actions')}</th>
    );
    
    return headers;
  };
  
  // Générer les cellules de données pour chaque position
  const renderDataCells = (point, index) => {
    const cells = [
      <td key={`distance-${index}`}>
        <Form.Control
          type="number"
          value={point.distance}
          onChange={(e) => handlePointChange(index, 'distance', e.target.value)}
          onBlur={handleBlur}
          placeholder={t('tests.after.results.resultCurve.distance')}
          disabled={loading || viewMode}
          readOnly={viewMode}
          style={viewMode ? readOnlyFieldStyle : {}}
        />
      </td>
    ];
    
    // Ajouter une cellule pour chaque position ECD
    ecdPositions.forEach((position, posIndex) => {
      const positionName = position.name;
      cells.push(
        <td key={`hardness-${index}-${posIndex}`}>
          <Form.Control
            type="number"
            value={getHardnessForPosition(point, positionName) || ''}
            onChange={(e) => setHardnessForPosition(index, positionName, e.target.value)}
            onBlur={handleBlur}
            placeholder={`${positionName}`}
            disabled={loading || viewMode}
            readOnly={viewMode}
            style={viewMode ? readOnlyFieldStyle : {}}
          />
        </td>
      );
    });
    
    // Ajouter la cellule pour les actions
    cells.push(
      <td key={`actions-${index}`} className="text-center">
        {!viewMode && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => removeDataPoint(index)}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
      </td>
    );
    
    return cells;
  };
  
  // Si aucune position ECD n'est définie, afficher un message
  const noPositionsAlert = () => (
    <div className="alert alert-info mt-3">
      {t('tests.after.results.resultCurve.noPositions', 'Please define ECD positions in the previous section to generate curve data')}
    </div>
  );
  
  return (
    <Tab.Container id="result-curve-tabs" activeKey={activeTab} onSelect={k => setActiveTab(k)}>
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="curve">{t('tests.after.results.resultCurve.curve')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="data">{t('tests.after.results.resultCurve.data')}</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>        <Tab.Pane eventKey="curve">
          <div style={{ height: '400px' }}>
            {dataPoints.length > 0 && (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
        </Tab.Pane>
        <Tab.Pane eventKey="data">
          {ecdPositions.length === 0 ? noPositionsAlert() : (
            <>
              <div className="mb-3">
                <div><label>{t('tests.after.results.resultCurve.incrementStep')}</label></div>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: '150px' }}
                  value={stepValue}
                  onChange={handleStepChange}
                  disabled={loading}
                />
              </div>
              <Table responsive bordered size="sm" className="mt-2 mb-3">
                <thead className="bg-light">
                  <tr>
                    {renderTableHeaders()}
                  </tr>
                </thead>
                <tbody>
                  {dataPoints.map((point, index) => (
                    <tr key={`point-${index}`}>
                      {renderDataCells(point, index)}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="text-end">
                {!viewMode && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={addDataPoint}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.resultCurve.addPoint')}
                  </Button>
                )}
              </div>
            </>
          )}
        </Tab.Pane>
      </Tab.Content>    </Tab.Container>  );
}), (prevProps, nextProps) => {
  // Custom comparison function pour optimiser les re-rendus
  // Ne re-rendre que si les props qui nous intéressent ont changé
  return (
    prevProps.result === nextProps.result &&
    prevProps.resultIndex === nextProps.resultIndex &&
    prevProps.sampleIndex === nextProps.sampleIndex &&
    prevProps.loading === nextProps.loading &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.test?.id === nextProps.test?.id &&
    prevProps.parentId === nextProps.parentId
  );
});

export default ResultCurveSection;
