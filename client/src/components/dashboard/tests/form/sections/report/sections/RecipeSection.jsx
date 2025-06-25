import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faCogs, faUser, faCalendarAlt, faThermometerHalf, faTachometerAlt, faClock, faChartLine } from '@fortawesome/free-solid-svg-icons';
import SectionHeader from './common/SectionHeader';

const RecipeSection = ({ testData, recipeData: passedRecipeData, clientData }) => {
  const [totalThermalDuration, setTotalThermalDuration] = useState(0);
  const [totalChemicalDuration, setTotalChemicalDuration] = useState(0);
  const [chartData, setChartData] = useState(null);
    // Utiliser recipeData passé directement ou extrait de testData
  const recipeData = passedRecipeData || 
    (typeof testData?.recipe_data === 'string' 
      ? JSON.parse(testData.recipe_data) 
      : testData?.recipe_data) || 
    (typeof testData?.recipeData === 'string'
      ? JSON.parse(testData.recipeData)
      : testData?.recipeData) || {};  // Traitement amélioré des données quench avec parsing si nécessaire
  const quenchData = (() => {
    let rawQuenchData = testData?.quench_data || {};
    
    // Si c'est une string, essayer de la parser
    if (typeof rawQuenchData === 'string') {
      try {
        rawQuenchData = JSON.parse(rawQuenchData);
      } catch (e) {
        console.error('Erreur lors du parsing des données quench:', e);
        rawQuenchData = {};
      }
    }
      // Vérification additionnelle pour la structure attendue
    if (rawQuenchData && typeof rawQuenchData === 'object') {
      // Si les données ont une structure inattendue, essayer de les normaliser
      if (!rawQuenchData.oil_quench && !rawQuenchData.gas_quench) {
          // Peut-être que les données sont directement au niveau racine
        if (rawQuenchData.oilTemperature || rawQuenchData.oilQuenchSpeed || rawQuenchData.gasQuenchSpeed) {
          // Convertir du format formulaire vers le format API attendu
          const convertedData = {
            oil_quench: {},
            gas_quench: {}
          };
          
          // Oil quench
          if (rawQuenchData.oilTemperature) {
            convertedData.oil_quench.temperature = {
              value: rawQuenchData.oilTemperature,
              unit: rawQuenchData.oilTempUnit || 'C'
            };
          }
          
          if (rawQuenchData.oilInertingPressure) {
            convertedData.oil_quench.inerting_pressure = rawQuenchData.oilInertingPressure;
          }
          
          if (rawQuenchData.oilInertingDelay) {
            convertedData.oil_quench.inerting_delay = {
              value: rawQuenchData.oilInertingDelay,
              unit: rawQuenchData.oilInertingDelayUnit || 's'
            };
          }
          
          if (rawQuenchData.oilDrippingTime) {
            convertedData.oil_quench.dripping_time = {
              value: rawQuenchData.oilDrippingTime,
              unit: rawQuenchData.oilDrippingTimeUnit || 's'
            };
          }
          
          if (Array.isArray(rawQuenchData.oilQuenchSpeed) && rawQuenchData.oilQuenchSpeed.length > 0) {
            convertedData.oil_quench.speed_parameters = rawQuenchData.oilQuenchSpeed;
          }
          
          // Gas quench
          if (Array.isArray(rawQuenchData.gasQuenchSpeed) && rawQuenchData.gasQuenchSpeed.length > 0) {
            convertedData.gas_quench.speed_parameters = rawQuenchData.gasQuenchSpeed;
          }
          
          if (Array.isArray(rawQuenchData.gasQuenchPressure) && rawQuenchData.gasQuenchPressure.length > 0) {
            convertedData.gas_quench.pressure_parameters = rawQuenchData.gasQuenchPressure;          }
          rawQuenchData = convertedData;
        }
      }
    }
    
    return rawQuenchData;
  })();
  
  // Formater la date
  const formattedDate = testData?.testDate 
    ? format(new Date(testData.testDate), 'd MMMM yyyy', { locale: fr }) 
    : 'Not specified';

  // Correction pour la gestion des durées dans useEffect
  useEffect(() => {
    if (recipeData) {
      // Calculer la durée totale du programme thermique (en minutes)
      if (recipeData.thermal_cycle) {
        const total = recipeData.thermal_cycle.reduce((acc, step) => 
          acc + (parseInt(step.duration) || 0), 0);
        setTotalThermalDuration(total);
      }
      
      // Calculer la durée totale du programme chimique (en secondes)
      if (recipeData.chemical_cycle) {
        // Temps total du cycle chimique (déjà en secondes)
        const chemicalTotal = recipeData.chemical_cycle.reduce((acc, step) => 
          acc + (parseInt(step.time) || 0), 0);
        
        // Ajouter le temps d'attente (en secondes - conversion si en minutes)
        const waitTime = parseInt(recipeData.wait_time?.value) || 0;
        const waitTimeInSeconds = recipeData.wait_time?.unit === 'min' ? waitTime * 60 : waitTime;
        
        setTotalChemicalDuration(chemicalTotal + waitTimeInSeconds);
      }
      
      // Générer les données pour le graphique
      generateChartData();
    }
  }, [recipeData]);
  
// Fonction pour obtenir une couleur pour chaque type de gaz - couleurs plus contrastées
const getGasColor = (gas, alpha = 1) => {
  const colors = {
    'C2H2': `rgba(20, 150, 20, ${alpha})`, // Vert plus prononcé
    'N2': `rgba(0, 100, 255, ${alpha})`,   // Bleu plus prononcé
    'H2': `rgba(153, 0, 255, ${alpha})`,   // Violet plus vif
    'default': `rgba(255, 100, 0, ${alpha})` // Orange plus vif
  };
  
  return colors[gas] || colors.default;
};

// Fonction pour générer les données du graphique - correction du bug avec la dernière étape du cycle thermique
const generateChartData = () => {
  if (!recipeData?.thermal_cycle || !recipeData?.chemical_cycle) return;
  
  const thermalCycle = recipeData.thermal_cycle;
  const chemicalCycle = recipeData.chemical_cycle;
  
  // Points pour la courbe de température
  let temperaturePoints = [];
  
  // La température commence à la température cellule, pas à zéro
  const cellTemp = parseInt(recipeData.cell_temp?.value) || 20;
  
  // Temps d'attente avant le cycle thermique (en minutes)
  const waitTime = parseInt(recipeData.wait_time?.value) || 0;
  const waitTimeInMinutes = recipeData.wait_time?.unit === 'min' 
    ? waitTime 
    : waitTime / 60;
  
  // Ajouter le point initial au temps 0 et à la température cellule
  temperaturePoints.push({ x: 0, y: cellTemp });
  
  // Point après le temps d'attente, toujours à la même température
  temperaturePoints.push({ x: waitTimeInMinutes, y: cellTemp });
  
  // Timeoffset commence après le temps d'attente
  let timeOffset = waitTimeInMinutes;
  
  // Construire la courbe de température
  thermalCycle.forEach((step, index) => {
    const duration = parseInt(step.duration) || 0;
    const setpoint = parseInt(step.setpoint) || 0;
    
    // Calculer la température de départ pour cette étape
    const startTemp = index === 0 ? cellTemp : parseInt(thermalCycle[index - 1].setpoint) || 0;
    
    if (step.ramp === 'up' || step.ramp === 'down') {
      // Pour une rampe montante/descendante, on utilise une durée standard de 1 minute
      temperaturePoints.push({ x: timeOffset + 1, y: setpoint }); // Rampe de 1 minute
      timeOffset += 1; // Ajouter 1 minute pour la rampe
    } 
    else if (step.ramp === 'continue') {
      // Pour un palier, on maintient la température constante pendant la durée spécifiée
      temperaturePoints.push({ x: timeOffset, y: setpoint });
      temperaturePoints.push({ x: timeOffset + duration, y: setpoint });
      timeOffset += duration;
    }
  });
  
  // CORRECTION: Récupérer la dernière température du cycle thermique avant la rampe finale
  const finalThermalTimestamp = timeOffset;
  const lastStep = thermalCycle[thermalCycle.length - 1];
  const lastTemp = lastStep ? parseInt(lastStep.setpoint) || 0 : cellTemp;
  
  // IMPORTANT: Vérifier si la dernière étape est un palier (continue)
  // Dans ce cas, le palier est déjà ajouté ci-dessus
  // Si la dernière étape est une rampe, nous avons seulement ajouté le point final
  // mais nous devons maintenir cette température pendant la durée spécifiée
  if (lastStep && (lastStep.ramp === 'up' || lastStep.ramp === 'down')) {
    const duration = parseInt(lastStep.duration) || 0;
    if (duration > 1) { // Si la durée est supérieure à la rampe de 1 minute
      // Ajouter un palier à la température finale pendant (durée - 1) minutes
      // La première minute était pour la rampe
      temperaturePoints.push({ x: timeOffset + (duration - 1), y: lastTemp });
      timeOffset += (duration - 1);
    }
  }
  
  // Ajouter une rampe finale vers 0°C (durée de 1 minute) depuis la dernière température
  temperaturePoints.push({ x: timeOffset + 1, y: 0 });
  const totalThermalTime = timeOffset + 1; // Inclut la rampe finale
  
  // Le reste de la fonction reste inchangé
  // Construire les courbes de débit de gaz
  const gasDatasets = {};
  
  // Initialiser les datasets pour chaque gaz potentiellement utilisé
  const gasTypes = [recipeData.selected_gas1, recipeData.selected_gas2, recipeData.selected_gas3].filter(Boolean);
  
  // Parcourir le cycle chimique et créer des segments horizontaux pour chaque gaz
  let chemTimeOffset = waitTimeInMinutes;
  
  // Créer des datasets vides pour chaque gaz au départ
  gasTypes.forEach(gas => {
    gasDatasets[gas] = {
      label: `Débit ${gas} (Nl/h)`,
      data: [],
      borderColor: getGasColor(gas),
      backgroundColor: getGasColor(gas, 0.2),
      borderWidth: 2,
      pointRadius: 0,
      yAxisID: 'y1',
      fill: false,
      segment: {
        borderColor: ctx => getGasColor(gas),
        borderWidth: 2
      }
    };
  });
  
  // Parcourir chaque étape du cycle chimique
  chemicalCycle.forEach(step => {
    const stepTime = (parseInt(step.time) || 0) / 60; // Convertir secondes en minutes
    const stepEnd = chemTimeOffset + stepTime;
    
    // Pour chaque gaz actif dans cette étape
    step.gases?.forEach(gas => {
      const debit = parseInt(gas.debit) || 0;
      
      if (debit > 0 && gasDatasets[gas.gas]) {
        // Ajouter seulement deux points pour cette section - début et fin
        gasDatasets[gas.gas].data.push({ x: chemTimeOffset, y: debit });
        gasDatasets[gas.gas].data.push({ x: stepEnd, y: debit });
      }
    });
    
    chemTimeOffset = stepEnd;
  });
  
  // Créer le dataset complet
  const datasets = [
    {
      label: 'Température (°C)',
      data: temperaturePoints,
      borderColor: '#dc3545',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      borderWidth: 3,
      pointRadius: 0,
      yAxisID: 'y',
      fill: false
    }
  ];
  
  // Ajouter uniquement les gaz qui ont des données
  for (const gas in gasDatasets) {
    if (gasDatasets[gas].data.length > 0) {
      datasets.push(gasDatasets[gas]);
    }
  }
  
  setChartData({
    datasets
  });
};

// Options pour le graphique - ajustement des échelles
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      type: 'linear',
      title: {
        display: true,
        text: 'Temps (min)'
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)'
      }
    },
    y: {
      type: 'linear',
      position: 'left',
      title: {
        display: true,
        text: 'Température (°C)'
      },
      min: 0,
      suggestedMax: parseInt(recipeData.cell_temp?.value || 0) * 1.1 || 1000,
      grid: {
        color: 'rgba(220, 53, 69, 0.1)'
      },
      ticks: {
        callback: function(value) {
          return value + '°C';
        }
      }
    },
    y1: {
      type: 'linear',
      position: 'right',
      title: {
        display: true,
        text: 'Débit (Nl/h)'
      },
      min: 0,
      suggestedMax: Math.max(
        ...recipeData.chemical_cycle?.flatMap(step => 
          step.gases?.map(g => parseInt(g.debit) || 0) || []
        ) || [3000]
      ) * 1.2, // 20% au-dessus du débit max pour meilleure visibilité
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        callback: function(value) {
          return value + ' Nl/h';
        }
      }
    }
  },
  elements: {
    line: {
      tension: 0 // Lignes droites pour les segments
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        boxWidth: 15,
        padding: 20
      }
    },
    title: {
      display: true,
      text: 'Temperature and gas flow evolution',
      font: {
        size: 16
      },
      padding: {
        bottom: 10
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
            if (label.includes('Température')) {
              label += context.parsed.y + '°C';
            } else if (label.includes('Débit')) {
              label += context.parsed.y + ' Nl/h';
            } else {
              label += context.parsed.y;
            }
          }
          return label;
        },
        title: function(context) {
          return 'Temps: ' + context[0].parsed.x + ' min';
        }
      }
    }
  }
  };

  // Fonction pour formater les données du quenchData
  const renderQuenchData = () => {
    const { gas_quench, oil_quench } = quenchData;
    
    // Vérification si quenchData pourrait être une string à parser
    if (typeof testData?.quench_data === 'string') {
      try {
        const parsedQuench = JSON.parse(testData.quench_data);
      } catch (e) {
        console.error('Failed to parse quench_data string:', e);
      }
    }      // Priorité : oil_quench si il existe et a des données
    if (oil_quench && (
      oil_quench.temperature?.value || 
      oil_quench.inerting_delay?.value || 
      oil_quench.dripping_time?.value || 
      oil_quench.pressure ||
      oil_quench.inerting_pressure || // Nom alternatif possible
      (Array.isArray(oil_quench.speed_parameters) && oil_quench.speed_parameters.length > 0)
    )) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faThermometerHalf} />
            Oil Quench Parameters
          </h4>
          
          {/* Paramètres généraux */}
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            marginBottom: '15px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#e3f2fd' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#1565c0' }}>Parameter</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {oil_quench.temperature?.value && (
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Temperature</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.temperature.value} {oil_quench.temperature.unit || ''}
                    </td>
                  </tr>
                )}
                {oil_quench.inerting_delay?.value && (
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Inerting Delay</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.inerting_delay.value} {oil_quench.inerting_delay.unit || ''}
                    </td>
                  </tr>
                )}
                {oil_quench.dripping_time?.value && (
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Dripping Time</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.dripping_time.value} {oil_quench.dripping_time.unit || ''}
                    </td>
                  </tr>
                )}                {(oil_quench.pressure || oil_quench.inerting_pressure) && (
                  <tr style={{ backgroundColor: '#f9f9f9' }}>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Inerting Pressure</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.pressure || oil_quench.inerting_pressure}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paramètres de vitesse si disponibles */}
          {Array.isArray(oil_quench.speed_parameters) && oil_quench.speed_parameters.length > 0 && (
            <div>
              <h5 style={{ 
                fontSize: '16px', 
                marginBottom: '10px', 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                Speed Parameters
              </h5>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#e3f2fd' }}>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Step</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Speed</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oil_quench.speed_parameters.map((param, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '500' }}>
                          {param.step || index + 1}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.speed || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.duration || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    } 
    // Sinon, afficher gas_quench si il existe et a des données
    else if (gas_quench && (
      (Array.isArray(gas_quench.speed_parameters) && gas_quench.speed_parameters.length > 0) ||
      (Array.isArray(gas_quench.pressure_parameters) && gas_quench.pressure_parameters.length > 0)
    )) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faTachometerAlt} />
            Gas Quench Parameters
          </h4>
          
          {/* Paramètres de vitesse */}
          {Array.isArray(gas_quench.speed_parameters) && gas_quench.speed_parameters.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h5 style={{ 
                fontSize: '16px', 
                marginBottom: '10px', 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                Speed Parameters
              </h5>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#e3f2fd' }}>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Step</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Speed</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gas_quench.speed_parameters.map((param, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '500' }}>
                          {param.step || index + 1}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.speed || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.duration || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Paramètres de pression */}
          {Array.isArray(gas_quench.pressure_parameters) && gas_quench.pressure_parameters.length > 0 && (
            <div>
              <h5 style={{ 
                fontSize: '16px', 
                marginBottom: '10px', 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                Pressure Parameters
              </h5>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#e3f2fd' }}>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Step</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Pressure (mb)</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gas_quench.pressure_parameters.map((param, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '500' }}>
                          {param.step || index + 1}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.pressure || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.duration || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );    } else {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #ccc'
        }}>
          <FontAwesomeIcon icon={faThermometerHalf} style={{ fontSize: '32px', color: '#ccc', marginBottom: '10px' }} />
          <p style={{ margin: 0, fontSize: '16px' }}>No quench data available</p>
        </div>
      );
    }
  };
  // Mise à jour de la gestion du rendu conditionnel  
    return (
    <div style={{ 
      minHeight: '297mm', // Format A4 exact
      maxHeight: '297mm',
      width: '210mm',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '10mm', // Marges réduites mais professionnelles
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pageBreakAfter: 'always',
      pageBreakInside: 'avoid',
      boxSizing: 'border-box',      overflow: 'hidden'
    }}>
      {/* Header moderne avec gradient rouge/orange */}
      <SectionHeader
        title="RECIPE"
        subtitle={`Recipe ${recipeData?.number || 'N/A'}`}
        icon={faFlask}
        testData={testData}
        clientData={clientData}
        sectionType="recipe"
        showSubtitle={true}
      />

      {Object.keys(recipeData).length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px dashed #dee2e6'
        }}>
          <FontAwesomeIcon icon={faFlask} style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }} />
          <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>No recipe data available</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '30px' }}>
          {/* Section Paramètres généraux */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #ffebee'
          }}>
            <h3 style={{ 
              color: '#d32f2f', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faCogs} style={{ color: '#f44336' }} />
              General Parameters
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div style={{ 
                background: '#fffbf0', 
                borderRadius: '8px', 
                padding: '15px',
                border: '1px solid #ffe0b2'
              }}>                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FontAwesomeIcon icon={faTachometerAlt} style={{ fontSize: '16px', color: '#f57c00' }} />
                  <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Wait Pressure</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {recipeData.wait_pressure?.value || '-'} {recipeData.wait_pressure?.unit || ''}
                </div>
              </div>
              
              <div style={{ 
                background: '#fffbf0', 
                borderRadius: '8px', 
                padding: '15px',
                border: '1px solid #ffe0b2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '16px', color: '#f57c00' }} />
                  <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Wait Time</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {recipeData.wait_time?.value || '-'} {recipeData.wait_time?.unit || ''}
                </div>
              </div>
              
              <div style={{ 
                background: '#fffbf0', 
                borderRadius: '8px', 
                padding: '15px',
                border: '1px solid #ffe0b2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FontAwesomeIcon icon={faThermometerHalf} style={{ fontSize: '16px', color: '#f57c00' }} />
                  <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Cell Temperature</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {recipeData.cell_temp?.value || '-'} {recipeData.cell_temp?.unit || ''}
                </div>
              </div>
              
              <div style={{ 
                background: '#fffbf0', 
                borderRadius: '8px', 
                padding: '15px',
                border: '1px solid #ffe0b2'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FontAwesomeIcon icon={faClock} style={{ fontSize: '16px', color: '#f57c00' }} />
                  <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Thermal Duration</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                  {totalThermalDuration || '-'} min
                </div>
              </div>
            </div>
          </div>

          {/* Section Cycle Thermique */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #fff8e1'
          }}>
            <h3 style={{ 
              color: '#f57c00', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faThermometerHalf} style={{ color: '#ff9800' }} />
              Thermal Cycle
            </h3>
            
            <div style={{ 
              background: '#fafafa', 
              borderRadius: '8px', 
              overflow: 'hidden',
              border: '1px solid #e0e0e0'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#ffe0b2' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Step</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Ramp Type</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Temperature (°C)</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Duration (min)</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeData.thermal_cycle?.map((step, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '500' }}>{step.step}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: step.ramp === 'up' ? '#ffebee' : step.ramp === 'down' ? '#e3f2fd' : '#fff3e0',
                          color: step.ramp === 'up' ? '#d32f2f' : step.ramp === 'down' ? '#1976d2' : '#f57c00'
                        }}>
                          {step.ramp === 'up' ? 'Heating' : 
                           step.ramp === 'down' ? 'Cooling' : 
                           step.ramp === 'continue' ? 'Hold' : step.ramp}
                        </span>
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#333' }}>{step.setpoint}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center', color: '#666' }}>{step.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Cycle Chimique */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f3e5f5'
          }}>
            <h3 style={{ 
              color: '#7b1fa2', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>              <FontAwesomeIcon icon={faFlask} style={{ color: '#ab47bc' }} />
              Chemical Cycle
            </h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontWeight: '600', color: '#7b1fa2', marginBottom: '5px' }}>Program Duration:</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
                {Math.floor(totalChemicalDuration / 60)} min {totalChemicalDuration % 60} s
                {recipeData.wait_time?.value && (
                  <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
                    {' '}(including {recipeData.wait_time.value} {recipeData.wait_time.unit} wait time)
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ 
              background: '#fafafa', 
              borderRadius: '8px', 
              overflow: 'hidden',
              border: '1px solid #e0e0e0'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#e1bee7' }}>
                    <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Step</th>
                    <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Duration (s)</th>
                    <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Pressure (mbar)</th>
                    {recipeData.selected_gas1 && (
                      <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>
                        {recipeData.selected_gas1} (Nl/h)
                      </th>
                    )}
                    {recipeData.selected_gas2 && (
                      <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>
                        {recipeData.selected_gas2} (Nl/h)
                      </th>
                    )}
                    {recipeData.selected_gas3 && (
                      <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>
                        {recipeData.selected_gas3} (Nl/h)
                      </th>
                    )}
                    <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Turbine</th>
                  </tr>
                </thead>
                <tbody>
                  {recipeData.chemical_cycle?.map((step, index) => (
                    <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                      <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '500' }}>{step.step}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>{step.time}</td>
                      <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>{step.pressure}</td>
                      {recipeData.selected_gas1 && (
                        <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>
                          {step.gases?.find(g => g.gas === recipeData.selected_gas1)?.debit || '-'}
                        </td>
                      )}
                      {recipeData.selected_gas2 && (
                        <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>
                          {step.gases?.find(g => g.gas === recipeData.selected_gas2)?.debit || '-'}
                        </td>
                      )}
                      {recipeData.selected_gas3 && (
                        <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>
                          {step.gases?.find(g => g.gas === recipeData.selected_gas3)?.debit || '-'}
                        </td>
                      )}
                      <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          background: step.turbine ? '#e8f5e8' : '#ffebee',
                          color: step.turbine ? '#2e7d32' : '#d32f2f'
                        }}>
                          {step.turbine ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#e1bee7', fontWeight: 'bold' }}>
                    <td style={{ padding: '12px 6px', textAlign: 'center', color: '#4a148c' }}>Total</td>
                    <td style={{ padding: '12px 6px', textAlign: 'center', color: '#4a148c' }}>
                      {recipeData.chemical_cycle?.reduce((total, step) => total + parseInt(step.time || 0), 0)} s
                    </td>
                    <td colSpan={recipeData.selected_gas3 ? 5 : recipeData.selected_gas2 ? 4 : 3} 
                        style={{ padding: '12px 6px', textAlign: 'center', color: '#4a148c' }}>
                      {Math.floor(totalChemicalDuration / 60)} min {totalChemicalDuration % 60} s (total including wait time)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Graphique */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e8f5e8'
          }}>
            <h3 style={{ 
              color: '#2e7d32', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faChartLine} style={{ color: '#4caf50' }} />
              Process Parameters Evolution
            </h3>
            
            <div style={{ 
              height: '400px',
              background: '#fafafa',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #e0e0e0'
            }}>
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#666',
                  border: '1px dashed #ccc',
                  borderRadius: '8px',
                  background: 'white'
                }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '48px', color: '#ccc', marginBottom: '15px' }} />
                  <span style={{ fontSize: '16px' }}>Insufficient data to generate chart</span>
                </div>
              )}
            </div>
          </div>

          {/* Section Trempe */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e3f2fd'
          }}>
            <h3 style={{ 
              color: '#1976d2', 
              fontSize: '20px', 
              fontWeight: 'bold', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FontAwesomeIcon icon={faThermometerHalf} style={{ color: '#42a5f5' }} />
              Quench Parameters (Cooling Media)
            </h3>
            
            <div style={{ 
              background: '#fafafa', 
              borderRadius: '8px', 
              padding: '20px',
              border: '1px solid #e0e0e0'
            }}>
              {renderQuenchData()}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <div>
          <strong>Recipe Parameters</strong> - ECM Industrial Analysis
        </div>
        <div>
          {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
        <div>
          Recipe Section
        </div>
      </div>
    </div>
  );
};

export default RecipeSection;
