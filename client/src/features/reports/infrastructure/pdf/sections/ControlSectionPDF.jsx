/**
 * INFRASTRUCTURE: Section Contrôle du rapport PDF
 * Affiche uniquement les courbes de filiation (graphiques)
 */

import React from 'react';
import { View, Text, StyleSheet, Svg, Path, Line as SvgLine, Circle } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#DC3545',
    paddingBottom: 3,
    borderBottomWidth: 2,
    borderBottomColor: '#DC3545'
  },
  resultTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 8,
    color: '#333333'
  },
  sampleTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
    marginBottom: 5,
    color: '#555555'
  },
  chartContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDDDDD'
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#333333'
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#DDDDDD'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 3
  },
  legendColor: {
    width: 12,
    height: 2,
    marginRight: 4
  },
  legendText: {
    fontSize: 7,
    color: '#666666'
  },
  axisLabel: {
    fontSize: 7,
    color: '#666666'
  },
  noData: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999999',
    marginTop: 5
  }
});

// Couleurs pour les différentes séries (palette similaire à l'application web)
const SERIES_COLORS = [
  '#FF6384',  // Rose
  '#4BC0C0',  // Turquoise
  '#36A2EB',  // Bleu
  '#FF9F40',  // Orange
  '#9966FF',  // Violet
  '#FFCD56'   // Jaune
];

/**
 * Génère un graphique SVG pour plusieurs courbes de filiation sur le même graphique
 */
const FiliationChart = ({ seriesList, width = 500, height = 250 }) => {
  if (!seriesList || seriesList.length === 0) {
    return null;
  }

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Trouver les min/max pour les échelles en parcourant toutes les séries
  let allDistances = [];
  let allValues = [];
  
  seriesList.forEach(series => {
    if (series.points && series.points.length > 0) {
      allDistances = [...allDistances, ...series.points.map(p => p.distance)];
      allValues = [...allValues, ...series.points.map(p => p.value).filter(v => v !== null && v !== undefined)];
    }
  });
  
  if (allValues.length === 0) return null;

  const minDistance = Math.min(...allDistances);
  const maxDistance = Math.max(...allDistances);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  // Ajouter une marge de 10% en haut et en bas
  const valueRange = maxValue - minValue;
  const yMin = minValue - valueRange * 0.1;
  const yMax = maxValue + valueRange * 0.1;

  // Fonction pour convertir les coordonnées data en coordonnées SVG
  const scaleX = (distance) => {
    return padding.left + (distance - minDistance) / (maxDistance - minDistance) * chartWidth;
  };

  const scaleY = (value) => {
    if (value === null || value === undefined) return null;
    return padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Générer les graduations de l'axe X (distances)
  const xTicks = [];
  const xTickCount = 5;
  for (let i = 0; i <= xTickCount; i++) {
    const distance = minDistance + (maxDistance - minDistance) * (i / xTickCount);
    xTicks.push({
      x: scaleX(distance),
      label: distance.toFixed(1)
    });
  }

  // Générer les graduations de l'axe Y (valeurs HV)
  const yTicks = [];
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const value = yMin + (yMax - yMin) * (i / yTickCount);
    yTicks.push({
      y: scaleY(value),
      label: Math.round(value)
    });
  }

  return (
    <Svg width={width} height={height}>
      {/* Grille horizontale */}
      {yTicks.map((tick, i) => (
        <SvgLine
          key={`grid-h-${i}`}
          x1={padding.left}
          y1={tick.y}
          x2={padding.left + chartWidth}
          y2={tick.y}
          stroke="#E0E0E0"
          strokeWidth={0.5}
        />
      ))}

      {/* Grille verticale */}
      {xTicks.map((tick, i) => (
        <SvgLine
          key={`grid-v-${i}`}
          x1={tick.x}
          y1={padding.top}
          x2={tick.x}
          y2={padding.top + chartHeight}
          stroke="#E0E0E0"
          strokeWidth={0.5}
        />
      ))}

      {/* Axes */}
      <SvgLine
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#333"
        strokeWidth={1}
      />
      <SvgLine
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#333"
        strokeWidth={1}
      />

      {/* Tracer toutes les courbes */}
      {seriesList.map((series, seriesIndex) => {
        if (!series.points || series.points.length === 0) return null;
        
        const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
        
        // Générer le path pour cette courbe
        const pathData = series.points
          .map((point, index) => {
            const x = scaleX(point.distance);
            const y = scaleY(point.value);
            if (y === null) return null;
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
          })
          .filter(d => d !== null)
          .join(' ');

        return (
          <React.Fragment key={`series-${seriesIndex}`}>
            {/* Courbe */}
            <Path
              d={pathData}
              stroke={color}
              strokeWidth={2}
              fill="none"
            />

            {/* Points de données */}
            {series.points.map((point, pointIndex) => {
              const y = scaleY(point.value);
              if (y === null) return null;
              return (
                <Circle
                  key={`point-${seriesIndex}-${pointIndex}`}
                  cx={scaleX(point.distance)}
                  cy={y}
                  r={2.5}
                  fill={color}
                />
              );
            })}
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

/**
 * Section pour afficher toutes les courbes d'un échantillon sur le même graphique
 */
const SampleCurvesSection = ({ sample, sampleNumber }) => {
  if (!sample.curveSeries || sample.curveSeries.length === 0) {
    return null;
  }

  return (
    <View wrap={false}>
      <Text style={styles.sampleTitle}>
        Échantillon {sampleNumber}
        {sample.description && ` - ${sample.description}`}
      </Text>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Courbes de Filiation</Text>
        <FiliationChart seriesList={sample.curveSeries} width={480} height={220} />
        
        <View style={styles.chartLegend}>
          {sample.curveSeries.map((series, index) => {
            const color = SERIES_COLORS[index % SERIES_COLORS.length];
            const validPointsCount = series.points.filter(p => p.value !== null).length;
            
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: color }]} />
                <Text style={styles.legendText}>
                  {series.name || `Série ${index + 1}`} ({validPointsCount} points)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

/**
 * Section pour un résultat complet
 */
const ResultSection = ({ result, resultNumber }) => {
  if (!result.samples || result.samples.length === 0) {
    return null;
  }

  return (
    <View>
      <Text style={styles.resultTitle}>
        Résultat #{resultNumber}
        {result.description && ` - ${result.description}`}
      </Text>
      
      {result.samples.map((sample, index) => (
        <SampleCurvesSection 
          key={index} 
          sample={sample} 
          sampleNumber={sample.sampleNumber || index + 1}
        />
      ))}
    </View>
  );
};

/**
 * Composant principal: Section Contrôle complète
 */
export const ControlSectionPDF = ({ report }) => {
  const resultsData = report?.resultsData;

  if (!resultsData || !resultsData.results || resultsData.results.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Contrôle - Courbes de Filiation</Text>
        <Text style={styles.noData}>Aucune donnée de contrôle disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>6. Contrôle - Courbes de Filiation</Text>
      
      {resultsData.results.map((result, index) => (
        <ResultSection 
          key={index} 
          result={result} 
          resultNumber={result.stepNumber || index + 1}
        />
      ))}
    </View>
  );
};
