/**
 * INFRASTRUCTURE: Composant graphique SVG des cycles Recipe pour le PDF
 * Affiche les cycles thermique et chimique sous forme de graphique SVG
 * 
 * Reproduit exactement la logique de RecipePreviewChart.jsx
 * mais en utilisant SVG natif compatible avec React-PDF
 */

import React from 'react';
import { View, Text, Svg, Path, G, Line, Rect, StyleSheet } from '@react-pdf/renderer';
import { SPACING } from '../theme';

// Styles pour le composant
const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  chartContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    padding: 10,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 20,
    height: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 7,
    color: '#333',
  },
  noData: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  axisLabel: {
    fontSize: 6,
    color: '#666',
  }
});

// Couleurs pour les différents gaz (identiques à RecipePreviewChart)
const GAS_COLORS = {
  'C2H2': 'rgb(20, 150, 20)',   // Vert plus prononcé
  'N2': 'rgb(0, 100, 255)',     // Bleu plus prononcé
  'H2': 'rgb(153, 0, 255)',     // Violet plus vif
  'default': 'rgb(255, 100, 0)' // Orange plus vif
};

const TEMPERATURE_COLOR = '#dc3545'; // Rouge

/**
 * Obtient la couleur pour un type de gaz
 */
const getGasColor = (gas) => GAS_COLORS[gas] || GAS_COLORS.default;

/**
 * Composant principal du graphique Recipe Curve pour PDF
 * Reproduit exactement la logique de RecipePreviewChart
 */
const RecipeCurveChartPDF = ({ recipeData, width = 500, height = 220 }) => {
  // Validation des données
  if (!recipeData) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No recipe data available for chart</Text>
      </View>
    );
  }

  const thermalCycle = recipeData.thermal_cycle || [];
  const chemicalCycle = recipeData.chemical_cycle || [];
  
  if (thermalCycle.length === 0 && chemicalCycle.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No thermal or chemical cycle data</Text>
      </View>
    );
  }

  // Paramètres du graphique - plus de padding pour les labels
  const padding = { top: 15, right: 55, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Récupérer les paramètres de la recette (format API snake_case)
  // IMPORTANT: cellTemp est la température de départ, comme dans RecipePreviewChart
  // Gérer les deux formats possibles: { value, unit } ou valeur directe
  const rawCellTemp = typeof recipeData.cell_temp === 'object' 
    ? recipeData.cell_temp?.value 
    : recipeData.cell_temp;
  
  // Si cell_temp n'est pas défini, utiliser le premier setpoint du thermal cycle comme fallback
  // Cela permet d'avoir une valeur cohérente même si cell_temp n'est pas stocké
  let cellTemp = parseInt(rawCellTemp);
  if (!cellTemp || isNaN(cellTemp)) {
    // Fallback: utiliser le premier setpoint du thermal cycle ou 20 par défaut
    const firstThermalStep = thermalCycle[0];
    if (firstThermalStep?.setpoint) {
      cellTemp = parseInt(firstThermalStep.setpoint) || 20;
    } else {
      cellTemp = 20;
    }
  }
  
  const rawWaitTime = typeof recipeData.wait_time === 'object'
    ? recipeData.wait_time?.value
    : recipeData.wait_time;
  const waitTime = parseInt(rawWaitTime) || 0;
  const waitTimeInMinutes = waitTime; // Déjà en minutes
  const waitGas = recipeData.wait_gas;
  const waitFlow = parseFloat(recipeData.wait_flow?.value) || 0;
  
  // Gaz sélectionnés
  const selectedGas1 = recipeData.selected_gas1;
  const selectedGas2 = recipeData.selected_gas2;
  const selectedGas3 = recipeData.selected_gas3;
  
  // Types de gaz utilisés
  const gasTypes = [selectedGas1, selectedGas2, selectedGas3].filter(Boolean);
  
  // Ajouter le wait gas s'il n'y est pas déjà
  if (waitGas && !gasTypes.includes(waitGas)) {
    gasTypes.push(waitGas);
  }

  // ========== CONSTRUIRE LA COURBE DE TEMPÉRATURE ==========
  // Exactement comme RecipePreviewChart.jsx
  let temperaturePoints = [];
  let timeOffset = 0;
  
  // Point initial à la température cellule (x=0, y=cellTemp)
  temperaturePoints.push({ x: 0, y: cellTemp });
  
  // Construire la courbe de température (commence dès t=0)
  thermalCycle.forEach((step, index) => {
    const duration = parseInt(step.duration) || 0;
    const setpoint = parseInt(step.setpoint) || 0;
    // La température de départ pour cette étape
    const startTemp = index === 0 ? cellTemp : (parseInt(thermalCycle[index - 1].setpoint) || 0);
    
    if (step.ramp === 'up' || step.ramp === 'down') {
      // Rampe montante/descendante: de startTemp vers setpoint
      temperaturePoints.push({ x: timeOffset, y: startTemp });
      temperaturePoints.push({ x: timeOffset + duration, y: setpoint });
      timeOffset += duration;
    } else if (step.ramp === 'continue') {
      // Palier: maintenir setpoint constant pendant la durée
      // Note: on utilise setpoint, pas startTemp (conformément à RecipePreviewChart)
      temperaturePoints.push({ x: timeOffset, y: setpoint });
      temperaturePoints.push({ x: timeOffset + duration, y: setpoint });
      timeOffset += duration;
    }
  });
  
  // Rampe finale vers 0°C
  const lastStep = thermalCycle[thermalCycle.length - 1];
  const lastTemp = lastStep ? (parseInt(lastStep.setpoint) || 0) : cellTemp;
  const finalRampDuration = 1;
  temperaturePoints.push({ x: timeOffset, y: lastTemp });
  temperaturePoints.push({ x: timeOffset + finalRampDuration, y: 0 });
  const totalThermalTime = timeOffset + finalRampDuration;

  // ========== CONSTRUIRE LES COURBES DE GAZ ==========
  // Calculer la durée totale du cycle chimique
  const totalChemicalTime = chemicalCycle.reduce((total, step) => {
    return total + ((parseInt(step.time) || 0) / 60); // Convertir secondes en minutes
  }, 0);
  
  // Le cycle chimique se termine en même temps que le cycle thermique
  const chemicalEndTime = totalThermalTime;
  const chemicalStartTime = waitTimeInMinutes;
  const availableChemicalDuration = chemicalEndTime - chemicalStartTime;
  
  // Initialiser les datasets pour chaque gaz
  const gasData = {};
  gasTypes.forEach(gas => {
    gasData[gas] = [];
    
    // Si c'est le wait gas et qu'on a un wait time > 0, ajouter le segment de wait
    if (gas === waitGas && waitTimeInMinutes > 0 && waitFlow > 0) {
      gasData[gas].push({ x: 0, y: waitFlow });
      gasData[gas].push({ x: waitTimeInMinutes, y: waitFlow });
      gasData[gas].push({ x: waitTimeInMinutes, y: 0 }); // Retour à zéro au début du cycle chimique
    } else {
      // Commencer à zéro au début du cycle chimique
      gasData[gas].push({ x: waitTimeInMinutes, y: 0 });
    }
  });
  
  // Parcourir chaque étape du cycle chimique
  let chemTimeOffset = waitTimeInMinutes;
  
  chemicalCycle.forEach((step, stepIndex) => {
    const stepTime = (parseInt(step.time) || 0) / 60; // Convertir secondes en minutes
    
    // Ajuster la durée proportionnellement
    let adjustedStepTime = stepTime;
    if (totalChemicalTime > 0) {
      const scaleFactor = availableChemicalDuration / totalChemicalTime;
      adjustedStepTime = stepTime * scaleFactor;
    }
    
    const stepStart = chemTimeOffset;
    const stepEnd = chemTimeOffset + adjustedStepTime;
    
    // Pour chaque gaz défini, créer les échelons
    gasTypes.forEach(gasType => {
      if (!gasData[gasType]) return;
      
      // Trouver le débit pour ce gaz dans cette étape
      let currentDebit = 0;
      if (step.gases && Array.isArray(step.gases)) {
        const gasInfo = step.gases.find(g => g.gas === gasType);
        currentDebit = gasInfo ? (parseInt(gasInfo.debit) || 0) : 0;
      }
      
      // Récupérer le dernier point
      const lastPoint = gasData[gasType][gasData[gasType].length - 1];
      const previousDebit = lastPoint ? lastPoint.y : 0;
      
      // Si on est au début ou si le débit change
      if (stepIndex === 0 || previousDebit !== currentDebit) {
        // Si le débit précédent n'était pas zéro et change, d'abord descendre à zéro
        if (stepIndex > 0 && previousDebit > 0 && currentDebit !== previousDebit) {
          gasData[gasType].push({ x: stepStart, y: 0 });
        }
        
        // Ajouter le début de l'échelon
        gasData[gasType].push({ x: stepStart, y: currentDebit });
      }
      
      // Ajouter la fin de l'échelon
      gasData[gasType].push({ x: stepEnd, y: currentDebit });
      
      // Si c'est la dernière étape et que le débit n'est pas zéro, redescendre à zéro
      if (stepIndex === chemicalCycle.length - 1 && currentDebit > 0) {
        gasData[gasType].push({ x: stepEnd, y: 0 });
      }
    });
    
    chemTimeOffset = stepEnd;
  });

  // ========== CALCULER LES ÉCHELLES ==========
  // EXACTEMENT comme RecipePreviewChart: suggestedMax = cellTemp * 1.1 || 1000
  // Chart.js utilise suggestedMax qui peut être dépassé, mais pour SVG on doit calculer le max réel
  const maxTempFromData = Math.max(...temperaturePoints.map(p => p.y), 0);
  const suggestedMaxFromCellTemp = (parseInt(cellTemp || 0) * 1.1) || 1000;
  // Le max final doit accommoder les données ET la suggestion
  const suggestedMaxTemp = Math.max(maxTempFromData * 1.1, suggestedMaxFromCellTemp);
  const maxTime = Math.max(totalThermalTime, chemTimeOffset, 1);
  
  // Calculer le débit max (suggestedMax: 3000 comme dans RecipePreviewChart)
  let maxDebit = 100;
  Object.values(gasData).forEach(points => {
    points.forEach(p => {
      if (p.y > maxDebit) maxDebit = p.y;
    });
  });
  const suggestedMaxDebit = Math.max(maxDebit * 1.1, 3000);

  // Fonctions de conversion coordonnées (utilisées pour les paths et gasPaths)
  const scaleX = (x) => (x / maxTime) * chartWidth;
  const scaleYTemp = (y) => chartHeight - (y / suggestedMaxTemp) * chartHeight;
  const scaleYGas = (y) => chartHeight - (y / suggestedMaxDebit) * chartHeight;

  // ========== GRADUATIONS ==========
  // Axe X (temps) - environ 6 graduations
  const xTicks = [];
  const xTickStep = Math.ceil(maxTime / 6) || 1;
  for (let i = 0; i <= maxTime; i += xTickStep) {
    xTicks.push(Math.round(i));
  }
  // S'assurer que le max est inclus
  if (xTicks.length > 0 && xTicks[xTicks.length - 1] < maxTime) {
    xTicks.push(Math.round(maxTime));
  }

  // Axe Y température - valeurs rondes
  const yTempTicks = [];
  const tempTickStep = suggestedMaxTemp <= 500 ? 100 : 
                       suggestedMaxTemp <= 1000 ? 200 : 
                       suggestedMaxTemp <= 2000 ? 500 : 1000;
  for (let i = 0; i <= suggestedMaxTemp; i += tempTickStep) {
    yTempTicks.push(i);
  }

  // Axe Y débit - valeurs rondes
  const yGasTicks = [];
  const gasTickStep = suggestedMaxDebit <= 1000 ? 250 :
                      suggestedMaxDebit <= 2000 ? 500 : 1000;
  for (let i = 0; i <= suggestedMaxDebit; i += gasTickStep) {
    yGasTicks.push(i);
  }

  // Filtrer les gaz qui ont vraiment des données (plus d'un point)
  const activeGases = gasTypes.filter(gas => gasData[gas] && gasData[gas].length > 1);

  return (
    <View style={styles.container} wrap={false}>
      <View style={styles.chartContainer}>
        <Text style={styles.title}>Recipe Cycle Preview</Text>
        
        {/* Légende en haut comme dans RecipePreviewChart */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: TEMPERATURE_COLOR }]} />
            <Text style={styles.legendText}>Température (°C)</Text>
          </View>
          {activeGases.map(gas => (
            <View key={gas} style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: getGasColor(gas) }]} />
              <Text style={styles.legendText}>Débit {gas} (Nl/h)</Text>
            </View>
          ))}
        </View>
        
        {/* Conteneur avec graduations */}
        <View style={{ flexDirection: 'row' }}>
          {/* Labels axe Y gauche (température) */}
          <View style={{ width: padding.left, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 3 }}>
            {yTempTicks.slice().reverse().map((tick, i) => (
              <Text key={`ytick-${i}`} style={{ fontSize: 6, color: TEMPERATURE_COLOR }}>
                {tick}°C
              </Text>
            ))}
          </View>
          
          {/* Graphique SVG */}
          <View style={{ flex: 1 }}>
            <Svg width={chartWidth + padding.right} height={chartHeight + padding.bottom} viewBox={`0 0 ${chartWidth + padding.right} ${chartHeight + padding.bottom}`}>
              {/* Zone de fond du graphique */}
              <Rect
                x={0}
                y={0}
                width={chartWidth}
                height={chartHeight}
                fill="#FFFFFF"
              />
              
              {/* Grille horizontale */}
              <G>
                {yTempTicks.map((tick, i) => {
                  const y = chartHeight - (tick / suggestedMaxTemp) * chartHeight;
                  return (
                    <Line
                      key={`grid-y-${i}`}
                      x1={0}
                      y1={y}
                      x2={chartWidth}
                      y2={y}
                      stroke="rgba(220, 53, 69, 0.1)"
                      strokeWidth={0.5}
                    />
                  );
                })}
              </G>
              
              {/* Grille verticale */}
              <G>
                {xTicks.map((tick, i) => {
                  const x = (tick / maxTime) * chartWidth;
                  return (
                    <Line
                      key={`grid-x-${i}`}
                      x1={x}
                      y1={0}
                      x2={x}
                      y2={chartHeight}
                      stroke="rgba(0, 0, 0, 0.1)"
                      strokeWidth={0.5}
                    />
                  );
                })}
              </G>

              {/* Axe X (bas) */}
              <Line
                x1={0}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#333"
                strokeWidth={1}
              />
              
              {/* Axe Y gauche (température) */}
              <Line
                x1={0}
                y1={0}
                x2={0}
                y2={chartHeight}
                stroke={TEMPERATURE_COLOR}
                strokeWidth={1}
              />
              
              {/* Axe Y droite (débit) */}
              <Line
                x1={chartWidth}
                y1={0}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#666"
                strokeWidth={1}
              />

              {/* Courbe de température */}
              {temperaturePoints.length > 0 && (
                <Path
                  d={temperaturePoints.map((point, i) => {
                    const x = scaleX(point.x);
                    const y = scaleYTemp(point.y);
                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  }).join(' ')}
                  stroke={TEMPERATURE_COLOR}
                  strokeWidth={2.5}
                  fill="none"
                />
              )}

              {/* Courbes des gaz */}
              {Object.entries(gasData).map(([gas, points]) => {
                if (points.length <= 1) return null;
                const pathD = points.map((point, i) => {
                  const x = scaleX(point.x);
                  const y = scaleYGas(point.y);
                  return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                }).join(' ');
                return (
                  <Path
                    key={`gas-${gas}`}
                    d={pathD}
                    stroke={getGasColor(gas)}
                    strokeWidth={1.5}
                    fill="none"
                  />
                );
              })}

              {/* Tick marks sur l'axe X */}
              {xTicks.map((tick, i) => {
                const x = (tick / maxTime) * chartWidth;
                return (
                  <Line
                    key={`xtick-mark-${i}`}
                    x1={x}
                    y1={chartHeight}
                    x2={x}
                    y2={chartHeight + 4}
                    stroke="#333"
                    strokeWidth={1}
                  />
                );
              })}
            </Svg>
            
            {/* Labels axe X (temps) */}
            <View style={{ flexDirection: 'row', height: 12 }}>
              {xTicks.map((tick, i) => {
                const leftPos = (tick / maxTime) * chartWidth - 10;
                return (
                  <Text
                    key={`xlabel-${i}`}
                    style={{
                      position: 'absolute',
                      left: leftPos,
                      width: 20,
                      fontSize: 6,
                      color: '#333',
                      textAlign: 'center',
                    }}
                  >
                    {tick}
                  </Text>
                );
              })}
            </View>
          </View>
          
          {/* Labels axe Y droite (débit gaz) */}
          <View style={{ width: 35, justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: 3 }}>
            {yGasTicks.slice().reverse().map((tick, i) => (
              <Text key={`ygtick-${i}`} style={{ fontSize: 6, color: '#666' }}>
                {tick}
              </Text>
            ))}
          </View>
        </View>
        
        {/* Titre axe X */}
        <Text style={{ fontSize: 7, color: '#333', textAlign: 'center', marginTop: 2 }}>
          Temps (min)
        </Text>
        
        {/* Labels des axes Y */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <Text style={[styles.axisLabel, { color: TEMPERATURE_COLOR }]}>Temp. (°C)</Text>
          <Text style={styles.axisLabel}>Débit (Nl/h)</Text>
        </View>
      </View>
    </View>
  );
};

export default RecipeCurveChartPDF;
