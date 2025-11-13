import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import SectionHeader from './common/SectionHeader';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Palette de couleurs pour les courbes (identique à ResultCurveSection)
const colorPalette = [
  { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },   // Rose
  { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },   // Turquoise
  { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' },   // Bleu
  { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' },   // Orange
  { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' }, // Violet
  { borderColor: 'rgb(255, 205, 86)', backgroundColor: 'rgba(255, 205, 86, 0.5)' }    // Jaune
];

const ControlSection = ({ trialData, partData, clientData }) => {
  // Vérification de sécurité pour éviter les erreurs
  const trial = trialData || {};
  const part = partData || {};
  
  // Récupérer les résultats depuis les données du trial - priorité à results_data
  const results = trial.results_data?.results || trial.results || [];
  
  
  
  
  // Récupérer les spécifications depuis les données de la pièce
  const specs = part.specifications || {};
  
  
  
  // Points ECD précalculés par le backend
  const ecdPoints = part.ecdPoints || [];
  
  
  // Préparer les données de graphique avec useMemo pour optimiser les performances
  const chartData = useMemo(() => {
    if (!results || results.length === 0) return { datasets: [] };

    const datasets = [];
    
    // Traiter chaque résultat avec la nouvelle structure incluant les échantillons
    results.forEach((result, resultIndex) => {
      // Vérifier si le résultat a des échantillons avec des données de courbe
      if (result.samples && result.samples.length > 0) {
        result.samples.forEach((sample, sampleIndex) => {
          // Vérifier si l'échantillon a des données de courbe
          if (sample.curveData && sample.curveData.points && sample.curveData.points.length > 0) {
            const points = sample.curveData.points;
            
            // Trier les points par distance
            const sortedPoints = [...points].sort((a, b) => {
              const distA = parseFloat(a.distance) || 0;
              const distB = parseFloat(b.distance) || 0;
              return distA - distB;
            });

            // Obtenir les positions ECD depuis l'échantillon
            const ecdPositions = sample.ecd?.ecdPoints || [];
            
            // Créer un dataset pour chaque position ECD
            ecdPositions.forEach((position, posIndex) => {
              const fieldName = `hardness_${position.name.replace(/\s+/g, '_').toLowerCase()}`;
              const positionKey = position.name.toLowerCase();
              
              const data = sortedPoints
                .filter(p => p.distance && (p[fieldName] || p[positionKey]))
                .map(p => ({
                  x: parseFloat(p.distance),
                  y: parseFloat(p[fieldName] || p[positionKey])
                }));              if (data.length > 0) {
                const colorIndex = posIndex % colorPalette.length;
                const color = colorPalette[colorIndex];
                
                datasets.push({
                  label: `${position.name} - Résultat ${resultIndex + 1} - Échantillon ${sampleIndex + 1}`,
                  data: data,
                  borderColor: color.borderColor,
                  backgroundColor: color.backgroundColor,
                  tension: 0.1,
                  pointRadius: 4,
                  borderWidth: 2
                });
              }
            });

            // Fallback pour l'ancien format (flankHardness, rootHardness)
            if (ecdPositions.length === 0) {
              // Flanc
              const flankData = sortedPoints
                .filter(p => p.distance && p.flankHardness)
                .map(p => ({
                  x: parseFloat(p.distance),
                  y: parseFloat(p.flankHardness)
                }));

              if (flankData.length > 0) {
                datasets.push({
                  label: `Flanc - Résultat ${resultIndex + 1} - Échantillon ${sampleIndex + 1}`,
                  data: flankData,
                  borderColor: colorPalette[0].borderColor,
                  backgroundColor: colorPalette[0].backgroundColor,
                  tension: 0.1,
                  pointRadius: 4,
                  borderWidth: 2
                });
              }

              // Racine
              const rootData = sortedPoints
                .filter(p => p.distance && p.rootHardness)
                .map(p => ({
                  x: parseFloat(p.distance),
                  y: parseFloat(p.rootHardness)
                }));

              if (rootData.length > 0) {
                datasets.push({
                  label: `Racine - Résultat ${resultIndex + 1} - Échantillon ${sampleIndex + 1}`,
                  data: rootData,
                  borderColor: colorPalette[1].borderColor,
                  backgroundColor: colorPalette[1].backgroundColor,
                  tension: 0.1,
                  pointRadius: 4,
                  borderWidth: 2
                });
              }
            }
          }
        });
      }
      // Fallback pour l'ancien format (curveData directement sur le résultat)
      else if (result.curveData && result.curveData.points && result.curveData.points.length > 0) {
        const points = result.curveData.points;
        
        // Trier les points par distance
        const sortedPoints = [...points].sort((a, b) => {
          const distA = parseFloat(a.distance) || 0;
          const distB = parseFloat(b.distance) || 0;
          return distA - distB;
        });

        // Obtenir les positions ECD depuis le résultat
        const ecdPositions = result.ecd?.ecdPoints || [];
        
        // Créer un dataset pour chaque position ECD
        ecdPositions.forEach((position, posIndex) => {
          const fieldName = `hardness_${position.name.replace(/\s+/g, '_').toLowerCase()}`;
          const positionKey = position.name.toLowerCase();
          
          const data = sortedPoints
            .filter(p => p.distance && (p[fieldName] || p[positionKey]))
            .map(p => ({
              x: parseFloat(p.distance),
              y: parseFloat(p[fieldName] || p[positionKey])
            }));          if (data.length > 0) {
            const colorIndex = posIndex % colorPalette.length;
            const color = colorPalette[colorIndex];
            
            datasets.push({
              label: `${position.name} - Résultat ${resultIndex + 1}`,
              data: data,
              borderColor: color.borderColor,
              backgroundColor: color.backgroundColor,
              tension: 0.1,
              pointRadius: 4,
              borderWidth: 2
            });
          }
        });

        // Fallback pour l'ancien format (flankHardness, rootHardness)
        if (ecdPositions.length === 0) {
          // Flanc
          const flankData = sortedPoints
            .filter(p => p.distance && p.flankHardness)
            .map(p => ({
              x: parseFloat(p.distance),
              y: parseFloat(p.flankHardness)
            }));

          if (flankData.length > 0) {
            datasets.push({
              label: `Flanc - Résultat ${resultIndex + 1}`,
              data: flankData,
              borderColor: colorPalette[0].borderColor,
              backgroundColor: colorPalette[0].backgroundColor,
              tension: 0.1,
              pointRadius: 4,
              borderWidth: 2
            });
          }

          // Racine
          const rootData = sortedPoints
            .filter(p => p.distance && p.rootHardness)
            .map(p => ({
              x: parseFloat(p.distance),
              y: parseFloat(p.rootHardness)
            }));

          if (rootData.length > 0) {
            datasets.push({
              label: `Racine - Résultat ${resultIndex + 1}`,
              data: rootData,
              borderColor: colorPalette[1].borderColor,
              backgroundColor: colorPalette[1].backgroundColor,
              tension: 0.1,
              pointRadius: 4,
              borderWidth: 2
            });
          }
        }
      }
    });

    // Ajouter la courbe de spécification ECD si disponible
    if (ecdPoints && ecdPoints.length > 0) {
      datasets.push({
        label: 'Spécification ECD',
        data: ecdPoints.map(p => ({
          x: parseFloat(p.distance),
          y: parseFloat(p.value)
        })),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderDash: [5, 5],
        tension: 0,
        pointRadius: 2,
        borderWidth: 2
      });
    }

    return { datasets };
  }, [results, ecdPoints]);
  // Options pour le graphique
  const chartOptions = useMemo(() => {
    // Calculer une échelle Y appropriée basée sur les spécifications ECD
    let yMin = 0;
    let yMax = 1000; // Valeur par défaut
    
    if (specs && specs.ecd && specs.ecd.hardness) {
      const ecdHardness = parseFloat(specs.ecd.hardness);
      if (!isNaN(ecdHardness)) {
        yMin = Math.max(0, ecdHardness - 200);
        yMax = ecdHardness + 200;
      }
    }

    // Déterminer l'unité de dureté depuis les échantillons ou les spécifications
    let hardnessUnit = 'HV';
    if (results && results.length > 0) {
      for (const result of results) {
        if (result.samples && result.samples.length > 0) {
          for (const sample of result.samples) {
            if (sample.ecd?.hardnessUnit) {
              hardnessUnit = sample.ecd.hardnessUnit;
              break;
            }
            if (sample.hardnessPoints && sample.hardnessPoints.length > 0) {
              for (const point of sample.hardnessPoints) {
                if (point.unit) {
                  hardnessUnit = point.unit;
                  break;
                }
              }
              if (hardnessUnit !== 'HV') break;
            }
          }
          if (hardnessUnit !== 'HV') break;
        }
        // Fallback pour l'ancien format
        if (result.ecd?.hardnessUnit) {
          hardnessUnit = result.ecd.hardnessUnit;
          break;
        }
      }
    }
    if (hardnessUnit === 'HV' && specs?.ecd?.unit) {
      hardnessUnit = specs.ecd.unit;
    }
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Distance (mm)',
            font: { size: 12, weight: 'bold' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: `Dureté (${hardnessUnit})`,
            font: { size: 12, weight: 'bold' }
          },
          min: yMin,
          max: yMax,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y + ' ' + hardnessUnit;
              }
              return label;
            },
            title: function(context) {
              return `Distance: ${context[0].parsed.x} mm`;
            }
          }
        }
      }
    };
  }, [specs, results]);
  return (
    <div className="report-section control-section no-page-break">
      {/* Header avec SectionHeader commun */}      <SectionHeader
        title="CONTRÔLES ET RÉSULTATS"
        subtitle={`${results.length} résultat${results.length > 1 ? 's' : ''} disponible${results.length > 1 ? 's' : ''}`}
        icon={faChartLine}
        trialData={trialData}
        clientData={clientData}
        sectionType="control"
        showSubtitle={true}
      />

      {/* Informations sur les spécifications */}
      {specs && Object.keys(specs).length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '25px'
        }}>
          <h6 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            marginBottom: '12px', 
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faChartLine} style={{ color: '#6c757d' }} />
            Spécifications de Contrôle
          </h6>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '15px', 
            fontSize: '14px' 
          }}>
            {specs.surfaceHardness && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <strong style={{ color: '#495057' }}>Dureté surface:</strong><br />
                <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                  {specs.surfaceHardness.min}-{specs.surfaceHardness.max} {specs.surfaceHardness.unit || 'HV'}
                </span>
              </div>
            )}
            {specs.coreHardness && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <strong style={{ color: '#495057' }}>Dureté cœur:</strong><br />
                <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                  {specs.coreHardness.min}-{specs.coreHardness.max} {specs.coreHardness.unit || 'HV'}
                </span>
              </div>
            )}
            {specs.ecd && (
              <div style={{ 
                backgroundColor: 'white', 
                padding: '12px', 
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}>
                <strong style={{ color: '#495057' }}>ECD:</strong><br />
                <span style={{ color: '#007bff', fontWeight: 'bold' }}>
                  {specs.ecd.depthMin}-{specs.ecd.depthMax} mm à {specs.ecd.hardness} {specs.ecd.unit || 'HV'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}{/* Contenu des résultats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
        {results && results.length > 0 ? (
          results.map((result, resultIndex) => (
            <div key={resultIndex} className="result-item no-page-break">
              {/* En-tête du résultat */}
              <div style={{ 
                backgroundColor: '#f8f9fa',
                padding: '12px 15px',
                marginBottom: '15px',
                borderRadius: '6px',
                borderLeft: '4px solid #20c997',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h4 style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#495057'
                }}>
                  Résultat #{result.step || resultIndex + 1}
                  {result.description && ` - ${result.description}`}
                </h4>
                {result.samples && result.samples.length > 0 && (
                  <span style={{
                    fontSize: '12px',
                    color: '#6c757d',
                    fontStyle: 'italic'
                  }}>
                    {result.samples.length} échantillon{result.samples.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {/* Échantillons du résultat */}
              {result.samples && result.samples.length > 0 ? (
                result.samples.map((sample, sampleIndex) => (
                  <div key={sampleIndex} style={{ 
                    marginLeft: '20px', 
                    marginBottom: '20px',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '15px',
                    backgroundColor: '#fafafa'
                  }}>
                    {/* En-tête de l'échantillon */}
                    <div style={{ 
                      backgroundColor: '#e9ecef',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      borderRadius: '4px',
                      borderLeft: '3px solid #6c757d'
                    }}>
                      <h5 style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold',
                        margin: 0,
                        color: '#495057'
                      }}>
                        Échantillon #{sample.step || sampleIndex + 1}
                        {sample.description && ` - ${sample.description}`}
                      </h5>
                    </div>                    {/* Points de dureté de l'échantillon */}
                    {sample.hardness_points && sample.hardness_points.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          marginBottom: '10px',
                          color: '#495057',
                          borderBottom: '1px solid #dee2e6',
                          paddingBottom: '3px'
                        }}>
                          Mesures de Dureté
                        </h6>
                        
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse', 
                          marginBottom: '12px',
                          fontSize: '12px',
                          border: '1px solid #dee2e6'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f3f4' }}>
                              <th style={{ 
                                padding: '8px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>Position</th>
                              <th style={{ 
                                padding: '8px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>Valeur</th>
                              <th style={{ 
                                padding: '8px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>Unité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sample.hardness_points.map((point, pointIdx) => (
                              <tr key={pointIdx} style={{ 
                                backgroundColor: pointIdx % 2 === 0 ? 'white' : '#f8f9fa' 
                              }}>
                                <td style={{ 
                                  padding: '8px', 
                                  border: '1px solid #dee2e6', 
                                  textAlign: 'center' 
                                }}>
                                  {point.location === 'surface' ? 'Surface' : 
                                   point.location === 'pdd' ? 'PDD (Profondeur Dureté Désirée)' : 
                                   point.location === 'coeur' ? 'Cœur' : 
                                   point.location || '-'}
                                </td>
                                <td style={{ 
                                  padding: '8px', 
                                  border: '1px solid #dee2e6', 
                                  textAlign: 'center',
                                  fontWeight: 'bold'
                                }}>
                                  {point.value || '-'}
                                </td>
                                <td style={{ 
                                  padding: '8px', 
                                  border: '1px solid #dee2e6', 
                                  textAlign: 'center' 
                                }}>
                                  {point.unit || 'HV'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>                    )}

                    {/* Mesures ECD de l'échantillon */}
                    {sample.ecd && sample.ecd.positions && sample.ecd.positions.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ 
                          fontSize: '13px', 
                          fontWeight: 'bold', 
                          marginBottom: '10px',
                          color: '#495057',
                          borderBottom: '1px solid #dee2e6',
                          paddingBottom: '3px'
                        }}>
                          Mesures ECD (Effective Case Depth)
                          {sample.ecd.hardness_value && (
                            <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#6c757d' }}>
                              {' '}à {sample.ecd.hardness_value} {sample.ecd.hardness_unit || 'HV'}
                            </span>
                          )}
                        </h6>
                        
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse', 
                          marginBottom: '12px',
                          fontSize: '12px',
                          border: '1px solid #dee2e6'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f1f3f4' }}>
                              <th style={{ 
                                padding: '8px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>Position</th>
                              <th style={{ 
                                padding: '8px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>Distance</th>
                              <th style={{ 
                                padding: '8px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold',
                                color: '#495057'
                              }}>Unité</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sample.ecd.positions.map((ecdPoint, ecdIdx) => (
                              <tr key={ecdIdx} style={{ 
                                backgroundColor: ecdIdx % 2 === 0 ? 'white' : '#f8f9fa' 
                              }}>
                                <td style={{ 
                                  padding: '8px', 
                                  border: '1px solid #dee2e6', 
                                  textAlign: 'center' 
                                }}>
                                  {ecdPoint.name || `Position ${ecdIdx + 1}`}
                                </td>
                                <td style={{ 
                                  padding: '8px', 
                                  border: '1px solid #dee2e6', 
                                  textAlign: 'center',
                                  fontWeight: 'bold'
                                }}>
                                  {ecdPoint.distance || '-'}
                                </td>
                                <td style={{ 
                                  padding: '8px', 
                                  border: '1px solid #dee2e6', 
                                  textAlign: 'center' 
                                }}>
                                  {ecdPoint.unit || 'mm'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}                      {/* Courbe de dureté de l'échantillon */}
                    {sample.curve_data && sample.curve_data.points && sample.curve_data.points.length > 0 && (() => {
                      // Préparer les données du graphique pour cet échantillon
                      const sampleChartData = (() => {
                        const sortedPoints = [...sample.curve_data.points].sort((a, b) => {
                          const distA = parseFloat(a.distance) || 0;
                          const distB = parseFloat(b.distance) || 0;
                          return distA - distB;
                        });

                        const datasets = [];

                        // Créer un dataset pour chaque position ECD
                        if (sample.ecd?.positions && sample.ecd.positions.length > 0) {
                          sample.ecd.positions.forEach((position, posIndex) => {
                            const positionKey = position.name.toLowerCase();
                            const fieldName = `hardness_${position.name.replace(/\s+/g, '_').toLowerCase()}`;
                            
                            const data = sortedPoints
                              .filter(p => p.distance && (p[fieldName] || p[positionKey]))
                              .map(p => ({
                                x: parseFloat(p.distance),
                                y: parseFloat(p[fieldName] || p[positionKey])
                              }));                            if (data.length > 0) {
                              const colorIndex = posIndex % colorPalette.length;
                              const color = colorPalette[colorIndex];
                              
                              datasets.push({
                                label: position.name,
                                data: data,
                                borderColor: color.borderColor,
                                backgroundColor: color.backgroundColor,
                                tension: 0.1,
                                pointRadius: 3,
                                borderWidth: 2
                              });
                            }
                          });
                        } else {
                          // Fallback pour l'ancien format (flank_hardness, root_hardness)
                          const flankData = sortedPoints
                            .filter(p => p.distance && p.flank_hardness)
                            .map(p => ({
                              x: parseFloat(p.distance),
                              y: parseFloat(p.flank_hardness)
                            }));

                          const rootData = sortedPoints
                            .filter(p => p.distance && p.root_hardness)
                            .map(p => ({
                              x: parseFloat(p.distance),
                              y: parseFloat(p.root_hardness)
                            }));

                          if (flankData.length > 0) {
                            datasets.push({
                              label: 'Flanc',
                              data: flankData,
                              borderColor: colorPalette[0].borderColor,
                              backgroundColor: colorPalette[0].backgroundColor,
                              tension: 0.1,
                              pointRadius: 3,
                              borderWidth: 2
                            });
                          }

                          if (rootData.length > 0) {
                            datasets.push({
                              label: 'Racine',
                              data: rootData,
                              borderColor: colorPalette[1].borderColor,
                              backgroundColor: colorPalette[1].backgroundColor,
                              tension: 0.1,
                              pointRadius: 3,
                              borderWidth: 2
                            });                          }
                        }

                        // Ajouter les courbes de spécification ECD si disponibles
                        if (specs && specs.ecd && specs.ecd.hardness) {
                          // Format ancien : spécification ECD unique
                          const depthMin = parseFloat(specs.ecd.depthMin) || 0.0;
                          const depthMax = parseFloat(specs.ecd.depthMax) || 1.0;
                          const hardnessValue = parseFloat(specs.ecd.hardness);
                          
                          if (!isNaN(hardnessValue)) {
                            datasets.push({
                              label: 'Spécification ECD',
                              data: [
                                { x: depthMin, y: hardnessValue },
                                { x: depthMax, y: hardnessValue }
                              ],
                              borderColor: 'rgb(0, 0, 0)',
                              backgroundColor: 'rgba(0, 0, 0, 0.2)',
                              borderDash: [5, 5],
                              tension: 0,
                              pointRadius: 2,
                              borderWidth: 2
                            });
                          }
                        } else if (specs && specs.ecdSpecs && Array.isArray(specs.ecdSpecs)) {
                          // Nouveau format : spécifications ECD multiples
                          specs.ecdSpecs.forEach((ecdSpec, index) => {
                            if (ecdSpec.hardness && (ecdSpec.depthMin !== undefined || ecdSpec.depthMax !== undefined)) {
                              const depthMin = parseFloat(ecdSpec.depthMin) || 0.0;
                              const depthMax = parseFloat(ecdSpec.depthMax) || 1.0;
                              const hardnessValue = parseFloat(ecdSpec.hardness);
                              
                              if (!isNaN(hardnessValue)) {
                                datasets.push({
                                  label: `Spécification ${ecdSpec.name || `ECD ${index + 1}`}`,
                                  data: [
                                    { x: depthMin, y: hardnessValue },
                                    { x: depthMax, y: hardnessValue }
                                  ],
                                  borderColor: 'rgb(0, 0, 0)',
                                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                  borderDash: [5, 5],
                                  tension: 0,
                                  pointRadius: 2,
                                  borderWidth: 2
                                });
                              }
                            }
                          });
                        }

                        return { datasets };
                      })();

                      // Options du graphique pour cet échantillon
                      const sampleChartOptions = (() => {
                        // Déterminer l'unité de dureté
                        let hardnessUnit = 'HV';
                        if (sample.ecd?.hardness_unit) {
                          hardnessUnit = sample.ecd.hardness_unit;
                        } else if (sample.hardness_points && sample.hardness_points.length > 0) {
                          const firstPoint = sample.hardness_points.find(p => p.unit);
                          if (firstPoint) hardnessUnit = firstPoint.unit;
                        }

                        return {
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            x: {
                              type: 'linear',
                              position: 'bottom',
                              title: {
                                display: true,
                                text: 'Distance (mm)',
                                font: { size: 11, weight: 'bold' }
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                              }
                            },
                            y: {
                              title: {
                                display: true,
                                text: `Dureté (${hardnessUnit})`,
                                font: { size: 11, weight: 'bold' }
                              },
                              grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                font: { size: 10 }
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  let label = context.dataset.label || '';
                                  if (label) {
                                    label += ': ';
                                  }
                                  if (context.parsed.y !== null) {
                                    label += context.parsed.y + ' ' + hardnessUnit;
                                  }
                                  return label;
                                },
                                title: function(context) {
                                  return `Distance: ${context[0].parsed.x} mm`;
                                }
                              }
                            }
                          }
                        };
                      })();

                      return (
                        <div style={{ 
                          border: '1px solid #e9ecef', 
                          borderRadius: '6px',
                          padding: '15px',
                          backgroundColor: 'white',
                          marginBottom: '15px'
                        }}>
                          <h6 style={{ 
                            fontSize: '13px', 
                            fontWeight: 'bold', 
                            marginBottom: '10px',
                            color: '#495057',
                            borderBottom: '1px solid #dee2e6',
                            paddingBottom: '3px'
                          }}>
                            Courbe de Dureté - Échantillon #{sampleIndex + 1}
                          </h6>
                          
                          {/* Graphique de la courbe de dureté */}
                          <div style={{ height: '250px' }}>
                            <Line data={sampleChartData} options={sampleChartOptions} />
                          </div>
                          
                          {/* Information sur le nombre de points */}
                          <div style={{ 
                            textAlign: 'center', 
                            marginTop: '10px',
                            fontSize: '11px',
                            color: '#6c757d',
                            fontStyle: 'italic'
                          }}>
                            {sample.curve_data.points.length} point{sample.curve_data.points.length > 1 ? 's' : ''} de mesure
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ))
              ) : (
                /* Fallback pour l'ancien format (sans échantillons) */
                <div style={{ marginLeft: '20px' }}>
                  {/* Mesures de dureté individuelles (ancien format) */}
                  {result.hardness_points && result.hardness_points.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        marginBottom: '12px',
                        color: '#495057',
                        borderBottom: '1px solid #dee2e6',
                        paddingBottom: '5px'
                      }}>
                        Mesures de Dureté
                      </h5>
                      
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        marginBottom: '15px',
                        fontSize: '13px',
                        border: '1px solid #dee2e6'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#495057'
                            }}>Position</th>
                            <th style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#495057'
                            }}>Valeur</th>
                            <th style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#495057'
                            }}>Unité</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.hardness_points.map((point, pointIdx) => (
                            <tr key={pointIdx} style={{ 
                              backgroundColor: pointIdx % 2 === 0 ? 'white' : '#f8f9fa' 
                            }}>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center' 
                              }}>
                                {point.location === 'surface' ? 'Surface' : 
                                 point.location === 'pdd' ? 'PDD (Profondeur Dureté Désirée)' : 
                                 point.location === 'coeur' ? 'Cœur' : 
                                 point.location || '-'}
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {point.value || '-'}
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center' 
                              }}>
                                {point.unit || result.hardness_unit || 'HV'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Mesures ECD (ancien format) */}
                  {result.ecd && (result.ecd.tooth_flank || result.ecd.tooth_root) && (
                    <div style={{ marginBottom: '20px' }}>
                      <h5 style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        marginBottom: '12px',
                        color: '#495057',
                        borderBottom: '1px solid #dee2e6',
                        paddingBottom: '5px'
                      }}>
                        Mesures ECD (Effective Case Depth)
                      </h5>
                      
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        marginBottom: '15px',
                        fontSize: '13px',
                        border: '1px solid #dee2e6'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#495057'
                            }}>Position</th>
                            <th style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#495057'
                            }}>Distance</th>
                            <th style={{ 
                              padding: '10px', 
                              border: '1px solid #dee2e6', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#495057'
                            }}>Dureté</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.ecd.tooth_flank && (
                            <tr>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center' 
                              }}>
                                Flanc de dent
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {result.ecd.tooth_flank.distance || '-'} {result.ecd.tooth_flank.unit || 'mm'}
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {result.ecd.hardness_value || '-'} {result.ecd.hardness_unit || 'HV'}
                              </td>
                            </tr>
                          )}
                          {result.ecd.tooth_root && (
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center' 
                              }}>
                                Racine de dent
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {result.ecd.tooth_root.distance || '-'} {result.ecd.tooth_root.unit || 'mm'}
                              </td>
                              <td style={{ 
                                padding: '10px', 
                                border: '1px solid #dee2e6', 
                                textAlign: 'center',
                                fontWeight: 'bold'
                              }}>
                                {result.ecd.hardness_value || '-'} {result.ecd.hardness_unit || 'HV'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ 
            padding: '30px', 
            textAlign: 'center', 
            border: '2px dashed #dee2e6', 
            borderRadius: '8px',
            color: '#6c757d',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>📊</div>
            <h5 style={{ color: '#6c757d', marginBottom: '8px' }}>Aucun résultat disponible</h5>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Les données de contrôle et de mesure n'ont pas encore été saisies pour ce trial.
            </p>
          </div>
        )}

        {/* Courbe de dureté - affichée seulement s'il y a des données */}
        {chartData.datasets.length > 0 && (
          <div style={{ 
            border: '1px solid #dee2e6', 
            borderRadius: '8px',
            padding: '20px',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h5 style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              marginBottom: '15px',
              color: '#495057',
              textAlign: 'center',
              borderBottom: '2px solid #20c997',
              paddingBottom: '8px'
            }}>
              Courbe de Dureté
            </h5>
            <div style={{ height: '350px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlSection;
