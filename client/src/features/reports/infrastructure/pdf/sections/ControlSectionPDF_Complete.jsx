/**
 * INFRASTRUCTURE: Section Contrôle complète pour le PDF
 * Affiche les résultats de contrôle : dureté, ECD, courbes avec specs
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Svg, Path, Line as SvgLine, Circle } from '@react-pdf/renderer';
import { getPhotoUrl } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 4,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  resultTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#e65100',
    letterSpacing: 0.3,
  },
  sampleTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    color: '#555555'
  },
  subsectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#666666'
  },
  table: {
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#DDDDDD'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#DDDDDD'
  },
  tableHeader: {
    backgroundColor: '#F5F5F5',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#DDDDDD'
  },
  chartContainer: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDDDDD'
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333'
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  photoContainer: {
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  photo: {
    width: 235,
    height: 176,
    objectFit: 'cover',
    border: '0.5pt solid #d0d0d0',
  },
  photoLabel: {
    fontSize: 7.5,
    textAlign: 'center',
    marginTop: 3,
    color: '#888',
    fontStyle: 'italic',
  },
  noData: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999999',
    marginTop: 5
  }
});

const SERIES_COLORS = [
  '#FF6384',
  '#4BC0C0',
  '#36A2EB',
  '#FF9F40',
  '#9966FF',
  '#FFCD56'
];

/**
 * Graphique SVG avec axes, légende, grille et ligne de spec
 */
const CurveChart = ({ curveData, specifications, unit = 'HV', width = 480, height = 240 }) => {
  if (!curveData || !curveData.distances || !curveData.series || curveData.series.length === 0) {
    return null;
  }

  const padding = { top: 20, right: 30, bottom: 50, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Collecter toutes les valeurs valides
  const distances = curveData.distances.filter(d => d != null && d !== '');
  let allValues = [];
  
  curveData.series.forEach(series => {
    series.values.forEach((val, idx) => {
      if (val != null && val !== '' && val > 0 && distances[idx] != null) {
        allValues.push(Number(val));
      }
    });
  });

  if (allValues.length === 0 || distances.length === 0) return null;

  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const valueRange = maxValue - minValue;
  const yMin = minValue - valueRange * 0.1;
  const yMax = maxValue + valueRange * 0.1;

  const scaleX = (distance) => padding.left + (distance - minDistance) / (maxDistance - minDistance) * chartWidth;
  const scaleY = (value) => {
    if (value === null || value === undefined) return null;
    return padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
  };

  // Graduations
  const xTicks = [];
  const xTickCount = 5;
  for (let i = 0; i <= xTickCount; i++) {
    const distance = minDistance + (maxDistance - minDistance) * (i / xTickCount);
    xTicks.push({ x: scaleX(distance), label: distance.toFixed(1) });
  }

  const yTicks = [];
  const yTickCount = 5;
  for (let i = 0; i <= yTickCount; i++) {
    const value = yMin + (yMax - yMin) * (i / yTickCount);
    yTicks.push({ y: scaleY(value), label: Math.round(value) });
  }

  return (
    <Svg width={width} height={height}>
      {/* Grille */}
      {yTicks.map((tick, i) => (
        <SvgLine key={`grid-h-${i}`} x1={padding.left} y1={tick.y} x2={padding.left + chartWidth} y2={tick.y} stroke="#E0E0E0" strokeWidth={0.5} />
      ))}
      {xTicks.map((tick, i) => (
        <SvgLine key={`grid-v-${i}`} x1={tick.x} y1={padding.top} x2={tick.x} y2={padding.top + chartHeight} stroke="#E0E0E0" strokeWidth={0.5} />
      ))}

      {/* Axes */}
      <SvgLine x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#333" strokeWidth={1.5} />
      <SvgLine x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#333" strokeWidth={1.5} />

      {/* Labels axes */}
      {xTicks.map((tick, i) => (
        <Text key={`x-label-${i}`} x={tick.x} y={padding.top + chartHeight + 15} style={styles.axisLabel} textAnchor="middle">{tick.label}</Text>
      ))}
      {yTicks.map((tick, i) => (
        <Text key={`y-label-${i}`} x={padding.left - 10} y={tick.y + 3} style={styles.axisLabel} textAnchor="end">{tick.label}</Text>
      ))}

      {/* Titres axes */}
      <Text x={padding.left + chartWidth / 2} y={padding.top + chartHeight + 35} style={[styles.axisLabel, { fontSize: 8, fontFamily: 'Helvetica-Bold' }]} textAnchor="middle">
        Distance (mm)
      </Text>
      <Text x={15} y={padding.top + chartHeight / 2} style={[styles.axisLabel, { fontSize: 8, fontFamily: 'Helvetica-Bold' }]} textAnchor="middle" transform={`rotate(-90 15 ${padding.top + chartHeight / 2})`}>
        Dureté ({unit})
      </Text>

      {/* Ligne de spec */}
      {specifications && specifications.ecdSpecs && specifications.ecdSpecs.length > 0 && (
        <>
          {specifications.ecdSpecs.map((spec, specIndex) => {
            const specValue = spec.hardness || spec.yValue;
            if (!specValue) return null;
            
            const y = scaleY(specValue);
            if (y === null) return null;

            return (
              <React.Fragment key={`spec-${specIndex}`}>
                <SvgLine x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y} stroke="#2c3e50" strokeWidth={1.5} strokeDasharray="4 2" />
                <Text x={padding.left + chartWidth + 5} y={y + 3} style={[styles.axisLabel, { fontSize: 6.5, fill: '#2c3e50' }]} textAnchor="start">
                  Spec: {specValue}
                </Text>
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Courbes */}
      {curveData.series.map((series, seriesIndex) => {
        const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
        const points = [];
        
        series.values.forEach((val, idx) => {
          if (val != null && val !== '' && val > 0 && distances[idx] != null) {
            const x = scaleX(distances[idx]);
            const y = scaleY(Number(val));
            if (y !== null) points.push({ x, y, distance: distances[idx], value: val });
          }
        });

        if (points.length === 0) return null;

        const pathData = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');

        return (
          <React.Fragment key={`series-${seriesIndex}`}>
            <Path d={pathData} stroke={color} strokeWidth={2} fill="none" />
            {points.map((p, i) => (
              <Circle key={`point-${seriesIndex}-${i}`} cx={p.x} cy={p.y} r={2.5} fill={color} />
            ))}
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

/**
 * Affichage des données d'un échantillon
 */
const SampleData = ({ sample, sampleIndex, specifications, unit, controlLocationPhotos }) => {
  const hasHardness = sample.hardnessPoints && sample.hardnessPoints.length > 0;
  const hasEcd = sample.ecd && sample.ecd.ecdPoints && sample.ecd.ecdPoints.length > 0;
  const hasCurve = sample.curveData && sample.curveData.distances && sample.curveData.series;
  const hasPhotos = controlLocationPhotos && controlLocationPhotos.length > 0;

  if (!hasHardness && !hasEcd && !hasCurve && !hasPhotos) return null;

  return (
    <View wrap={false} style={{ marginBottom: 12 }}>
      <Text style={styles.sampleTitle}>Échantillon {sampleIndex + 1}</Text>

      {/* Table Dureté */}
      {hasHardness && (
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.subsectionTitle}>Points de dureté</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '33%' }]}>Position</Text>
              <Text style={[styles.tableCell, { width: '33%' }]}>Valeur</Text>
              <Text style={[styles.tableCell, { width: '34%', borderRightWidth: 0 }]}>Unité</Text>
            </View>
            {sample.hardnessPoints.map((point, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '33%' }]}>{point.position || '-'}</Text>
                <Text style={[styles.tableCell, { width: '33%' }]}>{point.value || '-'}</Text>
                <Text style={[styles.tableCell, { width: '34%', borderRightWidth: 0 }]}>{point.unit || unit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Table ECD */}
      {hasEcd && (
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.subsectionTitle}>ECD (Effective Case Depth)</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { width: '50%' }]}>Position</Text>
              <Text style={[styles.tableCell, { width: '50%', borderRightWidth: 0 }]}>Distance (mm)</Text>
            </View>
            {sample.ecd.ecdPoints.map((point, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '50%' }]}>{point.position || '-'}</Text>
                <Text style={[styles.tableCell, { width: '50%', borderRightWidth: 0 }]}>{point.distance || '-'}</Text>
              </View>
            ))}
          </View>
          {sample.ecd.hardnessValue && (
            <Text style={{ fontSize: 8, marginTop: 4, color: '#666' }}>
              Dureté ECD: {sample.ecd.hardnessValue} {sample.ecd.hardnessUnit || unit}
            </Text>
          )}
        </View>
      )}

      {/* Courbes */}
      {hasCurve && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Courbes de filiation</Text>
          <CurveChart curveData={sample.curveData} specifications={specifications} unit={unit} />
          <View style={styles.chartLegend}>
            {sample.curveData.series.map((series, index) => {
              const color = SERIES_COLORS[index % SERIES_COLORS.length];
              const validCount = series.values.filter(v => v != null && v !== '' && v > 0).length;
              return (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{series.name || `Série ${index + 1}`} ({validCount} pts)</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Photos Control Location */}
      {hasPhotos && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.subsectionTitle}>Localisation de contrôle</Text>
          <View style={styles.photoGrid}>
            {controlLocationPhotos.map((photo, idx) => (
              <View key={idx} style={styles.photoContainer}>
                <Image src={getPhotoUrl(photo)} style={styles.photo} />
                {(photo.description || photo.original_name || photo.name) && (
                  <Text style={styles.photoLabel}>
                    {photo.description || photo.original_name || photo.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

/**
 * Composant principal
 */
export const ControlSectionPDF = ({ report, photos = [] }) => {
  const resultsData = report?.resultsData;
  const specifications = report?.part?.specifications;
  const unit = resultsData?.results?.[0]?.samples?.[0]?.hardnessPoints?.[0]?.unit || 
               resultsData?.results?.[0]?.samples?.[0]?.ecd?.hardnessUnit || 'HV';

  if (!resultsData || !resultsData.results || resultsData.results.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTRÔLE</Text>
        <Text style={styles.noData}>Aucune donnée de contrôle disponible</Text>
      </View>
    );
  }

  // Organiser les photos par result-sample (comme dans MicrographySectionPDF)
  const photosByResultSample = {};
  
  if (Array.isArray(photos)) {
    photos.forEach(photo => {
      // Parser la subcategory pour extraire result et sample
      // Format: "result-0-sample-1"
      const match = photo.subcategory?.match(/result-(\d+)-sample-(\d+)/);
      if (match) {
        const resultIndex = parseInt(match[1], 10);
        const sampleIndex = parseInt(match[2], 10);
        const key = `result-${resultIndex}-sample-${sampleIndex}`;
        
        if (!photosByResultSample[key]) {
          photosByResultSample[key] = [];
        }
        photosByResultSample[key].push(photo);
      }
    });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CONTRÔLE</Text>
      
      {resultsData.results.map((result, resultIndex) => (
        <View key={resultIndex} style={{ marginBottom: 15 }}>
          <Text style={styles.resultTitle}>
            Résultat {result.step || resultIndex + 1}
            {result.description && ` - ${result.description}`}
          </Text>
          
          {result.samples && result.samples.map((sample, sampleIndex) => {
            // Trouver les photos pour ce result-sample
            const photoKey = `result-${resultIndex}-sample-${sampleIndex}`;
            const samplePhotos = photosByResultSample[photoKey] || [];
            
            return (
              <SampleData
                key={sampleIndex}
                sample={sample}
                sampleIndex={sampleIndex}
                specifications={specifications}
                unit={unit}
                controlLocationPhotos={samplePhotos}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default ControlSectionPDF;
