/**
 * INFRASTRUCTURE: Section Contrôle complète pour le PDF
 * Affiche les résultats de contrôle : dureté, ECD, courbes avec specs
 * 
 * Uses theme system for consistent styling
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Svg, Path, Line as SvgLine, Circle } from '@react-pdf/renderer';
import { getPhotoUrl } from '../helpers/photoHelpers';
import { COLORS, TYPOGRAPHY, SPACING, getAccentColor, getSubsectionBackground, getSubsectionTextColor } from '../theme';

// Section type for accent colors
const SECTION_TYPE = 'control';

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.section.marginBottom
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.text.white,
    backgroundColor: COLORS.brand.secondary,
    borderLeftWidth: 4,
    borderLeftColor: getAccentColor(SECTION_TYPE),
    marginBottom: 10, // Increased spacing
  },
  resultTitle: {
    ...TYPOGRAPHY.subsectionTitle,
    color: '#1e293b', // Darker text
    backgroundColor: '#f1f5f9', // Light neutral background
    borderLeftWidth: 4,
    borderLeftColor: getAccentColor(SECTION_TYPE),
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sampleTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 6,
    color: '#334155'
  },
  subsectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
    color: '#475569'
  },
  table: {
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
    borderRadius: 2
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0'
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#e2e8f0',
    color: '#334155'
  },
  chartContainer: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b'
  },
  // ... (keep existing styles)
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
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
    marginRight: 4,
    borderRadius: 1
  },
  legendText: {
    fontSize: 7,
    color: '#64748b'
  },
  axisLabel: {
    fontSize: 7,
    color: '#64748b'
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    justifyContent: 'flex-start',
    gap: 6,
  },
  photoContainer: {
    marginBottom: 6,
    alignItems: 'center',
  },
  photoWrapper: {
    width: 120,
    height: 90,
    backgroundColor: '#f1f5f9',
    border: '0.5pt solid #cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 2
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  photoLabel: {
    fontSize: 6.5,
    textAlign: 'center',
    marginTop: 2,
    color: '#64748b',
    fontStyle: 'italic',
  },
  noData: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#94a3b8',
    marginTop: 5,
    textAlign: 'center',
    padding: 20
  }
});

const SERIES_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899'  // Pink
];

// ... (CurveChart component remains mostly the same, update style refs if needed)
const CurveChart = ({ curveData, specifications, unit = 'HV', width = 500, height = 200 }) => {
  // ... (keep implementation)
  if (!curveData || !curveData.distances || !curveData.series || curveData.series.length === 0) {
    return null;
  }

  const padding = { top: 15, right: 25, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Collecter toutes les valeurs valides
  const distances = curveData.distances.filter(d => d != null && d !== '').map(d => Number(d));
  let allValues = [];

  curveData.series.forEach(series => {
    series.values.forEach((val, idx) => {
      // Check for valid numbers
      if (val != null && val !== '' && !isNaN(Number(val)) && Number(val) > 0 && distances[idx] != null) {
        allValues.push(Number(val));
      }
    });
  });

  if (allValues.length === 0 || distances.length === 0) {
    return null;
  }

  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const valueRange = maxValue - minValue;
  // Add some padding to Y-axis
  const yMin = Math.max(0, minValue - valueRange * 0.1);
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
        <SvgLine key={`grid-h-${i}`} x1={padding.left} y1={tick.y} x2={padding.left + chartWidth} y2={tick.y} stroke="#f1f5f9" strokeWidth={1} />
      ))}
      {xTicks.map((tick, i) => (
        <SvgLine key={`grid-v-${i}`} x1={tick.x} y1={padding.top} x2={tick.x} y2={padding.top + chartHeight} stroke="#f1f5f9" strokeWidth={1} />
      ))}

      {/* Axes */}
      <SvgLine x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#94a3b8" strokeWidth={1.5} />
      <SvgLine x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#94a3b8" strokeWidth={1.5} />

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
        Hardness ({unit})
      </Text>

      {/* Ligne de spec */}
      {specifications && specifications.ecdSpecs && specifications.ecdSpecs.length > 0 && (
        <>
          {specifications.ecdSpecs.map((spec, specIndex) => {
            // ... (keep spec rendering logic)
            // Recuperer la valeur Y (hardness)
            const specValue = spec.hardness || spec.yValue;

            if (!specValue) return null;

            // Recuperer les limites X (depth range)
            let depthMin = spec.depthMin;
            let depthMax = spec.depthMax;

            // Si range est au format "0.6-0.9mm", l'extraire
            if ((depthMin === null || depthMin === undefined) && spec.range) {
              const rangeMatch = spec.range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
              if (rangeMatch) {
                depthMin = parseFloat(rangeMatch[1]);
                depthMax = parseFloat(rangeMatch[2]);
              }
            }

            if (depthMin === null || depthMin === undefined || depthMax === null || depthMax === undefined) return null;

            const y = scaleY(specValue);
            if (y === null) return null;

            // Calculer X start et X end pour la ligne spec (entre depthMin et depthMax)
            const xStart = scaleX(depthMin);
            const xEnd = scaleX(depthMax);

            return (
              <React.Fragment key={`spec-${specIndex}`}>
                <SvgLine x1={xStart} y1={y} x2={xEnd} y2={y} stroke="#1e293b" strokeWidth={2} strokeDasharray="4 2" />
                <Text x={xEnd + 5} y={y + 3} style={[styles.axisLabel, { fontSize: 6.5, fill: '#1e293b' }]} textAnchor="start">
                  ECD: {depthMin}-{depthMax}mm at {specValue}
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
          if (val != null && val !== '' && !isNaN(Number(val)) && Number(val) > 0 && distances[idx] != null) {
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
              <Circle key={`point-${seriesIndex}-${i}`} cx={p.x} cy={p.y} r={3} fill={color} />
            ))}
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

/**
 * Affichage des données d'un échantillon avec mise en page intelligente
 * Layout: Grille (2 colonnes tables + 1 colonne photo) puis courbe pleine largeur
 */
const SampleData = ({ sample, sampleIndex, specifications, unit, controlLocationPhotos }) => {
  // Check for ACTUAL values, not just non-empty arrays with empty placeholders
  const hasHardness = sample.hardnessPoints &&
    sample.hardnessPoints.length > 0 &&
    sample.hardnessPoints.some(p => (p.value !== null && p.value !== '' && p.value !== '-'));

  const hasEcdPositions = sample.ecdPositions &&
    sample.ecdPositions.length > 0 &&
    sample.ecdPositions.some(p => (p.distance !== null && p.distance !== '' && p.distance !== '-'));

  const hasCurve = sample.curveData &&
    sample.curveData.distances &&
    sample.curveData.series &&
    sample.curveData.series.some(s => s.values && s.values.some(v => v > 0));

  const hasPhotos = controlLocationPhotos && controlLocationPhotos.length > 0;

  // Si on n'a ni dureté ni ECD, on n'affiche PAS la localisation non plus (sauf si explicitement demandé)
  // L'utilisateur a dit: "si on n'a ni dureté ni ecd, n'affiche pas la control location, ca ne sert a rien"
  // Donc: hasContent = (hasHardness || hasEcdPositions) || hasCurve
  // Mais conservons les photos si elles sont là, au cas où. 
  // Modifié selon demande: si pas de resultats tabulaires, pas de control location.
  const showTablesAndLocation = hasHardness || hasEcdPositions;

  if (!hasHardness && !hasEcdPositions && !hasCurve) return null;

  // Construire le titre de l'échantillon avec description
  let sampleTitle = `Sample ${sampleIndex + 1}`;
  if (sample.description) {
    sampleTitle += ` - ${sample.description}`;
  }

  return (
    <View style={{ marginBottom: 15 }} wrap={false}>
      <Text style={styles.sampleTitle}>{sampleTitle}</Text>

      {/* GRILLE: Tables de donnees + Photo de localisation */}
      {showTablesAndLocation && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          {/* Colonne 1: Table Durete */}
          {hasHardness && (
            <View style={{ flex: 1, minWidth: 140 }}>
              <Text style={styles.subsectionTitle}>Hardness ({unit})</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { width: '60%' }]}>Position</Text>
                  <Text style={[styles.tableCell, { width: '40%', borderRightWidth: 0 }]}>Value</Text>
                </View>
                {sample.hardnessPoints.map((point, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '60%' }]}>{point.location || point.position || '-'}</Text>
                    <Text style={[styles.tableCell, { width: '40%', borderRightWidth: 0 }]}>{point.value || '-'}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Colonne 2: Table ECD */}
          {hasEcdPositions && (
            <View style={{ flex: 1, minWidth: 140 }}>
              <Text style={styles.subsectionTitle}>ECD (mm)</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { width: '60%' }]}>Position</Text>
                  <Text style={[styles.tableCell, { width: '40%', borderRightWidth: 0 }]}>Dist.</Text>
                </View>
                {sample.ecdPositions.map((pos, idx) => (
                  <View key={idx} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '60%' }]}>{pos.location || '-'}</Text>
                    <Text style={[styles.tableCell, { width: '40%', borderRightWidth: 0 }]}>{pos.distance || '-'}</Text>
                  </View>
                ))}
              </View>
              {sample.ecdHardnessValue && (
                <View style={{ marginTop: 2, padding: 4, backgroundColor: '#f1f5f9', borderRadius: 2 }}>
                  <Text style={{ fontSize: 7, color: '#475569' }}>
                    Ref. Hardness: <Text style={{ fontWeight: 'bold' }}>{sample.ecdHardnessValue} {sample.ecdHardnessUnit || unit}</Text>
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Colonne 3: Photo localisation (petite) - Uniquement si tables affichées */}
          {hasPhotos && (
            <View style={{ width: 130, alignItems: 'center' }}>
              <Text style={styles.subsectionTitle}>Location</Text>
              {controlLocationPhotos.slice(0, 1).map((photo, idx) => (
                <View key={idx} style={styles.photoContainer}>
                  <View style={styles.photoWrapper}>
                    <Image src={getPhotoUrl(photo)} style={styles.photo} />
                  </View>
                  {(photo.description || photo.original_name || photo.name) && (
                    <Text style={styles.photoLabel}>
                      {photo.description || photo.original_name || photo.name}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* COURBE: Pleine largeur */}
      {hasCurve && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Full Hardness Curves</Text>
          <CurveChart curveData={sample.curveData} specifications={specifications} unit={unit} />
          <View style={styles.chartLegend}>
            {/* Legende des series de donnees */}
            {sample.curveData.series.map((series, index) => {
              const color = SERIES_COLORS[index % SERIES_COLORS.length];
              const validCount = series.values.filter(v => v != null && v !== '' && !isNaN(Number(v)) && Number(v) > 0).length;
              if (validCount === 0) return null;

              return (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{series.name || `Series ${index + 1}`} ({validCount} pts)</Text>
                </View>
              );
            })}

            {/* Legende des lignes de spec ECD */}
            {specifications?.ecdSpecs?.map((spec, specIndex) => {
              const specValue = spec.hardness || spec.yValue;
              let depthMin = spec.depthMin;
              let depthMax = spec.depthMax;

              if ((depthMin === null || depthMin === undefined) && spec.range) {
                const rangeMatch = spec.range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
                if (rangeMatch) {
                  depthMin = parseFloat(rangeMatch[1]);
                  depthMax = parseFloat(rangeMatch[2]);
                }
              }

              if (!specValue || depthMin === null || depthMin === undefined || depthMax === null || depthMax === undefined) {
                return null;
              }

              return (
                <View key={`spec-legend-${specIndex}`} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#1e293b', height: 1.5, width: 12, borderStyle: 'dashed' }]} />
                  <Text style={styles.legendText}>ECD: {depthMin}-{depthMax}mm @ {specValue} {unit}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

// ... (ControlSectionPDF component)

export const ControlSectionPDF = ({ report, photos = [] }) => {
  // ... (setup code)
  const resultsData = report?.resultsData;
  const specifications = report?.part?.specifications;
  const unit = resultsData?.results?.[0]?.samples?.[0]?.hardnessPoints?.[0]?.unit ||
    resultsData?.results?.[0]?.samples?.[0]?.ecd?.hardnessUnit || 'HV';

  if (!resultsData || !resultsData.results || resultsData.results.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CONTROL</Text>
        <Text style={styles.noData}>No control data available.</Text>
      </View>
    );
  }

  // Organiser les photos par result-sample
  const photosByResultSample = {};
  // ... (keeping existing logic for photos)
  if (Array.isArray(photos)) {
    photos.forEach(photo => {
      const match = photo.subcategory?.match(/result-(\d+)-sample-(\d+)/);
      if (match) {
        const key = `result-${match[1]}-sample-${match[2]}`;
        if (!photosByResultSample[key]) photosByResultSample[key] = [];
        photosByResultSample[key].push(photo);
      }
    });
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>CONTROL</Text>

      {resultsData.results.map((result, resultIndex) => (
        // Wrap Result Block
        <View key={resultIndex} style={{ marginBottom: 20 }} wrap={false}>
          <Text style={styles.resultTitle}>
            Result {result.step || resultIndex + 1}
            {result.description && ` - ${result.description}`}
          </Text>

          {result.samples && result.samples.map((sample, sampleIndex) => {
            const photoKey = `result-${resultIndex + 1}-sample-${sampleIndex + 1}`;
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
