import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  LinearScale,
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { useCurveChart } from '../hooks/useCurveChart';

// Enregistrement des composants nécessaires pour Chart.js
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Composant pour afficher le graphique des courbes avec échelle proportionnelle
 * Gestion améliorée des valeurs nulles et zéro
 */
const CurveChart = ({
  curveData,
  title = '',
  unit = 'HV',
  height = 400,
  t,
  options = {},
  showStats = true, // Nouvelle option pour afficher/masquer les statistiques
  specifications
}) => {
  console.log('🔍 CurveChart - Specifications reçues:', specifications);
  console.log('🔍 CurveChart - Options reçues:', options);
  
  const chartOptions = {
    title: title || t('tests.after.results.curves.chartTitle', 'Courbes de dureté'),
    unit: unit,
    yAxisLabel: `${t('tests.after.results.curves.hardness', 'Dureté')} (${unit})`,
    beginAtZero: false,
    specifications: specifications,
    ...options
  };
  
  console.log('🔍 CurveChart - ChartOptions avec specs:', chartOptions);

  const { 
    chartData, 
    chartOptions: computedOptions, 
    hasData, 
    stats 
  } = useCurveChart(curveData, chartOptions);

  if (!hasData) {
    return (
      <div className="curve-chart-empty">
        <div 
          className="d-flex align-items-center justify-content-center bg-light rounded"
          style={{ height: `${height}px` }}
        >
          <div className="text-center text-muted">
            <div className="mb-2">
              <i className="fas fa-chart-line fa-3x opacity-50"></i>
            </div>
            <p className="mb-0">
              {t('tests.after.results.curves.noDataToDisplay', 'Aucune donnée à afficher')}
            </p>
            <small>
              {stats.totalPoints > 0 ? 
                `${stats.totalPoints} points disponibles, mais aucune valeur valide (> 0)` :
                t('tests.after.results.curves.addDataToSeeChart', 'Ajoutez des données dans le tableau pour voir le graphique')
              }
            </small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="curve-chart">
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Line 
          data={chartData} 
          options={computedOptions}
        />
      </div>
      
      {/* Informations sur les données et le filtrage */}
      {curveData.series && curveData.series.length > 0 && (
        <div className="mt-3">
          <div className="row">
            <div className="col-md-3">
              <small className="text-muted">
                <strong>{t('tests.after.results.curves.series', 'Séries')}:</strong> {curveData.series.length}
              </small>
            </div>
            <div className="col-md-3">
              <small className="text-muted">
                <strong>{t('tests.after.results.curves.points', 'Points totaux')}:</strong> {curveData.distances?.length || 0}
              </small>
            </div>
            <div className="col-md-3">
              <small className="text-muted">
                <strong>Points tracés:</strong> {stats.validPoints}
              </small>
            </div>
            <div className="col-md-3">
              <small className="text-muted">
                <strong>Échelle:</strong> Proportionnelle
              </small>
            </div>
          </div>
          
          {/* Affichage d'informations sur le filtrage si des points ont été ignorés */}
          {showStats && stats.skippedPoints > 0 && (
            <div className="row mt-2">
              <div className="col-12">
                <div className="alert alert-info py-2 px-3 mb-0" style={{ fontSize: '0.875rem' }}>
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Filtrage appliqué:</strong> {stats.skippedPoints} point(s) avec des valeurs nulles ou égales à zéro ont été exclus du tracé.
                  {stats.skippedPoints > 0 && (
                    <span className="ms-2">
                      Les lignes sont automatiquement reliées pour éviter les discontinuités.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Légende pour les lignes pointillées (si applicable) */}
          <div className="row mt-2">
            <div className="col-12">
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                <strong>Légende:</strong> Les lignes continues représentent des mesures consécutives. 
                Les lignes pointillées indiquent une interpolation entre des points distants.
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurveChart;