import React, { forwardRef, useImperativeHandle, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from 'react-bootstrap';
import CollapsibleSection from '../../../../../../../../common/CollapsibleSection/CollapsibleSection';
import { useCurveDataTable } from './hooks/useCurveDataTable';
import CurveDataTable from './components/CurveDataTable';
import CurveChart from './components/CurveChart';

/**
 * ResultCurveSection - Version moderne et simplifiée
 * 
 * Structure de données :
 * {
 *   distances: [0, 1, 2, 3, 4],  // Liste des distances
 *   series: [
 *     {
 *       name: "Courbe 1",
 *       values: [100, 120, 110, 105, 95]  // Autant de valeurs que de distances
 *     },
 *     {
 *       name: "Position X",
 *       values: [95, 115, 105, 100, 90]   // '' pour champ vide, 0 en base
 *     }
 *   ]
 * }
 * 
 * Fonctionnalités :
 * - Pas de distance configurable (min: 0.01mm)
 * - Placeholders dynamiques avec nom de la courbe
 * - Champs vides permis (traités comme 0 en base)
 * - Import Excel prévu (ignore le pas, utilise les distances importées)
 * - Interface de configuration masquable
 * - Rétrocompatibilité avec l'ancien format {points: [...]}
 * - Conversion automatique pour la soumission API
 * - Initialisation depuis formData.resultsData
 */
const ResultCurveSection = forwardRef(({
  trialNodeId,
  resultIndex = 0,
  sampleIndex = 0,
  formData,
  handleChange,
  viewMode = false,
  readOnlyFieldStyle = {},
  unit = 'HV',
  specifications
}, ref) => {
  const { t } = useTranslation();

  // Mémoriser le callback pour éviter les re-créations inutiles
  const handleCurveDataChange = useCallback((newData) => {
    if (handleChange) {
      // Utiliser une approche directe plutôt que la notation par point
      // pour gérer correctement les indices de tableau
      const updatedResultsData = {
        ...formData.resultsData,
        results: formData.resultsData.results.map((result, rIndex) => {
          if (rIndex === resultIndex) {
            return {
              ...result,
              samples: result.samples.map((sample, sIndex) => {
                if (sIndex === sampleIndex) {
                  return {
                    ...sample,
                    curveData: newData
                  };
                }
                return sample;
              })
            };
          }
          return result;
        })
      };
      
      handleChange({
        target: {
          name: 'resultsData',
          value: updatedResultsData
        }
      });
    }
  }, [handleChange, resultIndex, sampleIndex, formData.resultsData]);

  // Hook pour gérer les données du tableau avec nouveau fonctionnement propre
  const {
    curveData,
    setCurveData,
    addDistance,
    removeDistance,
    updateDistance,
    addSeries,
    removeSeries,
    updateSeriesName,
    updateSeriesValue,
    resetData,
    distanceStep,
    onDistanceStepChange,
    importFromExcel,
    getCurveDataForSubmission
  } = useCurveDataTable(handleCurveDataChange);

  // Initialiser les données depuis formData lors du premier rendu UNIQUEMENT
  React.useEffect(() => {
    const existingCurveData = formData?.resultsData?.results?.[resultIndex]?.samples?.[sampleIndex]?.curveData;
    
    // TOUJOURS charger les données si elles existent, même si des données locales sont présentes
    if (existingCurveData) {
      // Les données devraient maintenant être directement au nouveau format
      // Utiliser hasOwnProperty pour vérifier la présence des propriétés, pas leur contenu
      if (existingCurveData.hasOwnProperty('distances') && existingCurveData.hasOwnProperty('series')) {
        setCurveData({
          distances: Array.isArray(existingCurveData.distances) ? existingCurveData.distances : [],
          series: Array.isArray(existingCurveData.series) ? existingCurveData.series : []
        });
      } else if (existingCurveData.points) {
        // Migration des anciennes données (cas transitoire)
        const distances = [...new Set(existingCurveData.points.map(p => p.distance))].sort((a, b) => a - b);
        const seriesNames = new Set();
        
        existingCurveData.points.forEach(point => {
          Object.keys(point).forEach(key => {
            if (key !== 'distance') {
              seriesNames.add(key);
            }
          });
        });
        
        const series = Array.from(seriesNames).map(seriesName => ({
          name: seriesName,
          values: distances.map(distance => {
            const point = existingCurveData.points.find(p => p.distance === distance);
            return point && point[seriesName] !== undefined ? point[seriesName] : '';
          })
        }));
        
        const convertedData = { distances, series };
        setCurveData(convertedData);
      }
    }
  }, [formData, resultIndex, sampleIndex, setCurveData]); // Ajouter setCurveData pour éviter les avertissements

  // Exposer les méthodes via ref pour usage externe
  useImperativeHandle(ref, () => ({
    getCurveData: () => curveData,
    setCurveData: setCurveData,
    resetData: resetData,
    importData: (importedData) => {
      if (importedData && importedData.distances && importedData.series) {
        setCurveData(importedData);
      }
    },
    // Nouvelle méthode dédiée à l'import Excel
    importFromExcel: (excelData) => {
      return importFromExcel(excelData);
    },
    // Méthodes pour la configuration du pas
    getDistanceStep: () => distanceStep,
    setDistanceStep: onDistanceStepChange,
    // Nouvelle méthode pour obtenir les données au format ancien (soumission)
    getCurveDataForSubmission: getCurveDataForSubmission
  }), [curveData, setCurveData, resetData, importFromExcel, distanceStep, onDistanceStepChange, getCurveDataForSubmission]);

  return (
    <div className="result-curve-section">
      {/* Section des données */}
      <CollapsibleSection
        title="Données des courbes"
        isExpandedByDefault={true}
        sectionId={`curve-data-result-${resultIndex}-sample-${sampleIndex}`}
        rememberState={true}
        level={2}
      >
        <CurveDataTable
          curveData={curveData}
          onUpdateDistance={updateDistance}
          onAddDistance={addDistance}
          onRemoveDistance={removeDistance}
          onUpdateSeriesName={updateSeriesName}
          onUpdateSeriesValue={updateSeriesValue}
          onAddSeries={addSeries}
          onRemoveSeries={removeSeries}
          viewMode={viewMode}
          readOnlyFieldStyle={readOnlyFieldStyle}
          t={t}
          distanceStep={distanceStep}
          onDistanceStepChange={onDistanceStepChange}
          allowStepConfiguration={!viewMode}
        />
      </CollapsibleSection>

      {/* Section du graphique - Correction de l'échelle X */}
      <CollapsibleSection
        title="Visualisation"
        isExpandedByDefault={true}
        sectionId={`curve-chart-result-${resultIndex}-sample-${sampleIndex}`}
        rememberState={true}
        level={2}
        className="mt-3"
      >
        <CurveChart
          curveData={{
            ...curveData,
            // Correction: s'assurer que les distances sont numériques et triées
            distances: Array.isArray(curveData.distances) 
              ? curveData.distances.map(d => Number(d)).sort((a, b) => a - b)
              : [],
            series: Array.isArray(curveData.series)
              ? curveData.series.map(serie => ({
                  ...serie,
                  // Créer les données avec les vraies distances comme coordonnées X
                  data: curveData.distances.map((distance, i) => {
                    const numDistance = Number(distance);
                    const value = serie.values[i];
                    const numValue = value === '' || value === null || value === undefined ? 0 : Number(value);
                    
                    return {
                      x: numDistance, // Utilise la vraie distance
                      y: numValue
                    };
                  }).filter(point => !isNaN(point.x)) // Filtrer les distances invalides
                }))
              : []
          }}
          title="Courbes de dureté"
          unit={unit}
          height={400}
          t={t}
          specifications={specifications}
          // Ajout d'options pour forcer l'échelle proportionnelle
          options={{
            scales: {
              x: {
                type: 'linear', // Force un axe linéaire (pas catégoriel)
                position: 'bottom',
                title: {
                  display: true,
                  text: 'Distance (mm)'
                },
                // S'assurer que l'échelle est proportionnelle
                beginAtZero: false, // Ne pas forcer à commencer à 0 si ce n'est pas nécessaire
                ticks: {
                  // Optionnel : forcer un nombre de ticks pour une meilleure lisibilité
                  maxTicksLimit: 10
                }
              },
              y: {
                title: {
                  display: true,
                  text: `Dureté (${unit})`
                }
              }
            },
            elements: {
              line: {
                tension: 0.1 // Légère courbure pour une meilleure visualisation
              },
              point: {
                radius: 4 // Points plus visibles
              }
            }
          }}
        />
      </CollapsibleSection>
    </div>
  );
});

ResultCurveSection.displayName = 'ResultCurveSection';

export default ResultCurveSection;
