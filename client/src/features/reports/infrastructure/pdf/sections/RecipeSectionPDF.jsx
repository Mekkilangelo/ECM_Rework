/**
 * INFRASTRUCTURE: Section Recette du rapport PDF
 * Reworked: Header with Recipe Number, 3-Column Details Grid (Distinct Colors)
 * Refined: SVG Arrows, Correct Tables (Speed+Pressure), Adjusted Widths.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, Svg, Path } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING, getAccentColor } from '../theme';
import RecipeCurveChartPDF from '../components/RecipeCurveChartPDF';

const BRAND_DARK = '#1e293b';

// Distinct Colors for Columns
const THEME = {
  thermal: {
    headerBg: '#fff1f2', // Rose 50
    headerBorder: '#e11d48', // Rose 600
    title: '#9f1239', // Rose 800
    arrowUp: '#e11d48',
    arrowDown: '#3b82f6',
  },
  chemical: {
    headerBg: '#f0fdf4', // Green 50
    headerBorder: '#16a34a', // Green 600
    title: '#14532d', // Green 800
  },
  cooling: {
    headerBg: '#eff6ff', // Blue 50
    headerBorder: '#2563eb', // Blue 600
    title: '#1e3a8a', // Blue 800
  }
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    fontFamily: 'Helvetica',
  },
  // Header
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  sectionPagination: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },

  // Main Layout
  mainContent: {
    flexDirection: 'column',
    gap: 10,
  },

  // 3-Column Grid
  detailsGrid: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },

  // Specific Column Widths (Adjusted)
  colThermal: { width: '24%', flexDirection: 'column' },
  colChemical: { width: '51%', flexDirection: 'column' },
  colCooling: { width: '25%', flexDirection: 'column' },

  // Data Rows
  row: {
    flexDirection: 'row',
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 7,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
  value: {
    fontSize: 7,
    color: '#0f172a',
    fontFamily: 'Helvetica',
  },

  // Mini Table
  miniTable: {
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    borderLeftWidth: 0.5,
    borderLeftColor: '#cbd5e1',
    marginTop: 5,
    marginBottom: 10,
  },
  miniRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    minHeight: 12,
    alignItems: 'center',
  },
  miniHeaderRow: {
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#94a3b8',
    minHeight: 15,
    alignItems: 'center',
  },
  miniCell: {
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#cbd5e1',
    fontSize: 7,
    justifyContent: 'center',
    textAlign: 'center',
  },
  miniCellHeader: {
    padding: 2,
    borderRightWidth: 0.5,
    borderRightColor: '#cbd5e1',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textAlign: 'center',
  },

  // Helper for column headers
  columnHeaderBase: {
    borderLeftWidth: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginBottom: 5,
  },
  columnTitleBase: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    textTransform: 'uppercase',
  },

  // Photos
  photoContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  photo: {
    maxWidth: '100%',
    maxHeight: 200,
    marginBottom: 5,
  },
  photoCaption: {
    fontSize: 8,
    color: '#64748b',
    fontStyle: 'italic',
  }
});

// --- HELPER COMPONENTS ---

const RampArrow = ({ type }) => {
  // Use SVG for perfect rendering
  const size = 8;
  const t = type?.toLowerCase();

  if (t === 'up') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 4L4 14h16L12 4z" fill={THEME.thermal.arrowUp} />
      </Svg>
    );
  }
  if (t === 'down') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M12 20l8-10H4l8 10z" fill={THEME.thermal.arrowDown} />
      </Svg>
    );
  }
  if (t === 'continue' || t === 'hold') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M20 12l-10-6v12l10-6z" fill="#16a34a" />
      </Svg>
    );
  }
  return <Text style={{ fontSize: 7, color: '#94a3b8' }}>-</Text>;
};

const InfoRow = ({ label, value, unit }) => {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value} {unit}</Text>
    </View>
  );
};

// --- HELPER CALCULATIONS ---

const calculateRecipeStats = (recipeData, quenchData) => {
  const waitTime = parseFloat(recipeData?.wait_time?.value) || 0; // min
  const chemCycle = recipeData?.chemical_cycle || [];

  // 1. Total Chemical Cycle Time (in minutes)
  const chemTotalSeconds = chemCycle.reduce((acc, step) => acc + (parseFloat(step.time) || 0), 0);
  const chemTotalMinutes = chemTotalSeconds / 60;

  // 2. Total Cycle Time (Wait + Chem)
  const totalCycleTime = waitTime + chemTotalMinutes;

  // 3. Quench Total Time
  let quenchTotalSeconds = 0;
  if (quenchData?.gas_quench) {
    // Gas Quench Total
    const speedParams = quenchData.gas_quench.speed_parameters || [];
    const speedTotal = speedParams.reduce((acc, p) => acc + (parseFloat(p.duration) || 0), 0);
    quenchTotalSeconds += speedTotal;
  }
  if (quenchData?.oil_quench) {
    // Oil Quench Total
    const drip = parseFloat(quenchData.oil_quench.dripping_time?.value) || 0; // min
    const speedParams = quenchData.oil_quench.speed_parameters || [];
    const speedTotal = speedParams.reduce((acc, p) => acc + (parseFloat(p.duration) || 0), 0);
    quenchTotalSeconds += speedTotal + (drip * 60);
  }
  const quenchTotalMinutes = quenchTotalSeconds / 60;

  // 4. Total Duration (Cycle + Quench)
  const totalDuration = totalCycleTime + quenchTotalMinutes;

  // 5. Gas Totals (Modified to include gases only if flow > 0)
  const gasTotals = {};
  const selectedGases = [recipeData?.selected_gas1, recipeData?.selected_gas2, recipeData?.selected_gas3].filter(Boolean);

  // Initialize selected gases
  selectedGases.forEach(g => gasTotals[g] = { time: 0, flow: null });

  chemCycle.forEach(step => {
    const stepDuration = (parseFloat(step.time) || 0) / 60; // min
    if (step.gases && Array.isArray(step.gases)) {
      step.gases.forEach(g => {
        // If the gas is in the selected list AND has flow > 0, add time
        const flow = parseFloat(g.debit || g.flow || 0);
        if (selectedGases.includes(g.gas) && flow > 0) {
          gasTotals[g.gas].time += stepDuration;
          if (gasTotals[g.gas].flow === null) gasTotals[g.gas].flow = flow;
        }
      });
    }
  });

  // 6. Pressure from first chemical cycle step
  const chemPressure = chemCycle[0]?.pressure || null;

  return {
    waitTime,
    chemTotalMinutes,
    totalCycleTime,
    quenchTotalMinutes,
    totalDuration,
    gasTotals,
    chemPressure
  };
};

const formatDurationMinSec = (minutes) => {
  const totalSeconds = Math.round(minutes * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (s === 0) return `${m} min`;
  return `${m}m ${s}s`;
};

const StatsColumn = ({ recipeData, stats }) => {
  const gases = [recipeData?.selected_gas1, recipeData?.selected_gas2, recipeData?.selected_gas3].filter(Boolean);

  return (
    <View style={{ width: '33%', paddingLeft: 10, paddingTop: 15 }}>
      {/* General Info (Moved from Chemical) */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#333', textDecoration: 'underline' }}>PARAMETERS</Text>
        <InfoRow label="Gases" value={gases.join(', ')} />
        <InfoRow label="Wait Time" value={recipeData?.wait_time?.value} unit={recipeData?.wait_time?.unit?.replace('minutes', 'min')} />
        <InfoRow label="Pressure" value={stats.chemPressure} unit="mb" />
        <InfoRow label="Cell Temp" value={recipeData?.cell_temp?.value} unit={recipeData?.cell_temp?.unit} />
      </View>

      {/* Calculated Stats */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#333', textDecoration: 'underline' }}>STATISTICS</Text>
        <InfoRow label="Process time" value={stats.chemTotalMinutes.toFixed(1)} unit="min" />
        <InfoRow label="Quench Time" value={stats.quenchTotalMinutes.toFixed(1)} unit="min" />
        <InfoRow label="Total cycle time" value={`${Math.floor(stats.totalCycleTime / 60)} h ${Math.round(stats.totalCycleTime % 60)} min`} />
      </View>

      {/* Gas Totals */}
      <View>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#333', textDecoration: 'underline' }}>GAS USAGE</Text>
        {Object.entries(stats.gasTotals).map(([gas, data]) => (
          <View key={gas} style={styles.row}>
            <Text style={styles.label}>{gas}:</Text>
            <Text style={styles.value}>
              {formatDurationMinSec(data.time)}{data.flow ? `  |  ${data.flow} Nl/h` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};


// --- SUB-SECTIONS ---

const ThermalColumn = ({ recipeData }) => {
  const preox = recipeData?.preox;
  const thermal = recipeData?.thermal_cycle || [];
  const color = THEME.thermal;

  return (
    <View style={styles.colThermal}>
      <View style={[styles.columnHeaderBase, { backgroundColor: color.headerBg, borderLeftColor: color.headerBorder }]}>
        <Text style={[styles.columnTitleBase, { color: color.title }]}>THERMAL</Text>
      </View>

      {/* Preox */}
      {preox && (preox.temperature?.value || preox.duration?.value) && (
        <View style={{ marginBottom: 5, paddingHorizontal: 2 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 2, textDecoration: 'underline', color: color.title }}>Preoxidation</Text>
          <InfoRow label="Temp" value={preox.temperature?.value} unit={preox.temperature?.unit} />
          <InfoRow label="Duration" value={preox.duration?.value} unit={preox.duration?.unit} />
          <InfoRow label="Media" value={preox.media} />
        </View>
      )}

      {/* Thermal Table */}
      {thermal.length > 0 && (
        <View style={styles.miniTable}>
          <View style={styles.miniHeaderRow}>
            <Text style={[styles.miniCellHeader, { width: 14 }]}>#</Text>
            <Text style={[styles.miniCellHeader, { width: 14 }]}>R</Text>
            <Text style={[styles.miniCellHeader, { flex: 1 }]}>Set (°C)</Text>
            <Text style={[styles.miniCellHeader, { width: 25 }]}>Time{"\n"}(min)</Text>
          </View>
          {thermal.map((step, i) => (
            <View key={i} style={styles.miniRow}>
              <Text style={[styles.miniCell, { width: 14 }]}>{step.step || i + 1}</Text>
              <View style={[styles.miniCell, { width: 14, alignItems: 'center' }]}>
                <RampArrow type={step.ramp} />
              </View>
              <Text style={[styles.miniCell, { flex: 1 }]}>{step.setpoint}</Text>
              <Text style={[styles.miniCell, { width: 25 }]}>{step.duration}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const ChemicalColumn = ({ recipeData }) => {
  const chem = recipeData?.chemical_cycle || [];
  // Removed header info (moved to StatsColumn)
  const color = THEME.chemical;

  return (
    <View style={styles.colChemical}>
      <View style={[styles.columnHeaderBase, { backgroundColor: color.headerBg, borderLeftColor: color.headerBorder }]}>
        <Text style={[styles.columnTitleBase, { color: color.title }]}>CHEMICAL</Text>
      </View>

      {/* Chemical Table Only */}
      {chem.length > 0 && (
        <View style={styles.miniTable}>
          <View style={styles.miniHeaderRow}>
            <Text style={[styles.miniCellHeader, { width: 14 }]}>#</Text>
            <Text style={[styles.miniCellHeader, { width: 22 }]}>Time{"\n"}(s)</Text>

            {/* Dynamic Gas Columns */}
            {recipeData?.selected_gas1 && <Text style={[styles.miniCellHeader, { flex: 1 }]}>{recipeData.selected_gas1}{"\n"}(l/h)</Text>}
            {recipeData?.selected_gas2 && <Text style={[styles.miniCellHeader, { flex: 1 }]}>{recipeData.selected_gas2}{"\n"}(l/h)</Text>}
            {recipeData?.selected_gas3 && <Text style={[styles.miniCellHeader, { flex: 1 }]}>{recipeData.selected_gas3}{"\n"}(l/h)</Text>}

            <Text style={[styles.miniCellHeader, { width: 22 }]}>Press{"\n"}(mb)</Text>
            <Text style={[styles.miniCellHeader, { width: 14 }]}>Trb</Text>
          </View>
          {chem.map((step, i) => {
            const getDebit = (gasName) => {
              const g = step.gases?.find(gf => gf.gas === gasName);
              return g ? g.debit : '-';
            };

            return (
              <View key={i} style={styles.miniRow}>
                <Text style={[styles.miniCell, { width: 14 }]}>{step.step || i + 1}</Text>
                <Text style={[styles.miniCell, { width: 22 }]}>{step.time}</Text>

                {recipeData?.selected_gas1 && <Text style={[styles.miniCell, { flex: 1 }]}>{getDebit(recipeData.selected_gas1)}</Text>}
                {recipeData?.selected_gas2 && <Text style={[styles.miniCell, { flex: 1 }]}>{getDebit(recipeData.selected_gas2)}</Text>}
                {recipeData?.selected_gas3 && <Text style={[styles.miniCell, { flex: 1 }]}>{getDebit(recipeData.selected_gas3)}</Text>}

                <Text style={[styles.miniCell, { width: 22 }]}>{step.pressure}</Text>
                <Text style={[styles.miniCell, { width: 14 }]}>{step.turbine ? '✓' : ''}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const QuenchColumn = ({ quenchData }) => {
  const gas = quenchData?.gas_quench;
  const oil = quenchData?.oil_quench;
  const color = THEME.cooling;

  const hasGas = gas && (
    gas.inerting_delay?.value ||
    gas.inerting_pressure?.value ||
    (gas.speed_parameters && gas.speed_parameters.length > 0) ||
    (gas.pressure_parameters && gas.pressure_parameters.length > 0)
  );

  const hasOil = oil && (
    oil.temperature?.value ||
    oil.inerting_delay?.value ||
    (oil.speed_parameters && oil.speed_parameters.length > 0)
  );

  return (
    <View style={styles.colCooling}>
      <View style={[styles.columnHeaderBase, { backgroundColor: color.headerBg, borderLeftColor: color.headerBorder }]}>
        <Text style={[styles.columnTitleBase, { color: color.title }]}>COOLING</Text>
      </View>

      {/* GAS QUENCH */}
      {hasGas && (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 2, textDecoration: 'underline', color: color.title }}>Gas Quench</Text>
          <InfoRow label="Delay" value={gas.inerting_delay?.value} unit={gas.inerting_delay?.unit} />
          <InfoRow label="Pressure" value={gas.inerting_pressure?.value} unit={gas.inerting_pressure?.unit} />

          {/* Pressure Params */}
          {gas.pressure_parameters?.length > 0 && (
            <View style={styles.miniTable}>
              <View style={[styles.miniHeaderRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.miniCellHeader, { width: 14 }]}>#</Text>
                <Text style={[styles.miniCellHeader, { flex: 1 }]}>Time (s)</Text>
                <Text style={[styles.miniCellHeader, { flex: 1 }]}>Press (mb)</Text>
              </View>
              {gas.pressure_parameters.map((p, i) => (
                <View key={i} style={styles.miniRow}>
                  <Text style={[styles.miniCell, { width: 14 }]}>{p.step || i + 1}</Text>
                  <Text style={[styles.miniCell, { flex: 1 }]}>{p.duration || '-'}</Text>
                  <Text style={[styles.miniCell, { flex: 1 }]}>{p.pressure}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Speed Params */}
          {gas.speed_parameters?.length > 0 && (
            <View style={styles.miniTable}>
              <View style={[styles.miniHeaderRow, { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.miniCellHeader, { width: 14 }]}>#</Text>
                <Text style={[styles.miniCellHeader, { flex: 1 }]}>Time (s)</Text>
                <Text style={[styles.miniCellHeader, { flex: 1 }]}>Speed (rpm)</Text>
              </View>
              {gas.speed_parameters.map((p, i) => (
                <View key={i} style={styles.miniRow}>
                  <Text style={[styles.miniCell, { width: 14 }]}>{p.step || i + 1}</Text>
                  <Text style={[styles.miniCell, { flex: 1 }]}>{p.duration || '-'}</Text>
                  <Text style={[styles.miniCell, { flex: 1 }]}>{p.speed}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* OIL QUENCH */}
      {hasOil && (
        <View>
          <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', marginBottom: 2, textDecoration: 'underline', color: color.title }}>Oil Quench</Text>
          <InfoRow label="Temp" value={oil.temperature?.value} unit={oil.temperature?.unit} />
          <InfoRow label="Delay" value={oil.inerting_delay?.value} unit={oil.inerting_delay?.unit} />
          <InfoRow label="Drip" value={oil.dripping_time?.value} unit={oil.dripping_time?.unit} />

          {/* Speed Params */}
          {oil.speed_parameters?.length > 0 && (
            <View style={styles.miniTable}>
              <View style={styles.miniHeaderRow}>
                <Text style={[styles.miniCellHeader, { width: 14 }]}>#</Text>
                <Text style={[styles.miniCellHeader, { flex: 1 }]}>Time (s)</Text>
                <Text style={[styles.miniCellHeader, { flex: 1 }]}>Speed</Text>
              </View>
              {oil.speed_parameters.map((p, i) => (
                <View key={i} style={styles.miniRow}>
                  <Text style={[styles.miniCell, { width: 14 }]}>{p.step || i + 1}</Text>
                  <Text style={[styles.miniCell, { flex: 1 }]}>{p.duration || '-'}</Text>
                  <Text style={[styles.miniCell, { flex: 1 }]}>{p.speed}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};


/**
 * Composant principal: Section Recette complete
 */
export const RecipeSectionPDF = ({ report, showRecipeDetails = true, showRecipeCurve = true }) => {
  const recipeData = report.recipeData;
  const quenchData = report.quenchData;
  const photos = report.sectionFiles?.recipe || [];

  if (!recipeData && !quenchData) return null;
  if (!showRecipeDetails && !showRecipeCurve) return null;

  const hasPhotos = photos.length > 0;
  const totalPagesSection = hasPhotos ? 2 : 1;

  return (
    <View style={styles.sectionContainer}>

      {/* HEADER P1 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>RECIPE : {recipeData?.number || 'Unknown'}</Text>
        <Text style={styles.sectionPagination}>1 / {totalPagesSection}</Text>
      </View>

      {/* CONTENT P1 */}
  /* CONTENT P1 */
      <View style={styles.mainContent}>

        {/* TOP SECTION: Chart (2/3) + Stats (1/3) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', minHeight: 180, marginBottom: 15 }}>
          {/* 1. Chart (Left 66%) */}
          {showRecipeCurve && (
            <View style={{ width: '66%' }}>
              <RecipeCurveChartPDF
                recipeData={recipeData}
                width={350}
                height={180}
              />
            </View>
          )}

          {/* 2. Stats Column (Right 33%) */}
          <StatsColumn recipeData={recipeData} stats={calculateRecipeStats(recipeData, quenchData)} />
        </View>

        {/* 3. Details Grid (3 Cols) - Bottom */}
        {showRecipeDetails && (
          <View style={styles.detailsGrid}>
            <ThermalColumn recipeData={recipeData} />
            <ChemicalColumn recipeData={recipeData} />
            <QuenchColumn quenchData={quenchData} />
          </View>
        )}
      </View>

      {/* PHOTOS (P2+) */}
      {hasPhotos && (
        <View break>
          {/* HEADER P2 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RECIPE : {recipeData?.number || 'Unknown'}</Text>
            <Text style={styles.sectionPagination}>2 / {totalPagesSection}</Text>
          </View>

          {/* Photos Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {photos.map((photo, i) => (
              <View key={i} style={{ width: '48%', marginBottom: 10 }}>
                <Image
                  style={styles.photo}
                  src={photo.url || photo.viewPath}
                />
                <Text style={styles.photoCaption}>{photo.original_name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};
