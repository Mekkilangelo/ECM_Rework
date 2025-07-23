import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Nav, Card } from 'react-bootstrap';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';
import { useCurveDataTable } from './hooks/useCurveDataTable';
import CurveDataTable from './components/CurveDataTable';
import CurveChart from './components/CurveChart';

/**
 * ResultCurveSection - Version simplifiée et moderne
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
 *       values: [95, 115, 105, 100, 90]   // 0 si pas de valeur
 *     }
 *   ]
 * }
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

  // Récupération des données existantes
  const existingData = formData?.resultsData?.results?.[resultIndex]?.samples?.[sampleIndex]?.curveData;

  // Hook pour gérer les données du tableau
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
    resetData
  } = useCurveDataTable(existingData, (newData) => {
    // Callback pour sauvegarder les changements
    if (handleChange) {
      handleChange({
        target: {
          name: `resultsData.results[${resultIndex}].samples[${sampleIndex}].curveData`,
          value: newData
        }
      });
    }
  });

  // Synchroniser avec les données externes
  useEffect(() => {
    if (existingData && JSON.stringify(existingData) !== JSON.stringify(curveData)) {
      setCurveData(existingData);
    }
  }, [existingData, curveData, setCurveData]);

  // Exposer les méthodes via ref pour usage externe
  useImperativeHandle(ref, () => ({
    getCurveData: () => curveData,
    setCurveData: setCurveData,
    resetData: resetData,
    importData: (importedData) => {
      if (importedData && importedData.distances && importedData.series) {
        setCurveData(importedData);
      }
    }
  }), [curveData, setCurveData, resetData]);

  return (
    <div className="result-curve-section">
      {/* Section des données */}
      <CollapsibleSection
        title={t('tests.after.results.curves.dataSection', 'Données des courbes')}
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
        />
      </CollapsibleSection>

      {/* Section du graphique */}
      <CollapsibleSection
        title={t('tests.after.results.curves.chartSection', 'Visualisation')}
        isExpandedByDefault={true}
        sectionId={`curve-chart-result-${resultIndex}-sample-${sampleIndex}`}
        rememberState={true}
        level={2}
        className="mt-3"
      >
        <CurveChart
          curveData={curveData}
          title={t('tests.after.results.curves.chartTitle', 'Courbes de dureté')}
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
                    <strong>{t('tests.after.results.curves.excelCompatible', 'Compatible Excel:')}</strong>{' '}
                    {t('tests.after.results.curves.excelInfo', 
                      'Cette structure est optimisée pour l\'import/export Excel. Les distances en colonnes, les séries en lignes.'
                    )}
                  </small>
                </div>
                <div className="col-md-4 text-end">
                  <small className="text-muted">
                    {curveData.distances?.length || 0} {t('tests.after.results.curves.distances', 'distances')} × {' '}
                    {curveData.series?.length || 0} {t('tests.after.results.curves.series', 'séries')}
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
