import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';

const RecipeSection = ({ testData, recipeData: passedRecipeData }) => {
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
      : testData?.recipeData) || {};
  const quenchData = testData?.quench_data || {};
  
  // Formater la date
  const formattedDate = testData?.testDate 
    ? format(new Date(testData.testDate), 'd MMMM yyyy', { locale: fr }) 
    : 'Non spécifiée';

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
      text: 'Évolution de la température et des débits de gaz',
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
    
    if (oil_quench && Object.keys(oil_quench).length > 0) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Oil Quench</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #dee2e6' }}>Paramètre</th>
                <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Valeur</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>Temperature</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  {oil_quench.temperature?.value || '-'} {oil_quench.temperature?.unit || ''}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>Inerting Delay</td>
                <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                  {oil_quench.inerting_delay?.value || '-'} {oil_quench.inerting_delay?.unit || ''}
                </td>
              </tr>
              {oil_quench.dripping_time?.value && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>Dripping Time</td>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                    {oil_quench.dripping_time.value} {oil_quench.dripping_time.unit || ''}
                  </td>
                </tr>
              )}
              {oil_quench.pressure && (
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>Pressure</td>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                    {oil_quench.pressure}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {oil_quench.speed_parameters?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h5 style={{ fontSize: '14px', marginBottom: '5px' }}>Paramètres de vitesse</h5>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Étape</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Vitesse</th>
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Durée (s)</th>
                  </tr>
                </thead>
                <tbody>
                  {oil_quench.speed_parameters.map((param, index) => (
                    <tr key={index}>
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{param.step}</td>
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{param.speed || '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{param.duration || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    } else if (gas_quench && Object.keys(gas_quench).length > 0) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Gas Quench</h4>
          {gas_quench.speed_parameters && (
            <div style={{ marginTop: '10px' }}>
              <h5 style={{ fontSize: '14px', marginBottom: '5px' }}>Speed Parameters</h5>
              <pre>{JSON.stringify(gas_quench.speed_parameters, null, 2)}</pre>
            </div>
          )}
          {gas_quench.pressure_parameters && (
            <div style={{ marginTop: '10px' }}>
              <h5 style={{ fontSize: '14px', marginBottom: '5px' }}>Pressure Parameters</h5>
              <pre>{JSON.stringify(gas_quench.pressure_parameters, null, 2)}</pre>
            </div>
          )}
        </div>
      );
    } else {
      return <div className="text-muted">Aucune donnée de trempe disponible</div>;
    }
  };

  // Mise à jour de la gestion du rendu conditionnel
  return (
    <div className="report-section recipe-section" style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        borderBottom: '2px solid #dc3545', 
        paddingBottom: '5px', 
        marginBottom: '15px',
        color: '#c82333' 
      }}>
        Recette
      </h3>
      
      {Object.keys(recipeData).length === 0 ? (
        <div className="text-center py-5 my-4" style={{ border: '1px dashed #dee2e6', borderRadius: '4px' }}>
          <p className="text-muted mb-0">Aucune donnée de recette disponible</p>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px' 
          }}>
            <div>
              <strong>Numéro de recette:</strong> {recipeData.number || 'Non spécifié'}
            </div>
            <div>
              <strong>Date de l'essai:</strong> {formattedDate}
            </div>
          </div>
          
          {/* Section des paramètres généraux */}
          <div style={{ 
            padding: '15px', 
            border: '1px solid #dee2e6', 
            borderRadius: '4px',
            marginBottom: '20px',
            backgroundColor: 'white' 
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '5px' 
            }}>
              Paramètres généraux
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="parameter">
                <strong>Pression d'attente:</strong> {recipeData.wait_pressure?.value || '-'} {recipeData.wait_pressure?.unit || ''}
              </div>
              <div className="parameter">
                <strong>Temps d'attente:</strong> {recipeData.wait_time?.value || '-'} {recipeData.wait_time?.unit || ''}
              </div>
              <div className="parameter">
                <strong>Température cellule:</strong> {recipeData.cell_temp?.value || '-'} {recipeData.cell_temp?.unit || ''}
              </div>
              <div className="parameter">
                <strong>Durée du programme thermique:</strong> {totalThermalDuration || '-'} min
              </div>
            </div>
            
            {/* Tableau du thermal cycle */}
            <h5 style={{ fontSize: '14px', marginTop: '15px', marginBottom: '10px' }}>
              Cycle thermique
            </h5>
            
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Étape</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Type de rampe</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Température (°C)</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Durée (min)</th>
                </tr>
              </thead>
              <tbody>
                {recipeData.thermal_cycle?.map((step, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{step.step}</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {step.ramp === 'up' ? 'Montée' : 
                       step.ramp === 'down' ? 'Descente' : 
                       step.ramp === 'continue' ? 'Pallier' : step.ramp}
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{step.setpoint}</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{step.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Section du cycle chimique */}
          <div style={{ 
            padding: '15px', 
            border: '1px solid #dee2e6', 
            borderRadius: '4px',
            marginBottom: '20px',
            backgroundColor: 'white' 
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '5px' 
            }}>
              Cycle chimique
            </h4>
            
            {/* Affichage de la durée du programme chimique */}
            <div style={{ marginBottom: '10px' }}>
              <strong>Durée du programme chimique:</strong> {Math.floor(totalChemicalDuration / 60)} min {totalChemicalDuration % 60} s
              {recipeData.wait_time?.value && (
                <span> (incluant {recipeData.wait_time.value} {recipeData.wait_time.unit} de temps d'attente)</span>
              )}
            </div>
            
            {/* Table du cycle chimique avec colonnes pour chaque gaz */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Étape</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Durée (s)</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Pression (mbar)</th>
                  {recipeData.selected_gas1 && (
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {recipeData.selected_gas1} (Nl/h)
                    </th>
                  )}
                  {recipeData.selected_gas2 && (
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {recipeData.selected_gas2} (Nl/h)
                    </th>
                  )}
                  {recipeData.selected_gas3 && (
                    <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {recipeData.selected_gas3} (Nl/h)
                    </th>
                  )}
                  <th style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Turbine</th>
                </tr>
              </thead>
              <tbody>
                {recipeData.chemical_cycle?.map((step, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{step.step}</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{step.time}</td>
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>{step.pressure}</td>
                    {recipeData.selected_gas1 && (
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        {step.gases?.find(g => g.gas === recipeData.selected_gas1)?.debit || '-'}
                      </td>
                    )}
                    {recipeData.selected_gas2 && (
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        {step.gases?.find(g => g.gas === recipeData.selected_gas2)?.debit || '-'}
                      </td>
                    )}
                    {recipeData.selected_gas3 && (
                      <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                        {step.gases?.find(g => g.gas === recipeData.selected_gas3)?.debit || '-'}
                      </td>
                    )}
                    <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                      {step.turbine ? 'Oui' : 'Non'}
                    </td>
                  </tr>
                ))}
                {/* Ligne de totaux */}
                <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>Total</td>
                  <td style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                    {recipeData.chemical_cycle?.reduce((total, step) => total + parseInt(step.time || 0), 0)} s
                  </td>
                  <td colSpan={recipeData.selected_gas3 ? 5 : recipeData.selected_gas2 ? 4 : 3} 
                      style={{ padding: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
                    {Math.floor(totalChemicalDuration / 60)} min {totalChemicalDuration % 60} s (total incluant temps d'attente)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Section du graphique */}
          <div style={{ 
            padding: '15px', 
            border: '1px solid #dee2e6', 
            borderRadius: '4px',
            marginBottom: '20px',
            backgroundColor: 'white' 
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '5px' 
            }}>
              Évolution des paramètres du procédé
            </h4>
            
            <div style={{ height: '400px' }}>
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div style={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: '#6c757d',
                  border: '1px dashed #dee2e6',
                  borderRadius: '4px'
                }}>
                  Données insuffisantes pour générer le graphique
                </div>
              )}
            </div>
          </div>
          
          {/* Section de trempe */}
          <div style={{ 
            padding: '15px', 
            border: '1px solid #dee2e6', 
            borderRadius: '4px',
            backgroundColor: 'white' 
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              marginBottom: '15px', 
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '5px' 
            }}>
              Paramètres de trempe (Cooling Media)
            </h4>
            
            {renderQuenchData()}
          </div>
        </>
      )}
    </div>
  );
};

export default RecipeSection;
