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
  testNodeId,
  resultIndex = 0,
  sampleIndex = 0,
  formData,
  handleChange,
  viewMode = false,
  readOnlyFieldStyle = {},
  unit = 'HV'
}, ref) => {
  const { t } = useTranslation();

  // Mémoriser le callback pour éviter les re-créations inutiles
  const handleCurveDataChange = useCallback((newData) => {
    console.log('🔄 ResultCurveSection - handleCurveDataChange appelé:', {
      resultIndex,
      sampleIndex,
      newData,
      hasFormData: !!formData,
      hasResultsData: !!formData?.resultsData,
      hasResults: !!formData?.resultsData?.results,
      resultsLength: formData?.resultsData?.results?.length || 0
    });
    
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
      
      console.log('📤 Envoi des données mises à jour via handleChange:', {
        path: 'resultsData',
        updatedData: updatedResultsData,
        targetCurveData: updatedResultsData.results?.[resultIndex]?.samples?.[sampleIndex]?.curveData
      });
      
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
    console.log('🚀 ResultCurveSection useEffect triggered:', {
      resultIndex,
      sampleIndex,
      formDataExists: !!formData,
      resultsDataExists: !!formData?.resultsData,
      resultsLength: formData?.resultsData?.results?.length,
      fullFormDataPath: formData?.resultsData?.results?.[resultIndex]?.samples?.[sampleIndex],
      fullFormDataStructure: formData?.resultsData
    });
    
    const existingCurveData = formData?.resultsData?.results?.[resultIndex]?.samples?.[sampleIndex]?.curveData;
    
    console.log('🔍 ResultCurveSection - Initialisation des données:', {
      resultIndex,
      sampleIndex,
      existingCurveData,
      existingCurveDataType: typeof existingCurveData,
      existingFormat: existingCurveData ? (existingCurveData.distances && existingCurveData.series ? 'NOUVEAU (distances+series)' : existingCurveData.points ? 'ancien (points)' : 'format inconnu') : 'pas de données',
      localDataEmpty: !curveData.distances?.length && !curveData.series?.length,
      localCurveData: curveData,
      shouldLoad: !!existingCurveData
    });
    
    // TOUJOURS charger les données si elles existent, même si des données locales sont présentes
    if (existingCurveData) {
      // Les données devraient maintenant être directement au nouveau format
      // Utiliser hasOwnProperty pour vérifier la présence des propriétés, pas leur contenu
      if (existingCurveData.hasOwnProperty('distances') && existingCurveData.hasOwnProperty('series')) {
        console.log('✅ Données déjà au nouveau format, chargement forcé');
        console.log('Données à charger:', existingCurveData);
        console.log('Distances trouvées:', existingCurveData.distances);
        console.log('Séries trouvées:', existingCurveData.series);
        setCurveData({
          distances: Array.isArray(existingCurveData.distances) ? existingCurveData.distances : [],
          series: Array.isArray(existingCurveData.series) ? existingCurveData.series : []
        });
        console.log('✅ Données chargées dans setCurveData');
      } else if (existingCurveData.points) {
        // Migration des anciennes données (cas transitoire)
        console.log('🔄 Migration des anciennes données vers le nouveau format');
        
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
        console.log('✅ Données migrées:', convertedData);
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

      {/* Section du graphique */}
      <CollapsibleSection
        title="Visualisation"
        isExpandedByDefault={true}
        sectionId={`curve-chart-result-${resultIndex}-sample-${sampleIndex}`}
        rememberState={true}
        level={2}
        className="mt-3"
      >
        <CurveChart
          curveData={curveData}
          title="Courbes de dureté"
          unit={unit}
          height={400}
          t={t}
        />
      </CollapsibleSection>

      {/* Section d'informations */}
      {!viewMode && (
        <div className="mt-3">
          <Card className="border-info">
            <Card.Body className="py-2">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <small className="text-info">
                    <strong>Compatible Excel:</strong>{' '}
                    Cette structure est optimisée pour l'import/export Excel. Les distances en colonnes, les séries en lignes.
                  </small>
                </div>
                <div className="col-md-4 text-end">
                  <small className="text-muted">
                    {curveData.distances?.length || 0} distances × {' '}
                    {curveData.series?.length || 0} séries
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
});

ResultCurveSection.displayName = 'ResultCurveSection';

export default ResultCurveSection;
