import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-bootstrap';

const RecipePreviewChart = React.memo(({ formData }) => {
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

  // Memoization des données pertinentes pour éviter les re-calculs inutiles
  const relevantRecipeData = useMemo(() => {
    if (!formData?.recipeData) return null;
    
    return {
      thermalCycle: formData.recipeData.thermalCycle,
      chemicalCycle: formData.recipeData.chemicalCycle,
      cellTemp: formData.recipeData.cellTemp,
      waitTime: formData.recipeData.waitTime,
      waitTimeUnit: formData.recipeData.waitTimeUnit,
      selectedGas1: formData.recipeData.selectedGas1,
      selectedGas2: formData.recipeData.selectedGas2,
      selectedGas3: formData.recipeData.selectedGas3
    };
  }, [
    formData?.recipeData?.thermalCycle,
    formData?.recipeData?.chemicalCycle,
    formData?.recipeData?.cellTemp,
    formData?.recipeData?.waitTime,
    formData?.recipeData?.waitTimeUnit,
    formData?.recipeData?.selectedGas1,
    formData?.recipeData?.selectedGas2,
    formData?.recipeData?.selectedGas3
  ]);  const generateChartData = useCallback(() => {
    try {
      // Vérification des données disponibles
      if (!relevantRecipeData) {
        setError("Aucune donnée de recette disponible.");
        return;
      }

      // Convertir les données du formulaire au format attendu par le graphique
      const thermalCycle = relevantRecipeData.thermalCycle ? 
        relevantRecipeData.thermalCycle.map(cycle => ({
          step: cycle.step,
          ramp: cycle.ramp,
          setpoint: cycle.setpoint,
          duration: cycle.duration
        })) : [];

      const chemicalCycle = relevantRecipeData.chemicalCycle ? 
        relevantRecipeData.chemicalCycle.map(cycle => {
          const gases = [];
          
          if (relevantRecipeData.selectedGas1 && cycle.debit1) {
            gases.push({
              gas: relevantRecipeData.selectedGas1,
              debit: cycle.debit1,
              index: 1
            });
          }          
          if (relevantRecipeData.selectedGas2 && cycle.debit2) {
            gases.push({
              gas: relevantRecipeData.selectedGas2,
              debit: cycle.debit2,
              index: 2
            });
          }
          
          if (relevantRecipeData.selectedGas3 && cycle.debit3) {
            gases.push({
              gas: relevantRecipeData.selectedGas3,
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
      const cellTemp = parseInt(relevantRecipeData.cellTemp) || 20;
      
      // Temps d'attente avant le cycle thermique (en minutes)
      const waitTime = parseInt(relevantRecipeData.waitTime) || 0;
      // Le waitTime est maintenant directement en minutes
      const waitTimeInMinutes = waitTime;
      
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
          // La durée indiquée est maintenant le temps de la rampe pour atteindre la consigne
          temperaturePoints.push({ x: timeOffset, y: startTemp });
          temperaturePoints.push({ x: timeOffset + duration, y: setpoint });
          timeOffset += duration;
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
      
      // Ajouter une rampe finale vers 0°C (durée par défaut de 1 minute si pas spécifiée)
      const finalRampDuration = 1; // Vous pouvez ajuster cette valeur ou la rendre configurable
      temperaturePoints.push({ x: timeOffset, y: lastTemp });
      temperaturePoints.push({ x: timeOffset + finalRampDuration, y: 0 });
      const totalThermalTime = timeOffset + finalRampDuration;
      
      // Construire les courbes de débit de gaz
      const gasDatasets = {};
        // Initialiser les datasets pour chaque gaz potentiellement utilisé
      const gasTypes = [
        relevantRecipeData.selectedGas1, 
        relevantRecipeData.selectedGas2, 
        relevantRecipeData.selectedGas3
      ].filter(Boolean);
      
      // Parcourir le cycle chimique et créer des segments horizontaux pour chaque gaz
      let chemTimeOffset = waitTimeInMinutes;
      
      // Créer des datasets vides pour chaque gaz au départ
      gasTypes.forEach(gas => {
        gasDatasets[gas] = {
          label: `Débit ${gas} (Nl/h)`,
          data: [
            // Commencer à zéro au début du cycle chimique
            { x: waitTimeInMinutes, y: 0 }
          ],
          borderColor: getGasColor(gas),
          backgroundColor: getGasColor(gas, 0.2),
          borderWidth: 2,
          pointRadius: 0,
          yAxisID: 'y1',
          fill: false,
          stepped: true, // Créer des échelons
          segment: {
            borderColor: ctx => getGasColor(gas),
            borderWidth: 2
          }
        };
      });
      
      // Parcourir chaque étape du cycle chimique
      chemicalCycle.forEach((step, stepIndex) => {
        const stepTime = (parseInt(step.time) || 0) / 60; // Convertir secondes en minutes
        const stepStart = chemTimeOffset;
        const stepEnd = chemTimeOffset + stepTime;
        
        // Pour chaque gaz défini, créer les échelons
        gasTypes.forEach(gasType => {
          const gasData = gasDatasets[gasType];
          if (!gasData) return;
          
          // Trouver le débit pour ce gaz dans cette étape
          let currentDebit = 0;
          if (step.gases && Array.isArray(step.gases)) {
            const gasInfo = step.gases.find(g => g.gas === gasType);
            currentDebit = gasInfo ? (parseInt(gasInfo.debit) || 0) : 0;
          }
          
          // Si c'est la première étape ou si le débit change, ajouter les points d'échelon
          const lastPoint = gasData.data[gasData.data.length - 1];
          const previousDebit = lastPoint ? lastPoint.y : 0;
          
          // Si on est au début ou si le débit change
          if (stepIndex === 0 || previousDebit !== currentDebit) {
            // Si ce n'est pas le premier point et que le débit précédent n'était pas zéro,
            // d'abord descendre à zéro puis monter au nouveau débit
            if (stepIndex > 0 && previousDebit > 0 && currentDebit !== previousDebit) {
              gasData.data.push({ x: stepStart, y: 0 });
            }
            
            // Ajouter le début de l'échelon
            gasData.data.push({ x: stepStart, y: currentDebit });
          }
          
          // Ajouter la fin de l'échelon
          gasData.data.push({ x: stepEnd, y: currentDebit });
          
          // Si c'est la dernière étape et que le débit n'est pas zéro, redescendre à zéro
          if (stepIndex === chemicalCycle.length - 1 && currentDebit > 0) {
            gasData.data.push({ x: stepEnd, y: 0 });
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
      });    } catch (err) {
      console.error("Erreur lors de la génération du graphique:", err);
      setError("Une erreur est survenue lors de la génération du graphique. Vérifiez vos données.");
    }
  }, [relevantRecipeData]);

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
        suggestedMax: parseInt(relevantRecipeData?.cellTemp || 0) * 1.1 || 1000,
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
      },
      point: {
        radius: 0, // Masquer les points sur les courbes chimiques pour un effet échelon plus net
        hoverRadius: 4
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
  };  // Optimized useEffect - only regenerate when relevant recipe data changes
  useEffect(() => {
    generateChartData();
  }, [generateChartData]);

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
      </div>    </div>
  );
});

// Fonction de comparaison personnalisée pour React.memo
const arePropsEqual = (prevProps, nextProps) => {
  // Comparer seulement les données de recette pertinentes
  const prevRecipe = prevProps.formData?.recipeData;
  const nextRecipe = nextProps.formData?.recipeData;
  
  if (!prevRecipe && !nextRecipe) return true;
  if (!prevRecipe || !nextRecipe) return false;
  
  // Comparer les propriétés pertinentes pour le graphique
  return (
    prevRecipe.thermalCycle === nextRecipe.thermalCycle &&
    prevRecipe.chemicalCycle === nextRecipe.chemicalCycle &&
    prevRecipe.cellTemp === nextRecipe.cellTemp &&
    prevRecipe.waitTime === nextRecipe.waitTime &&
    prevRecipe.waitTimeUnit === nextRecipe.waitTimeUnit &&
    prevRecipe.selectedGas1 === nextRecipe.selectedGas1 &&
    prevRecipe.selectedGas2 === nextRecipe.selectedGas2 &&
    prevRecipe.selectedGas3 === nextRecipe.selectedGas3
  );
};

export default React.memo(RecipePreviewChart, arePropsEqual);