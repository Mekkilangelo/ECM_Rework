/**
 * INFRASTRUCTURE: Section Contrôle complète pour le PDF
 * Affiche les résultats de contrôle : dureté, ECD, courbes avec specs
 * IMPLEMENTATION: Granular Splitting + Adaptive Chart Sizing + Reduced Padding + Pagination Fixes
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
    marginBottom: 10,
  },
  resultTitle: {
    ...TYPOGRAPHY.subsectionTitle,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    borderLeftWidth: 4,
    borderLeftColor: getAccentColor(SECTION_TYPE),
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  sampleTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 4,
    color: '#334155'
  },
  subsectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#64748b',
    textTransform: 'uppercase'
  },
  table: {
    marginBottom: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0', // Only horizontal lines
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    minHeight: 14
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold'
  },
  tableCell: {
    padding: 3,
    fontSize: 8,
    // No vertical borders for cleaner look
    color: '#334155'
  },
  chartContainer: {
    marginBottom: 10,
    padding: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4
  },
  chartTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e293b'
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    paddingTop: 6,
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
  // Photo "Polaroid" Style
  photoContainer: {
    marginBottom: 6,
    alignItems: 'center',
    padding: 3,
    backgroundColor: '#ffffff',
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  photoWrapper: {
    width: 100, // Fixed size
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 2,
    backgroundColor: '#f8fafc'
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  photoLabel: {
    fontSize: 6,
    textAlign: 'center',
    color: '#64748b',
    fontStyle: 'italic',
    maxWidth: 95
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

const CHART_HEIGHT_STD = 200;
const CHART_HEIGHT_MIN = 100;

const SERIES_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
];

// --- COMPONENTS ---

const CurveChart = ({ curveData, specifications, unit = 'HV', width = 500, height = CHART_HEIGHT_STD }) => {
  if (!curveData || !curveData.distances || !curveData.series || curveData.series.length === 0) return null;

  // Reduced padding for Svg to maximize usable drawing area
  const padding = { top: 15, right: 25, bottom: 35, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = Math.max(0, height - padding.top - padding.bottom);

  const distances = curveData.distances.filter(d => d != null && d !== '').map(d => Number(d));
  let allValues = [];
  curveData.series.forEach(series => {
    series.values.forEach((val, idx) => {
      if (val != null && val !== '' && !isNaN(Number(val)) && Number(val) > 0 && distances[idx] != null) {
        allValues.push(Number(val));
      }
    });
  });

  if (allValues.length === 0 || distances.length === 0 || chartHeight <= 0) return null;

  const minDistance = 0;
  const maxDistance = Math.max(...distances);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const valueRange = maxValue - minValue;
  const yMin = Math.max(0, minValue - valueRange * 0.15);
  const yMax = maxValue + valueRange * 0.15;

  const scaleX = (distance) => padding.left + (distance - minDistance) / (maxDistance - minDistance) * chartWidth;
  const scaleY = (value) => {
    if (value === null || value === undefined) return null;
    return padding.top + chartHeight - ((value - yMin) / (yMax - yMin)) * chartHeight;
  };

  const xTicks = [];
  for (let i = 0; i <= 5; i++) {
    const distance = minDistance + (maxDistance - minDistance) * (i / 5);
    xTicks.push({ x: scaleX(distance), label: distance.toFixed(1) });
  }

  const yTicks = [];
  for (let i = 0; i <= 5; i++) {
    const value = yMin + (yMax - yMin) * (i / 5);
    yTicks.push({ y: scaleY(value), label: Math.round(value) });
  }

  const arrowSize = 4;

  return (
    <Svg width={width} height={height}>
      {yTicks.map((tick, i) => <SvgLine key={`gh-${i}`} x1={padding.left} y1={tick.y} x2={padding.left + chartWidth} y2={tick.y} stroke="#f1f5f9" strokeWidth={1} />)}
      {xTicks.map((tick, i) => <SvgLine key={`gv-${i}`} x1={tick.x} y1={padding.top} x2={tick.x} y2={padding.top + chartHeight} stroke="#f1f5f9" strokeWidth={1} />)}

      <SvgLine x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#94a3b8" strokeWidth={1.5} />
      <SvgLine x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#94a3b8" strokeWidth={1.5} />

      <Path d={`M ${padding.left} ${padding.top - arrowSize} L ${padding.left - arrowSize} ${padding.top + arrowSize} L ${padding.left + arrowSize} ${padding.top + arrowSize} Z`} fill="#94a3b8" />
      <Path d={`M ${padding.left + chartWidth + arrowSize} ${padding.top + chartHeight} L ${padding.left + chartWidth - arrowSize} ${padding.top + chartHeight - arrowSize} L ${padding.left + chartWidth - arrowSize} ${padding.top + chartHeight + arrowSize} Z`} fill="#94a3b8" />

      {xTicks.map((tick, i) => <Text key={`xl-${i}`} x={tick.x} y={padding.top + chartHeight + 12} style={styles.axisLabel} textAnchor="middle">{tick.label}</Text>)}
      {yTicks.map((tick, i) => <Text key={`yl-${i}`} x={padding.left - 6} y={tick.y + 3} style={styles.axisLabel} textAnchor="end">{tick.label}</Text>)}

      <Text x={padding.left + chartWidth / 2} y={padding.top + chartHeight + 28} style={[styles.axisLabel, { fontSize: 8, fontFamily: 'Helvetica-Bold' }]} textAnchor="middle">Distance (mm)</Text>
      <Text x={padding.left - 5} y={padding.top - 8} style={[styles.axisLabel, { fontSize: 8, fontFamily: 'Helvetica-Bold' }]} textAnchor="start">Hardness ({unit})</Text>

      {specifications?.ecdSpecs?.map((spec, i) => {
        const specValue = spec.hardness || spec.yValue;
        if (!specValue) return null;
        let dMin = spec.depthMin, dMax = spec.depthMax;
        if ((dMin == null) && spec.range) {
          const m = spec.range.match(/(\d+\.?\d*)-(\d+\.?\d*)/);
          if (m) { dMin = parseFloat(m[1]); dMax = parseFloat(m[2]); }
        }
        if (dMin == null || dMax == null) return null;
        const y = scaleY(specValue);
        return y !== null ? (
          <React.Fragment key={`s-${i}`}>
            <SvgLine x1={scaleX(dMin)} y1={y} x2={scaleX(dMax)} y2={y} stroke="#1e293b" strokeWidth={2} strokeDasharray="4 2" />
            <Text x={scaleX(dMax) + 5} y={y + 3} style={[styles.axisLabel, { fontSize: 6.5, fill: '#1e293b' }]} textAnchor="start">ECD: {dMin}-{dMax}mm @ {specValue}</Text>
          </React.Fragment>
        ) : null;
      })}

      {curveData.series.map((series, i) => {
        const color = SERIES_COLORS[i % SERIES_COLORS.length];
        const points = [];
        series.values.forEach((val, idx) => {
          if (val && !isNaN(Number(val)) && Number(val) > 0 && distances[idx] != null) {
            points.push({ x: scaleX(distances[idx]), y: scaleY(Number(val)) });
          }
        });
        if (points.length === 0) return null;
        const path = points.map((p, k) => k === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');
        return (
          <React.Fragment key={`ser-${i}`}>
            <Path d={path} stroke={color} strokeWidth={2} fill="none" />
            {points.map((p, k) => <Circle key={`p-${i}-${k}`} cx={p.x} cy={p.y} r={3} fill={color} />)}
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

// --- SPLIT COMPONENT: INFO (Polished Layout) ---
const SampleInfo = ({ sample, sampleIndex, unit: globalUnit, controlLocationPhotos, isCompact = false }) => {
  const hasHardness = sample.hardnessPoints?.some(p => p.value);
  const hasEcd = sample.ecdPositions?.some(p => p.distance);

  // FIX: Detect unit from sample data if available, else fallback
  const sampleUnit = sample.hardnessPoints?.find(p => p.unit)?.unit || globalUnit;

  if (!hasHardness && !hasEcd && (!controlLocationPhotos || controlLocationPhotos.length === 0)) return null;

  const sampleTitle = sample.description ? `Sample ${sampleIndex + 1} - ${sample.description}` : `Sample ${sampleIndex + 1}`;

  const pad = isCompact ? 2 : 3;
  const fz = isCompact ? 7 : 8;
  const rh = isCompact ? 12 : 14;
  const dCell = { padding: pad, fontSize: fz };
  const dRow = { minHeight: rh };

  return (
    <View style={{ marginBottom: 8 }} wrap={false}>
      <Text style={styles.sampleTitle}>{sampleTitle}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
        {/* Hardness Table: Width 170 to fit 3 cols */}
        {hasHardness && (
          <View style={{ flex: 1, minWidth: 170, maxWidth: 220 }}>
            <Text style={styles.subsectionTitle}>Hardness</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader, dRow]}>
                <Text style={[styles.tableCell, { width: '45%' }, dCell]}>Pos.</Text>
                <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }, dCell]}>Value</Text>
                <Text style={[styles.tableCell, { width: '30%', textAlign: 'center' }, dCell]}>Unit</Text>
              </View>
              {sample.hardnessPoints.map((p, i) => (
                <View key={i} style={[styles.tableRow, dRow]}>
                  <Text style={[styles.tableCell, { width: '45%' }, dCell]}>{p.location || p.position || '-'}</Text>
                  <Text style={[styles.tableCell, { width: '25%', textAlign: 'right', fontWeight: 'bold' }, dCell]}>{p.value || '-'}</Text>
                  <Text style={[styles.tableCell, { width: '30%', textAlign: 'center' }, dCell]}>{p.unit || sampleUnit || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ECD Table: Width 190 */}
        {hasEcd && (
          <View style={{ flex: 1, minWidth: 190 }}>
            <Text style={styles.subsectionTitle}>ECD (mm)</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader, dRow]}>
                <Text style={[styles.tableCell, { width: '40%' }, dCell]}>Pos.</Text>
                <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }, dCell]}>Dist.</Text>
                <Text style={[styles.tableCell, { width: '35%', textAlign: 'right' }, dCell]}>Hard.</Text>
              </View>
              {sample.ecdPositions.map((p, i) => (
                <View key={i} style={[styles.tableRow, dRow]}>
                  <Text style={[styles.tableCell, { width: '40%' }, dCell]}>{p.location || '-'}</Text>
                  <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }, dCell]}>{p.distance || '-'}</Text>
                  <Text style={[styles.tableCell, { width: '35%', textAlign: 'right', fontSize: 7 }, dCell]}>
                    {p.hardness ? `${p.hardness} ${p.hardnessUnit || sampleUnit || ''}` : '-'}
                  </Text>
                </View>
              ))}
            </View>
            {sample.ecdHardnessValue && (
              <View style={{ marginTop: 2 }}>
                <Text style={{ fontSize: 7, color: '#64748b' }}>Ref: {sample.ecdHardnessValue} {sample.ecdHardnessUnit || sampleUnit}</Text>
              </View>
            )}
          </View>
        )}

        {/* Photos: Fixed Width 110 */}
        {controlLocationPhotos && controlLocationPhotos.length > 0 && (
          <View style={{ width: 110, alignItems: 'center' }}>
            <Text style={styles.subsectionTitle}>Location</Text>
            {controlLocationPhotos.slice(0, 1).map((photo, i) => (
              <View key={i} style={styles.photoContainer}>
                <View style={styles.photoWrapper}><Image src={getPhotoUrl(photo)} style={styles.photo} /></View>
                {(photo.description || photo.name) && <Text style={styles.photoLabel}>{photo.description || photo.name}</Text>}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

// --- SPLIT COMPONENT: CHART ---
const SampleChart = ({ sample, specifications, unit, specifiedHeight }) => {
  const hasCurve = sample.curveData?.series?.some(s => s.values?.some(v => v > 0));
  if (!hasCurve) return null;

  // Use specifiedHeight if available (Adaptive), else fall back to STD
  const chartHeight = specifiedHeight || CHART_HEIGHT_STD;

  return (
    <View style={styles.chartContainer} wrap={false}>
      <Text style={styles.chartTitle}>Full Hardness Curves</Text>
      <CurveChart curveData={sample.curveData} specifications={specifications} unit={unit} height={chartHeight} />
      <View style={styles.chartLegend}>
        {sample.curveData.series.map((s, i) => {
          const count = s.values.filter(v => v > 0).length;
          if (count === 0) return null;
          return (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: SERIES_COLORS[i % 6] }]} />
              <Text style={styles.legendText}>{s.name} ({count} pts)</Text>
            </View>
          );
        })}
        {specifications?.ecdSpecs?.map((spec, i) => {
          if (!spec.hardness && !spec.yValue) return null;
          return (
            <View key={`sl-${i}`} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#1e293b', height: 1.5, width: 12, borderStyle: 'dashed' }]} />
              <Text style={styles.legendText}>ECD Spec</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};


// --- MAIN EXPORT ---
export const ControlSectionPDF = ({ report, photos = [] }) => {
  const resultsData = report?.resultsData;
  const specifications = report.part?.specifications || report.partData?.specifications;
  const partData = report.partData || report.part || {};
  const globalUnit = resultsData?.results?.[0]?.samples?.[0]?.hardnessPoints?.[0]?.unit || 'HV';

  if (!resultsData || !resultsData.results) {
    return <View style={styles.section}><Text style={styles.sectionTitle}>CONTROL</Text><Text style={styles.noData}>No data</Text></View>;
  }

  // 1. Calculate Dynamic Header Height
  const calculateHeaderHeight = () => {
    let h = 30; // Banner + padding (Base)
    const hSpecs = partData.hardnessSpecs || [];
    const eSpecs = partData.ecdSpecs || [];

    if (hSpecs.length > 0 || eSpecs.length > 0) {
      const hHeight = hSpecs.length > 0 ? 12 + (hSpecs.length * 10) : 0;
      const eHeight = eSpecs.length > 0 ? 12 + (eSpecs.length * 10) : 0;
      h += Math.max(hHeight, eHeight);
    } else {
      h += 15; // "No specs" msg
    }
    return h + 5; // Reduced margin (was 10)
  };

  const HEADER_HEIGHT_DYN = calculateHeaderHeight();

  // REDUCED SAFETY LIMIT: 680 ensures manual break happens BEFORE react-pdf auto-break
  // This guarantees headers are always rendered manually.
  const MAX_PAGE_HEIGHT = 680;

  // 2. Prepare Blocks (Granular Split)
  const renderBlocks = [];
  const photosBySample = {};
  if (Array.isArray(photos)) {
    photos.forEach(p => {
      const m = p.subcategory?.match(/result-(\d+)-sample-(\d+)/);
      if (m) {
        const k = `r${m[1]}-s${m[2]}`;
        if (!photosBySample[k]) photosBySample[k] = [];
        photosBySample[k].push(p);
      }
    });
  }

  resultsData.results.forEach((res, rIdx) => {
    renderBlocks.push({ type: 'TITLE', data: res, resultIndex: rIdx });

    res.samples?.forEach((sample, sIdx) => {
      const pKey = `r${rIdx + 1}-s${sIdx + 1}`;
      const sPhotos = photosBySample[pKey] || [];
      const hasH = sample.hardnessPoints?.some(v => v.value);
      const hasE = sample.ecdPositions?.some(v => v.distance);
      const hasC = sample.curveData?.series?.some(s => s.values?.length);

      if (hasH || hasE) {
        renderBlocks.push({
          type: 'SAMPLE_INFO',
          data: sample,
          photos: sPhotos,
          sampleIndex: sIdx,
          resultIndex: rIdx,
          useCompact: false // Start false
        });
      }
      if (hasC) {
        renderBlocks.push({
          type: 'SAMPLE_CHART',
          data: sample,
          sampleIndex: sIdx,
          resultIndex: rIdx,
          specifiedHeight: null // Set dynamically
        });
      }
    });
  });

  // 3. Estimator
  const estimateHeight = (block, compact, customChartHeight = null) => {
    if (block.type === 'TITLE') return 36;

    if (block.type === 'SAMPLE_INFO') {
      let h = 28; // Title reduced
      const rh = compact ? 12 : 14;

      // FIX: More accurate overheads
      // Hardness: Title(14) + TableMargin(6) + Header(rh) = ~34 + rows
      let hH = 0, eH = 0, pH = 0;
      if (block.data.hardnessPoints?.length) hH = 35 + block.data.hardnessPoints.length * rh;
      if (block.data.ecdPositions?.length) eH = 35 + block.data.ecdPositions.length * rh;
      // Photos: Title(14) + Container(108) + Margin(6) = ~128. Use 135 safe.
      if (block.photos?.length) pH = 135;

      h += Math.max(hH, eH, pH);
      return h + 8; // Block margin
    }

    if (block.type === 'SAMPLE_CHART') {
      const chartSvg = customChartHeight || CHART_HEIGHT_STD;
      // Overhead = ContainerPad(12) + Title(17) + Legend(variable 20-40?) + Margin(10) ~ 80
      // Use 100 safe.
      return chartSvg + 100;
    }
    return 0;
  };

  // 4. Pagination
  const pages = [];
  let currentPage = [];
  let currentH = HEADER_HEIGHT_DYN;

  for (let i = 0; i < renderBlocks.length; i++) {
    const block = renderBlocks[i];

    // LOOKAHEAD LOGIC for ORPHAN TITLES
    // If it's a TITLE, check if the NEXT block fits. 
    // If next doesn't fit, break NOW so title goes to next page too.
    if (block.type === 'TITLE') {
      const nextBlock = renderBlocks[i + 1];
      if (nextBlock) { // Only matters if there IS a next block
        const titleH = estimateHeight(block, false);
        const nextH = estimateHeight(nextBlock, false);

        // Case: Both Title + Next won't fit?
        if (currentH + titleH + nextH > MAX_PAGE_HEIGHT) {
          // Force break immediately, push Title to next page
          pages.push(currentPage);
          currentPage = [];
          currentH = HEADER_HEIGHT_DYN;
        }
      }
    }

    // Standard estimation
    const stdH = estimateHeight(block, false);

    if (currentH + stdH <= MAX_PAGE_HEIGHT) {
      block.useCompact = false;
      block.specifiedHeight = null; // Use standard
      currentPage.push(block);
      currentH += stdH;
    } else {
      // ADAPTIVE CHART SIZING LOGIC
      let placed = false;
      if (block.type === 'SAMPLE_CHART') {
        const overhead = 100; // Match estimator safe overhead
        const remainingSpace = MAX_PAGE_HEIGHT - currentH;
        const availableChartH = remainingSpace - overhead;

        if (availableChartH >= CHART_HEIGHT_MIN) {
          // FIT IT!
          block.specifiedHeight = availableChartH;
          currentPage.push(block);
          currentH += (availableChartH + overhead);
          placed = true;
        }
      }

      if (!placed) {
        // Try Compact for Info
        const cptH = estimateHeight(block, true);
        if (block.type === 'SAMPLE_INFO' && currentH + cptH <= MAX_PAGE_HEIGHT) {
          block.useCompact = true;
          currentPage.push(block);
          currentH += cptH;
        } else {
          // Break Page
          pages.push(currentPage);
          currentPage = [];
          currentH = HEADER_HEIGHT_DYN;

          // Retry on new page
          block.useCompact = false;
          block.specifiedHeight = null;
          // Even on new page, check if huge
          const newPageH = estimateHeight(block, false);
          currentH += newPageH;
          currentPage.push(block);
        }
      }
    }
  }

  if (currentPage.length) pages.push(currentPage);

  // 5. Render
  const formatSpec = (min, max, u) => {
    if (min != null && max != null) return `${min}-${max} ${u}`;
    if (min != null) return `>= ${min} ${u}`;
    if (max != null) return `<= ${max} ${u}`;
    return `- ${u}`;
  };

  return (
    <View style={styles.section}>
      {pages.map((pBlocks, pId) => (
        <View key={pId} break={pId > 0}>
          {/* HEADER REPEATED ALWAYS */}
          <View style={{ marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.brand.dark, padding: 4, marginBottom: 4 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>CONTROL</Text>
              <Text style={{ color: '#fff', fontSize: 10 }}>{pId + 1} / {pages.length}</Text>
            </View>
            {/* SPECS */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 5 }}>
              <Text style={{ fontSize: 8, fontWeight: 'bold', width: 40, color: COLORS.text.secondary }}>Specs:</Text>
              <View style={{ flex: 1, flexDirection: 'row', gap: 20 }}>
                {partData.hardnessSpecs?.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 1 }}>Hardness</Text>
                    {partData.hardnessSpecs.map((s, i) => (s.min || s.max) && (
                      <Text key={i} style={{ fontSize: 8 }}>{s.name || 'H'}: {formatSpec(s.min, s.max, s.unit || 'HV')}</Text>
                    ))}
                  </View>
                )}
                {partData.ecdSpecs?.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 7, fontWeight: 'bold', textDecoration: 'underline', marginBottom: 1 }}>ECD</Text>
                    {partData.ecdSpecs.map((s, i) => (s.depthMin || s.depthMax) && (
                      <Text key={i} style={{ fontSize: 8 }}>{s.name || 'D'}: {formatSpec(s.depthMin, s.depthMax, s.depthUnit || 'mm')}{s.hardness ? ` @ ${s.hardness} ${s.hardnessUnit || ''}` : ''}</Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {pBlocks.map((b, i) => {
            if (b.type === 'TITLE') return (
              <View key={i} style={{ marginBottom: 4 }} wrap={false}>
                <Text style={styles.resultTitle}>Result {b.data.step || b.resultIndex + 1} {b.data.description}</Text>
              </View>
            );
            if (b.type === 'SAMPLE_INFO') return (
              <SampleInfo key={i} sample={b.data} sampleIndex={b.sampleIndex} unit={globalUnit} controlLocationPhotos={b.photos} isCompact={b.useCompact} />
            );
            if (b.type === 'SAMPLE_CHART') return (
              <SampleChart key={i} sample={b.data} specifications={specifications} unit={globalUnit} specifiedHeight={b.specifiedHeight} />
            );
            return null;
          })}
        </View>
      ))}
    </View>
  );
};

export default ControlSectionPDF;
