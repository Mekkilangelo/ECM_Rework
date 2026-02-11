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
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendLine: {
    width: 15,
    height: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
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
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#333',
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

  // Paramètres du graphique - Expanded right padding for shifted axis
  const padding = { top: 25, right: 60, bottom: 20, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Récupérer les paramètres de la recette (format API snake_case)
  // IMPORTANT: cellTemp est la température de départ, comme dans RecipePreviewChart
  // Gérer les deux formats possibles: { value, unit } ou valeur directe
  const rawCellTemp = typeof recipeData.cell_temp === 'object'
    ? recipeData.cell_temp?.value
    : recipeData.cell_temp;
  const cellTemp = parseInt(rawCellTemp) || 20;

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

  // Point final au dernier setpoint (pas de chute artificielle à 0°C)
  const lastStep = thermalCycle[thermalCycle.length - 1];
  const lastTemp = lastStep ? (parseInt(lastStep.setpoint) || 0) : cellTemp;
  temperaturePoints.push({ x: timeOffset, y: lastTemp });
  const totalThermalTime = timeOffset;

  // ========== CONSTRUIRE LES COURBES DE GAZ ==========
  // Le cycle chimique garde sa durée réelle (pas d'étirement pour matcher le thermique)

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

    const stepStart = chemTimeOffset;
    const stepEnd = chemTimeOffset + stepTime;

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

  // 1. TEMPÉRATURE
  // Trouver le max réel des données
  const maxTempFromData = Math.max(...temperaturePoints.map(p => p.y), 0);
  // Définir le pas (step)
  let tempTickStep = 100;
  if (maxTempFromData > 500) tempTickStep = 200;
  if (maxTempFromData > 1200) tempTickStep = 500;

  // Calculer le max de l'échelle (arrondi au step supérieur)
  let domainMaxTemp = Math.ceil(maxTempFromData / tempTickStep) * tempTickStep;

  // Si la donnée est trop proche du bord haut (> 90%), ajouter un step de marge
  if (maxTempFromData > 0 && (maxTempFromData / domainMaxTemp) > 0.90) {
    domainMaxTemp += tempTickStep;
  }
  domainMaxTemp = Math.max(domainMaxTemp, 500);

  // 2. GAZ (Unified Axis)
  let maxDebit = 0;
  Object.values(gasData).forEach(points => {
    points.forEach(p => {
      if (p.y > maxDebit) maxDebit = p.y;
    });
  });

  // Pas pour les gaz
  let gasTickStep = 250;
  if (maxDebit > 1000) gasTickStep = 500;
  if (maxDebit > 3000) gasTickStep = 1000;

  // Max échelle gaz
  let domainMaxDebit = Math.ceil(maxDebit / gasTickStep) * gasTickStep;
  if (maxDebit > 0 && (maxDebit / domainMaxDebit) > 0.90) {
    domainMaxDebit += gasTickStep;
  }
  domainMaxDebit = Math.max(domainMaxDebit, 500);

  // 3. TEMPS
  const maxTime = Math.max(totalThermalTime, chemTimeOffset, 1);

  // Fonctions de scale
  const scaleX = (x) => (x / maxTime) * chartWidth;
  const scaleYTemp = (y) => chartHeight - (y / domainMaxTemp) * chartHeight;
  const scaleYGas = (y) => chartHeight - (y / domainMaxDebit) * chartHeight;

  // ========== GRADUATIONS ==========

  // Valeurs clés: setpoints température et temps de transition
  const keySetpoints = [...new Set([
    cellTemp,
    ...thermalCycle.map(s => parseInt(s.setpoint) || 0)
  ].filter(v => v > 0 && v <= domainMaxTemp))];

  const keyTimes = [];
  { let t = 0;
    thermalCycle.forEach(step => {
      t += parseInt(step.duration) || 0;
      keyTimes.push(Math.round(t));
    });
  }

  // X Ticks: graduations régulières + temps de transition réels
  const xTicksRegular = [];
  const xTickStep = Math.ceil(maxTime / 6) || 1;
  for (let i = 0; i <= maxTime; i += xTickStep) xTicksRegular.push(Math.round(i));
  if (xTicksRegular[xTicksRegular.length - 1] < maxTime) xTicksRegular.push(Math.round(maxTime));
  // Fusionner avec les temps de transition, dédupliquer et trier
  const xTicksSet = new Set(xTicksRegular);
  keyTimes.forEach(t => { if (t > 0 && t <= maxTime) xTicksSet.add(t); });
  const xTicks = [...xTicksSet].sort((a, b) => a - b);

  // Y Temp Ticks: graduations régulières + setpoints réels
  const yTempTicksRegular = [];
  for (let i = 0; i <= domainMaxTemp; i += tempTickStep) yTempTicksRegular.push(i);
  const yTempTicksSet = new Set(yTempTicksRegular);
  keySetpoints.forEach(v => yTempTicksSet.add(v));
  const yTempTicks = [...yTempTicksSet].sort((a, b) => a - b);

  // Y Gas Ticks
  const yGasTicks = [];
  for (let i = 0; i <= domainMaxDebit; i += gasTickStep) yGasTicks.push(i);

  // Layout pour l'axe Gaz décalé
  const gasAxisOffset = 35; // Décalage vers la droite (en pixels)

  const activeGases = gasTypes.filter(gas => gasData[gas] && gasData[gas].length > 1);

  return (
    <View style={styles.container} wrap={false}>
      <View style={styles.chartContainer}>
        <Text style={styles.title}>Recipe Cycle Preview</Text>

        {/* Légende Compacte */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: TEMPERATURE_COLOR }]} />
            <Text style={styles.legendText}>Temperature</Text>
          </View>
          {activeGases.map(gas => (
            <View key={gas} style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: getGasColor(gas) }]} />
              <Text style={styles.legendText}>Flow {gas}</Text>
            </View>
          ))}
        </View>

        {/* Zone Graphique + Axes */}
        <View style={{ flexDirection: 'row', height: chartHeight + padding.top + padding.bottom - 10 }}>

          {/* COLONNE GAUCHE: Labels Température - setpoints en gras rouge */}
          <View style={{ width: padding.left, height: '100%', position: 'relative' }}>
            <Text style={{ position: 'absolute', top: 0, right: 5, fontSize: 7, fontFamily: 'Helvetica-Bold', color: TEMPERATURE_COLOR, textAlign: 'right', width: 50 }}>T.(°C)</Text>
            <View style={{ marginTop: padding.top, height: chartHeight, position: 'relative' }}>
              {yTempTicks.map((tick, i) => {
                const isKey = keySetpoints.includes(tick);
                const top = scaleYTemp(tick) - 4;
                return (
                  <Text key={`ytick-${i}`} style={{
                    position: 'absolute',
                    top,
                    right: 5,
                    fontSize: isKey ? 7.5 : 6.5,
                    fontFamily: 'Helvetica-Bold',
                    color: isKey ? '#b91c1c' : '#999',
                  }}>{tick}</Text>
                );
              })}
            </View>
          </View>

          {/* COLONNE CENTRALE: SVG */}
          <View style={{ flex: 1 }}>
            {/* On agrandit le SVG pour inclure l'axe décalé à droite */}
            <Svg width={chartWidth + gasAxisOffset + 30} height={chartHeight + 15} viewBox={`-2 -5 ${chartWidth + gasAxisOffset + 30} ${chartHeight + 15}`}>

              {/* Grille Horizontale (Temp) - setpoints en trait plein rouge */}
              <G>
                {yTempTicks.map((tick, i) => {
                  const y = scaleYTemp(tick);
                  if (tick === 0) return null;
                  const isKey = keySetpoints.includes(tick);
                  return (
                    <Line
                      key={`grid-y-${i}`}
                      x1={0} y1={y} x2={chartWidth} y2={y}
                      stroke={isKey ? 'rgba(220, 53, 69, 0.35)' : '#E5E7EB'}
                      strokeWidth={isKey ? 0.8 : 0.5}
                      strokeDasharray={isKey ? undefined : '2 2'}
                    />
                  );
                })}
              </G>

              {/* Grille Verticale (Temps) - transitions en trait plein rouge */}
              <G>
                {xTicks.map((tick, i) => {
                  const x = scaleX(tick);
                  if (tick === 0) return null;
                  const isKey = keyTimes.includes(tick);
                  return (
                    <Line
                      key={`grid-x-${i}`}
                      x1={x} y1={0} x2={x} y2={chartHeight}
                      stroke={isKey ? 'rgba(220, 53, 69, 0.35)' : '#E5E7EB'}
                      strokeWidth={isKey ? 0.8 : 0.5}
                      strokeDasharray={isKey ? undefined : '2 2'}
                    />
                  );
                })}
              </G>

              {/* Courbe Température */}
              {temperaturePoints.length > 0 && (
                <Path
                  d={temperaturePoints.map((point, i) => {
                    const x = scaleX(point.x);
                    const y = scaleYTemp(point.y);
                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  }).join(' ')}
                  stroke={TEMPERATURE_COLOR}
                  strokeWidth={2.0}
                  fill="none"
                />
              )}

              {/* Courbes Gaz (Toutes sur le même axe Y décalé) */}
              {Object.entries(gasData).map(([gas, points]) => {
                if (points.length <= 1) return null;
                // Rendu stepped: horizontal d'abord, puis vertical (comme Chart.js stepped: true)
                const pathD = points.map((point, i) => {
                  const x = scaleX(point.x);
                  const y = scaleYGas(point.y);
                  if (i === 0) return `M ${x} ${y}`;
                  const prevY = scaleYGas(points[i - 1].y);
                  // D'abord horizontal au même y que le point précédent, puis vertical au nouveau y
                  return `L ${x} ${prevY} L ${x} ${y}`;
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

              {/* --- AXES PRINCIPAUX --- */}
              {/* Axe Y Gauche (Temp) */}
              <Line x1={0} y1={0} x2={0} y2={chartHeight} stroke="#000000" strokeWidth={1} />

              {/* Axe X (Temps) */}
              <Line x1={0} y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#000000" strokeWidth={1} />

              {/* Axe Y Droite (Gaz) - DÉCALÉ */}
              {/* Ligne verticale décalée de gasAxisOffset pixels */}
              <Line
                x1={chartWidth + gasAxisOffset}
                y1={0}
                x2={chartWidth + gasAxisOffset}
                y2={chartHeight}
                stroke="#475569"
                strokeWidth={1}
              />

              {/* Ticks de l'axe décalé */}
              <G>
                {yGasTicks.map((tick, i) => {
                  const y = scaleYGas(tick);
                  return (
                    <Line
                      key={`gas-tick-${i}`}
                      x1={chartWidth + gasAxisOffset}
                      y1={y}
                      x2={chartWidth + gasAxisOffset + 3} // Petit trait vers l'extérieur
                      y2={y}
                      stroke="#475569"
                      strokeWidth={1}
                    />
                  );
                })}
              </G>

              {/* --- Flèches --- */}
              <Path d="M 0 0 L -3 5 L 3 5 Z" fill="#000000" /> {/* Temp */}
              <Path d={`M ${chartWidth} ${chartHeight} L ${chartWidth - 5} ${chartHeight - 3} L ${chartWidth - 5} ${chartHeight + 3} Z`} fill="#000000" /> {/* Temps */}

              {/* Flèche Gaz Axis */}
              <Path
                d={`M ${chartWidth + gasAxisOffset} 0 L ${chartWidth + gasAxisOffset - 3} 5 L ${chartWidth + gasAxisOffset + 3} 5 Z`}
                fill="#475569"
              />

            </Svg>

            {/* Labels Axe X (Temps) - transitions en gras rouge */}
            <View style={{ flexDirection: 'row', height: 12, marginTop: -5 }}>
              <Text style={{ position: 'absolute', right: padding.right - 10, top: 0, fontSize: 7, fontFamily: 'Helvetica-Bold' }}>min</Text>
              {xTicks.map((tick, i) => {
                const leftPos = Math.min((tick / maxTime) * chartWidth - 5, chartWidth - 10);
                const isKey = keyTimes.includes(tick);
                return (
                  <Text key={`xlabel-${i}`} style={{
                    position: 'absolute',
                    left: leftPos,
                    width: 24,
                    fontSize: isKey ? 7.5 : 6.5,
                    fontFamily: 'Helvetica-Bold',
                    textAlign: 'center',
                    color: isKey ? '#b91c1c' : '#666',
                  }}>
                    {tick}
                  </Text>
                );
              })}
            </View>
          </View>

          {/* COLONNE DROITE: Labels Débit avec Décalage */}
          <View style={{ width: padding.right, height: '100%', position: 'relative' }}>
            {/* Titre Axe Gaz */}
            <Text style={{
              position: 'absolute',
              top: 0,
              left: gasAxisOffset - 10,
              fontSize: 7,
              fontFamily: 'Helvetica-Bold',
              color: '#475569',
              width: 50
            }}>Nl/h</Text>

            {/* Ticks alignés verticalement avec l'axe décalé */}
            <View style={{
              marginTop: padding.top,
              height: chartHeight,
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingLeft: gasAxisOffset + 5 // Pousse les labels à droite de l'axe décalé
            }}>
              {yGasTicks.slice().reverse().map((tick, i) => (
                <Text key={`ygastick-${i}`} style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#475569' }}>
                  {tick}
                </Text>
              ))}
            </View>
          </View>

        </View>
      </View>
    </View>
  );
};

export default RecipeCurveChartPDF;
