import React from 'react';
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

const ControlSection = ({ testData, partData }) => {
  // Vérification de sécurité pour éviter les erreurs
  const test = testData || {};
  const part = partData || {};
  
  // Récupérer les résultats depuis les données du test
  const results = test.results || (test.results_data?.results) || [];
  
  console.log("Control Section - Results:", results);
  
  // Récupérer les spécifications depuis les données de la pièce
  const specs = part.specifications || {};
  
  console.log("Control Section - Specs:", specs);
  
  // Points ECD précalculés par le backend
  const ecdPoints = part.ecdPoints || [];
  
  console.log("Control Section - ECD Points:", ecdPoints);
  
  // Fonction pour formater les points de la courbe
  const prepareChartData = (curveData) => {
    if (!curveData || !curveData.points || curveData.points.length === 0) {
      return null;
    }
    
    console.log("Preparing chart data with curve data:", curveData);
    console.log("Specifications for chart:", specs);
    
    // Trier les points par distance
    const sortedPoints = [...curveData.points].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
    
    // Créer les datasets pour les mesures
    const datasets = [
      {
        label: 'Dureté flanc',
        data: sortedPoints
          .filter(p => p.distance && p.flank_hardness)
          .map(p => ({
            x: parseFloat(p.distance), 
            y: parseFloat(p.flank_hardness)
          })),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
        pointRadius: 4,
        borderWidth: 2
      },
      {
        label: 'Dureté racine',
        data: sortedPoints
          .filter(p => p.distance && p.root_hardness)
          .map(p => ({
            x: parseFloat(p.distance), 
            y: parseFloat(p.root_hardness)
          })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        pointRadius: 4,
        borderWidth: 2
      }
    ];
    
    // Ajouter la courbe de spécification si disponible
    if (ecdPoints && ecdPoints.length > 0) {
      console.log("Adding ECD points from backend:", ecdPoints);
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
        pointRadius: 0,
        borderWidth: 2
      });
    } else if (specs && specs.ecd) {
      // Alternative si les points précalculés ne sont pas disponibles
      console.log("Creating ECD line from specs:", specs.ecd);
      const hardnessValue = parseFloat(specs.ecd.hardness);
      const minDepth = parseFloat(specs.ecd.depthMin || 0);
      const maxDepth = parseFloat(specs.ecd.depthMax || 2);
      
      if (!isNaN(hardnessValue) && !isNaN(minDepth) && !isNaN(maxDepth)) {
        console.log("Adding ECD line with values:", { minDepth, maxDepth, hardnessValue });
        datasets.push({
          label: 'Spécification ECD',
          data: [
            { x: minDepth, y: hardnessValue },
            { x: maxDepth, y: hardnessValue }
          ],
          borderColor: 'rgb(0, 0, 0)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderDash: [5, 5],
          tension: 0,
          pointRadius: 0,
          borderWidth: 2
        });
      }
    }
    
    return {
      datasets
    };
  };
  
  // Options pour le graphique
  const getChartOptions = (hardnessUnit) => {
    // Calculer une échelle Y appropriée basée sur les spécifications ECD
    let yMin = 0;
    let yMax = 1000; // Valeur par défaut
    
    if (specs && specs.ecd && specs.ecd.hardness) {
      const ecdHardness = parseFloat(specs.ecd.hardness);
      if (!isNaN(ecdHardness)) {
        // Définir une plage autour de la valeur ECD pour une meilleure visualisation
        yMin = Math.max(0, ecdHardness - 200);
        yMax = ecdHardness + 200;
      }
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
            text: 'Distance (mm)'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          title: {
            display: true,
            text: `Dureté (${hardnessUnit || 'HV'})`
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
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y;
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
  };

  return (
    <div className="report-section control-section">
      {/* Bandeau des spécifications si disponibles */}
      {specs && Object.keys(specs).length > 0 && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          marginBottom: '20px', 
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h5 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Spécifications:</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
            {specs.surfaceHardness && (
              <div style={{ flex: '1', minWidth: '200px' }}>
                <strong>Dureté surface:</strong> {specs.surfaceHardness.min}-{specs.surfaceHardness.max} {specs.surfaceHardness.unit || 'HV'}
              </div>
            )}
            {specs.coreHardness && (
              <div style={{ flex: '1', minWidth: '200px' }}>
                <strong>Dureté cœur:</strong> {specs.coreHardness.min}-{specs.coreHardness.max} {specs.coreHardness.unit || 'HV'}
              </div>
            )}
            {specs.ecd && (
              <div style={{ flex: '1', minWidth: '200px' }}>
                <strong>ECD:</strong> {specs.ecd.depthMin}-{specs.ecd.depthMax} mm à {specs.ecd.hardness} {specs.ecd.unit || 'HV'}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Affichage de chaque résultat */}
      {results && results.length > 0 ? (
        results.map((result, index) => (
          <div key={index} className="result-item">
            <h4 style={{ 
              fontSize: '18px', 
              marginBottom: '15px', 
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              borderLeft: '4px solid #20c997'
            }}>
              Résultat #{result.step || index + 1} {result.description && `- ${result.description}`}
            </h4>
            
            <div style={{ 
              border: '1px solid #dee2e6', 
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '20px',
              backgroundColor: 'white' 
            }}>
              {/* Partie des résultats de mesure */}
              <h5 style={{ fontSize: '16px', marginBottom: '15px' }}>Mesures de dureté</h5>
              
              {/* Points de dureté individuels */}
              {result.hardness_points && result.hardness_points.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Position</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Valeur</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Unité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.hardness_points.map((point, pointIdx) => (
                        <tr key={pointIdx} style={{ backgroundColor: pointIdx % 2 === 0 ? 'white' : '#f8f9fa' }}>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {point.location === 'surface' ? 'Surface' : 
                             point.location === 'pdd' ? 'PDD (Profondeur Dureté Désirée)' : 
                             point.location === 'coeur' ? 'Cœur' : point.location || '-'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {point.value || '-'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {point.unit || result.hardness_unit || 'HV'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Mesures ECD si présentes */}
              {result.ecd && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '16px', marginBottom: '10px' }}>Mesures ECD</h5>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Position</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Distance</th>
                        <th style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>Dureté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ecd.tooth_flank && (
                        <tr>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            Flanc de dent
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {result.ecd.tooth_flank.distance || '-'} {result.ecd.tooth_flank.unit || 'mm'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {result.ecd.hardness_value || '-'} {result.ecd.hardness_unit || 'HV'}
                          </td>
                        </tr>
                      )}
                      {result.ecd.tooth_root && (
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            Racine de dent
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {result.ecd.tooth_root.distance || '-'} {result.ecd.tooth_root.unit || 'mm'}
                          </td>
                          <td style={{ padding: '8px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                            {result.ecd.hardness_value || '-'} {result.ecd.hardness_unit || 'HV'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Commentaire si présent */}
              {result.comment && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '16px', marginBottom: '10px' }}>Commentaire</h5>
                  <div style={{ 
                    border: '1px solid #dee2e6', 
                    borderRadius: '4px', 
                    padding: '10px',
                    backgroundColor: '#f8f9fa'
                  }}>
                    {result.comment}
                  </div>
                </div>
              )}
            </div>
            
            {/* Courbe de dureté */}
            {result.curve_data && result.curve_data.points && result.curve_data.points.length > 0 && (
              <div style={{ 
                border: '1px solid #dee2e6', 
                borderRadius: '4px',
                padding: '15px',
                marginBottom: '20px',
                backgroundColor: 'white' 
              }}>
                <h5 style={{ fontSize: '16px', marginBottom: '15px' }}>Courbe de dureté</h5>
                <div style={{ height: '400px' }}>
                  <Line 
                    data={prepareChartData(result.curve_data)} 
                    options={getChartOptions(result.ecd?.hardness_unit || specs?.ecd?.unit || 'HV')}
                  />
                </div>
              </div>
            )}
            
            {/* Séparateur entre résultats */}
            {index < results.length - 1 && (
              <div 
                style={{ 
                  marginBottom: '40px', 
                  pageBreakAfter: 'always' 
                }}
              ></div>
            )}
          </div>
        ))
      ) : (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          border: '1px dashed #dee2e6', 
          borderRadius: '4px',
          color: '#6c757d'
        }}>
          Aucun résultat disponible
        </div>
      )}
    </div>
  );
};

export default ControlSection;

