import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-bootstrap';

const RecipePreviewChart = ({ formData }) => {
  const { t } = useTranslation();
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  // Fonction pour obtenir une couleur pour chaque type de gaz
  const getGasColor = (gas, alpha = 1) => {
    const colors = {
      'C2H2': `rgba(20, 150, 20, ${alpha})`, // Vert plus prononcé
      'N2': `rgba(0, 100, 255, ${alpha})`,   // Bleu plus prononcé
      'H2': `rgba(153, 0, 255, ${alpha})`,   // Violet plus vif
      'default': `rgba(255, 100, 0, ${alpha})` // Orange plus vif
    };
    
    return colors[gas] || colors.default;
  };

  // Fonction pour générer les données du graphique avec useCallback pour éviter les re-rendus inutiles
  const generateChartData = useCallback(() => {
    try {
      // Vérification des données disponibles
      if (!formData || !formData.recipeData) {
        setError("Aucune donnée de recette disponible.");
        return;
      }

      // Convertir les données du formulaire au format attendu par le graphique
      const thermalCycle = formData.recipeData.thermalCycle ? 
        formData.recipeData.thermalCycle.map(cycle => ({
          step: cycle.step,
          ramp: cycle.ramp,
          setpoint: cycle.setpoint,
          duration: cycle.duration
        })) : [];

      const chemicalCycle = formData.recipeData.chemicalCycle ? 
        formData.recipeData.chemicalCycle.map(cycle => {
          const gases = [];
          
          if (formData.recipeData.selectedGas1 && cycle.debit1) {
            gases.push({
              gas: formData.recipeData.selectedGas1,
              debit: cycle.debit1,
              index: 1
            });
          }
          
          if (formData.recipeData.selectedGas2 && cycle.debit2) {
            gases.push({
              gas: formData.recipeData.selectedGas2,
              debit: cycle.debit2,
              index: 2
            });
          }
          
          if (formData.recipeData.selectedGas3 && cycle.debit3) {
            gases.push({
              gas: formData.recipeData.selectedGas3,
              debit: cycle.debit3,
              index: 3
            });
          }
          
          return {
            step: cycle.step,
            time: cycle.time,
            pressure: cycle.pressure,
            gases: gases,
            turbine: cycle.turbine
          };
        }) : [];
      
      // Vérifier si on a assez de données pour générer le graphique
      if (thermalCycle.length === 0 && chemicalCycle.length === 0) {
        setError("Aucune donnée de cycle thermique ou chimique n'a été ajoutée.");
        return;
      }
      
      setError(null);
      
      // Points pour la courbe de température
      let temperaturePoints = [];
      
      // La température commence à la température cellule, pas à zéro
      const cellTemp = parseInt(formData.recipeData.cellTemp) || 20;
      
      // Temps d'attente avant le cycle thermique (en minutes)
      const waitTime = parseInt(formData.recipeData.waitTime) || 0;
      const waitTimeInMinutes = formData.recipeData.waitTimeUnit === 'min' 
        ? waitTime 
        : waitTime / 60;
      
      // Ajouter le point initial au temps 0 et à la température cellule
      temperaturePoints.push({ x: 0, y: cellTemp });
      
      // Point après le temps d'attente, toujours à la même température
      temperaturePoints.push({ x: waitTimeInMinutes, y: cellTemp });
      
      // Timeoffset commence après le temps d'attente
      let timeOffset = waitTimeInMinutes;
      
      // Stockage des points pour débogage
      let debugPoints = [];
      
      // Construire la courbe de température
      thermalCycle.forEach((step, index) => {
        const duration = parseInt(step.duration) || 0;
        const setpoint = parseInt(step.setpoint) || 0;
        
        // Calculer la température de départ pour cette étape
        const startTemp = index === 0 ? cellTemp : parseInt(thermalCycle[index - 1].setpoint) || 0;
        
        // Stocker des informations de débogage
        debugPoints.push({
          step: step.step,
          ramp: step.ramp,
          setpoint,
          duration,
          timeOffset,
          startTemp
        });
        
        if (step.ramp === 'up' || step.ramp === 'down') {
          // Pour une rampe montante/descendante
          // CORRECTION #1: Ajouter un point intermédiaire pour la pente
          temperaturePoints.push({ x: timeOffset, y: startTemp });
          temperaturePoints.push({ x: timeOffset + 1, y: setpoint }); // Rampe de 1 minute
          timeOffset += 1; // Ajouter 1 minute pour la rampe
          
          // CORRECTION #2: Si la durée est > 1, on ajoute un palier pour le temps restant
          if (duration > 1) {
            temperaturePoints.push({ x: timeOffset + (duration - 1), y: setpoint });
            timeOffset += (duration - 1);
          }
        } 
        else if (step.ramp === 'continue') {
          // Pour un palier, on maintient la température constante pendant la durée spécifiée
          // CORRECTION #3: Utiliser la température définie et non pas la température de départ
          temperaturePoints.push({ x: timeOffset, y: setpoint });
          temperaturePoints.push({ x: timeOffset + duration, y: setpoint });
          timeOffset += duration;
        }
      });
      
      // La dernière étape a déjà été traitée correctement dans la boucle ci-dessus
      const lastStep = thermalCycle[thermalCycle.length - 1];
      const lastTemp = lastStep ? parseInt(lastStep.setpoint) || 0 : cellTemp;
      
      // Ajouter une rampe finale vers 0°C (durée de 1 minute) depuis la dernière température
      temperaturePoints.push({ x: timeOffset, y: lastTemp }); // Point explicite au début de la rampe finale
      temperaturePoints.push({ x: timeOffset + 1, y: 0 });
      const totalThermalTime = timeOffset + 1; // Inclut la rampe finale
      
      // Construire les courbes de débit de gaz
      const gasDatasets = {};
      
      // Initialiser les datasets pour chaque gaz potentiellement utilisé
      const gasTypes = [
        formData.recipeData.selectedGas1, 
        formData.recipeData.selectedGas2, 
        formData.recipeData.selectedGas3
      ].filter(Boolean);
      
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
        if (step.gases && Array.isArray(step.gases)) {
          step.gases.forEach(gas => {
            const debit = parseInt(gas.debit) || 0;
            
            if (debit > 0 && gasDatasets[gas.gas]) {
              // Ajouter seulement deux points pour cette section - début et fin
              gasDatasets[gas.gas].data.push({ x: chemTimeOffset, y: debit });
              gasDatasets[gas.gas].data.push({ x: stepEnd, y: debit });
            }
          });
        }
        
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
      
      // Stocker les informations de débogage
      setDebugInfo({
        cellTemp,
        waitTime,
        waitTimeInMinutes,
        debugPoints,
        temperaturePoints
      });
      
      setChartData({
        datasets
      });
    } catch (err) {
      console.error("Erreur lors de la génération du graphique:", err);
      setError("Une erreur est survenue lors de la génération du graphique. Vérifiez vos données.");
    }
  }, [formData]);

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
        suggestedMax: parseInt(formData.recipeData?.cellTemp || 0) * 1.1 || 1000,
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
        suggestedMax: 3000,
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
        text: 'Prévisualisation: Évolution de la température et des débits de gaz',
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

  // Utilisation de JSON.stringify pour détecter les changements dans les objets formData profondément imbriqués
  useEffect(() => {
    console.log("FormData changed, regenerating chart...");
    generateChartData();
  }, [
    generateChartData,
    JSON.stringify(formData?.recipeData?.thermalCycle),
    JSON.stringify(formData?.recipeData?.chemicalCycle),
    formData?.recipeData?.cellTemp,
    formData?.recipeData?.waitTime,
    formData?.recipeData?.waitTimeUnit,
    formData?.recipeData?.selectedGas1,
    formData?.recipeData?.selectedGas2,
    formData?.recipeData?.selectedGas3
  ]);

  return (
    <div>
      {error && (
        <Alert variant="info">
          {error}
        </Alert>
      )}
      
      <div style={{ height: '400px', marginTop: '20px', marginBottom: '20px' }}>
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
            {error || "Remplissez les cycles thermique et chimique pour voir la prévisualisation du graphique"}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipePreviewChart;