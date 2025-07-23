import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useCurveChart } from '../hooks/useCurveChart';

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

/**
 * Composant pour afficher le graphique des courbes
 */
const CurveChart = ({
  curveData,
  title = '',
  unit = 'HV',
  height = 400,
  t
}) => {
  const chartOptions = {
    title: title || t('tests.after.results.curves.chartTitle', 'Courbes de dureté'),
    unit: unit,
    yAxisLabel: `${t('tests.after.results.curves.hardness', 'Dureté')} (${unit})`,
    beginAtZero: true
  };

  const { chartData, chartOptions: options, hasData } = useCurveChart(curveData, chartOptions);

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
              {t('tests.after.results.curves.addDataToSeeChart', 'Ajoutez des données dans le tableau pour voir le graphique')}
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
          options={options}
        />
      </div>
      
      {curveData.series && curveData.series.length > 0 && (
        <div className="mt-3">
          <div className="row">
            <div className="col-md-6">
              <small className="text-muted">
                <strong>{t('tests.after.results.curves.series', 'Séries')}:</strong> {curveData.series.length}
              </small>
            </div>
            <div className="col-md-6">
              <small className="text-muted">
                <strong>{t('tests.after.results.curves.points', 'Points')}:</strong> {curveData.distances?.length || 0}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurveChart;
