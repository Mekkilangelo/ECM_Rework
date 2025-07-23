import { useMemo } from 'react';

/**
 * Hook pour gérer le graphique des courbes
 */
export const useCurveChart = (curveData, options = {}) => {
  // Palette de couleurs pour les courbes
  const colorPalette = [
    { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },   // Rose
    { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },   // Turquoise
    { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' },   // Bleu
    { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' },   // Orange
    { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' }, // Violet
    { borderColor: 'rgb(255, 205, 86)', backgroundColor: 'rgba(255, 205, 86, 0.5)' }    // Jaune
  ];

  // Données formatées pour Chart.js
  const chartData = useMemo(() => {
    if (!curveData || !curveData.distances || !curveData.series) {
      return {
        labels: [],
        datasets: []
      };
    }

    const datasets = curveData.series.map((serie, index) => {
      const colorIndex = index % colorPalette.length;
      const colors = colorPalette[colorIndex];
      
      return {
        label: serie.name || `Série ${index + 1}`,
        data: serie.values || [],
        borderColor: colors.borderColor,
        backgroundColor: colors.backgroundColor,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.1,
        fill: false
      };
    });

    return {
      labels: curveData.distances.map(d => `${d} mm`),
      datasets
    };
  }, [curveData]);

  // Options du graphique
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: options.title || 'Courbes de dureté',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            return `Distance: ${context[0].label}`;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} ${options.unit || 'HV'}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Distance (mm)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: options.yAxisLabel || 'Dureté (HV)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        beginAtZero: options.beginAtZero !== false
      }
    }
  }), [options]);

  // Vérifier si le graphique a des données à afficher
  const hasData = useMemo(() => {
    return chartData.datasets.length > 0 && chartData.labels.length > 0;
  }, [chartData]);

  return {
    chartData,
    chartOptions,
    hasData,
    colorPalette
  };
};
