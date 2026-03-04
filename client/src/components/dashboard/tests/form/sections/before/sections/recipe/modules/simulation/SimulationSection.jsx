import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form, Alert, Spinner, Button } from 'react-bootstrap';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { runCBPWinSimulation } from '../../../../../../../../../../utils/cbpwin';
import trialService from '../../../../../../../../../../services/trialService';
import predictionService from '../../../../../../../../../../services/predictionService';
import ConfirmationModal from '../../../../../../../../../common/ConfirmationModal/ConfirmationModal';
import { useTheme } from '../../../../../../../../../../context/ThemeContext';

ChartJS.register(LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

// ── Palette phase (invariante) ────────────────────────────────────────────────

const CLR = {
  boost: '#d97706',
  diff:  '#2563eb',
  ecd:   '#dc2626',
  depth: '#16a34a',
};

// ── Thème dynamique ───────────────────────────────────────────────────────────

function getTheme(isDark) {
  return {
    bg:          isDark ? '#1e1e1e'               : '#fafafa',
    border:      isDark ? '#444444'               : '#e9ecef',
    borderFaint: isDark ? '#333333'               : '#f0f0f0',
    text:        isDark ? '#e0e0e0'               : '#343a40',
    muted:       isDark ? '#8a8a9a'               : '#868e96',
    faint:       isDark ? '#4a4a6a'               : '#ced4da',
    summaryBg:   isDark ? '#1a1a2e'               : '#f8f9fa',
    gridLines:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    tooltipBg:   isDark ? 'rgba(10,10,15,0.95)'  : 'rgba(24,24,27,0.90)',
    tickColor:   isDark ? '#666680'               : '#adb5bd',
    separator:   isDark ? '#333355'               : '#dee2e6',
    hint:        isDark ? '#4a4a6a'               : '#ced4da',
  };
}

// ── Groupes de paramètres ─────────────────────────────────────────────────────

const GROUPS = [
  {
    label: 'Pièce',
    fields: [
      { key: 'initial_carbon', label: 'C₀',              unit: '%',  step: '0.001', min: 0,   max: 1    },
      { key: 'eff_carbon',     label: '% ECD',            unit: '%',  step: '0.001', min: 0,   max: 1    },
      { key: 'target_depth',   label: 'Profondeur cible', unit: 'mm', step: '0.01',  min: 0,   max: 10   },
    ],
  },
  {
    label: 'Process',
    fields: [
      { key: 'temperature',  label: 'Température', unit: '°C', step: '1',    min: 800, max: 1100 },
      { key: 'carbon_flow',  label: 'Flux C₂H₂',  unit: '%',  step: '0.01', min: 0,   max: 100  },
    ],
  },
  {
    label: 'Seuils carbone',
    fields: [
      { key: 'carbon_max',   label: 'C max',   unit: '%', step: '0.001', min: 0, max: 3 },
      { key: 'carbon_min',   label: 'C min',   unit: '%', step: '0.001', min: 0, max: 3 },
      { key: 'carbon_final', label: 'C final', unit: '%', step: '0.001', min: 0, max: 3 },
    ],
  },
];

const EMPTY_PARAMS = {
  initial_carbon: '', temperature: '', carbon_flow: '',
  carbon_max: '', carbon_min: '', carbon_final: '',
  eff_carbon: '', target_depth: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(s) {
  s = Math.round(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function getEffCarbon(hv) {
  if (hv >= 700) return 0.45; if (hv >= 650) return 0.42;
  if (hv >= 600) return 0.39; if (hv >= 550) return 0.36;
  if (hv >= 513) return 0.32; return 0.36;
}

function extractInitialCarbon(steel) {
  if (!steel?.chemistery || !Array.isArray(steel.chemistery)) return null;
  const elem = steel.chemistery.find((c) => {
    const el = (c.element || '').toLowerCase();
    return el.includes('carbon') || el === 'c' || el.startsWith('c -') || el.startsWith('c-');
  });
  if (!elem) return null;
  let val = null;
  if (elem.value !== undefined && elem.value !== null && elem.value !== '') {
    const raw = String(elem.value).replace(/,/g, '.').trim();
    if (raw.includes('-')) {
      const parts = raw.split('-').map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) val = (parts[0] + parts[1]) / 2;
    } else { val = parseFloat(raw); }
  } else if (elem.min_value !== undefined && elem.max_value !== undefined) {
    const mn = parseFloat(String(elem.min_value).replace(/,/g, '.'));
    const mx = parseFloat(String(elem.max_value).replace(/,/g, '.'));
    if (!isNaN(mn) && !isNaN(mx)) val = (mn + mx) / 2;
  } else if (elem.min !== undefined && elem.max !== undefined) {
    const mn = parseFloat(String(elem.min).replace(/,/g, '.'));
    const mx = parseFloat(String(elem.max).replace(/,/g, '.'));
    if (!isNaN(mn) && !isNaN(mx)) val = (mn + mx) / 2;
  }
  return val !== null && !isNaN(val) ? val : null;
}

function extractPartParams(part) {
  const updates = {};
  const ic = extractInitialCarbon(part?.steel);
  if (ic !== null) updates.initial_carbon = ic;
  const spec = (part?.ecdSpecs || []).find((s) => s.depthMin && s.depthMax);
  if (spec) {
    const mn = parseFloat(spec.depthMin), mx = parseFloat(spec.depthMax);
    if (!isNaN(mn) && !isNaN(mx)) updates.target_depth = parseFloat(((mn + mx) / 2).toFixed(3));
    const hv = parseFloat(spec.hardness);
    if (!isNaN(hv)) updates.eff_carbon = getEffCarbon(hv);
  }
  return updates;
}

function extractTempParams(temp) {
  const cmax = parseFloat((0.0125 * temp - 10.2).toFixed(4));
  return {
    temperature:  temp,
    carbon_flow:  parseFloat((0.09 * temp - 71.2).toFixed(4)),
    carbon_max:   cmax,
    carbon_min:   parseFloat((0.7  * cmax).toFixed(4)),
    carbon_final: parseFloat((0.69 * cmax).toFixed(4)),
  };
}

/**
 * Resample le profil carbone à des intervalles réguliers de `step` % en carbone.
 * Retourne des points {x: carbon%, y: depth_mm} interpolés linéairement.
 * Garantit une résolution de tooltip de `step` % sur l'axe X du graphique.
 */
function resampleProfile(profile, step = 0.01) {
  if (!profile || profile.length < 2) {
    return profile.map((p) => ({ x: p.carbon, y: p.depth }));
  }

  let maxC = -Infinity;
  let minC = Infinity;
  for (const p of profile) {
    if (p.carbon > maxC) maxC = p.carbon;
    if (p.carbon < minC) minC = p.carbon;
  }

  const result = [];

  // Point de surface exact
  result.push({ x: parseFloat(maxC.toFixed(4)), y: parseFloat(profile[0].depth.toFixed(4)) });

  // Premier multiple de step en dessous de maxC (pour éviter le doublon avec le point surface)
  let c = parseFloat((Math.floor(maxC / step) * step).toFixed(4));
  if (c >= maxC - step * 0.001) c = parseFloat((c - step).toFixed(4));

  while (c >= minC - step * 0.001) {
    const cTarget = parseFloat(c.toFixed(4));
    if (cTarget < minC) break;

    // Interpolation linéaire dans le segment du profil contenant cTarget
    let depth = null;
    for (let i = 0; i < profile.length - 1; i++) {
      const c0    = profile[i].carbon;
      const c1    = profile[i + 1].carbon;
      const cHigh = c0 >= c1 ? c0 : c1;
      const cLow  = c0 < c1 ? c0 : c1;

      if (cTarget <= cHigh && cTarget >= cLow) {
        if (Math.abs(c0 - c1) < 1e-10) {
          depth = profile[i].depth;
        } else {
          const t = (c0 - cTarget) / (c0 - c1);
          depth = profile[i].depth + t * (profile[i + 1].depth - profile[i].depth);
        }
        break;
      }
    }

    if (depth !== null) {
      result.push({ x: cTarget, y: parseFloat(depth.toFixed(4)) });
    }
    c = parseFloat((c - step).toFixed(10));
  }

  return result;
}

// ── Sous-composants ───────────────────────────────────────────────────────────

/** Input compact thématisé */
const Field = ({ def, value, onChange, disabled, isDark }) => {
  const TH = getTheme(isDark);
  return (
    <Form.Group className="mb-0">
      <Form.Label style={{ fontSize: '0.70rem', color: TH.muted, marginBottom: '2px', fontWeight: 500, display: 'block' }}>
        {def.label} <span style={{ color: TH.faint }}>({def.unit})</span>
      </Form.Label>
      <Form.Control
        type="number"
        size="sm"
        value={value}
        onChange={(e) => onChange(def.key, e.target.value)}
        step={def.step}
        min={def.min}
        max={def.max}
        disabled={disabled}
        placeholder="—"
        style={{ fontSize: '0.80rem' }}
      />
    </Form.Group>
  );
};

/**
 * Grille cycle × phase — 1 ligne par cycle, 2 cellules cliquables (Boost | Diffusion).
 * Chaque cellule est indépendamment sélectionnable.
 */
const CLR_FINAL = '#7c3aed';

const CyclesGrid = ({ history, selectedEntry, onSelect, isDark, finalEntry }) => {
  const TH = getTheme(isDark);

  const cycles = useMemo(() => {
    const map = [];
    history.forEach((e) => {
      if (e.phase === 'Boost') map.push({ n: e.cycle, boost: e, diff: null });
      else if (map.length > 0) map[map.length - 1].diff = e;
    });
    return map;
  }, [history]);

  // Toggle : cliquer sur une entrée déjà sélectionnée la désélectionne
  const handleSelect = (entry) => {
    if (selectedEntry && selectedEntry.cycle === entry.cycle && selectedEntry.phase === entry.phase) {
      onSelect(null);
    } else {
      onSelect(entry);
    }
  };

  const cellBase = {
    flex: 1,
    padding: '4px 8px',
    borderRadius: '3px',
    minWidth: 0,
    transition: 'background-color 0.12s, border-color 0.12s',
  };

  const hasFinal = !!finalEntry;
  const cols = hasFinal ? '32px 1fr 1fr 1fr' : '32px 1fr 1fr';

  return (
    <div style={{ overflowY: 'auto', maxHeight: '290px' }}>
      {/* En-tête colonnes */}
      <div style={{
        display: 'grid', gridTemplateColumns: cols, gap: '4px',
        padding: '2px 4px 5px', borderBottom: `1px solid ${TH.borderFaint}`,
      }}>
        <div />
        <div style={{ fontSize: '0.60rem', fontWeight: 700, color: CLR.boost, textTransform: 'uppercase', paddingLeft: '8px' }}>
          Boost
        </div>
        <div style={{ fontSize: '0.60rem', fontWeight: 700, color: CLR.diff, textTransform: 'uppercase', paddingLeft: '8px' }}>
          Diffusion
        </div>
        {hasFinal && (
          <div style={{ fontSize: '0.60rem', fontWeight: 700, color: CLR_FINAL, textTransform: 'uppercase', paddingLeft: '8px' }}>
            Final
          </div>
        )}
      </div>

      {/* Lignes */}
      {cycles.map((c, idx) => {
        const isLast     = idx === cycles.length - 1;
        const boostActive = selectedEntry?.cycle === c.n && selectedEntry?.phase === 'Boost';
        const diffActive  = selectedEntry?.cycle === c.n && selectedEntry?.phase === 'Diffusion';
        return (
          <div
            key={c.n}
            style={{
              display: 'grid', gridTemplateColumns: cols, gap: '4px',
              alignItems: 'stretch', padding: '3px 0',
              borderBottom: `1px solid ${TH.borderFaint}`,
            }}
          >
            {/* N° cycle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700, color: TH.faint,
            }}>
              {c.n}
            </div>

            {/* Cellule Boost */}
            {c.boost ? (
              <div
                onClick={() => handleSelect(c.boost)}
                style={{
                  ...cellBase,
                  cursor: 'pointer',
                  borderLeft: `2px solid ${boostActive ? CLR.boost : 'transparent'}`,
                  backgroundColor: boostActive ? 'rgba(217,119,6,0.10)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: TH.text, fontWeight: 500 }}>
                  {c.boost.duration}s
                </div>
                <div style={{ fontSize: '0.64rem', color: TH.muted }}>
                  Cs {c.boost.surfaceCarbon.toFixed(2)} %
                </div>
              </div>
            ) : <div />}

            {/* Cellule Diffusion */}
            {c.diff ? (
              <div
                onClick={() => handleSelect(c.diff)}
                style={{
                  ...cellBase,
                  cursor: 'pointer',
                  borderLeft: `2px solid ${diffActive ? CLR.diff : 'transparent'}`,
                  backgroundColor: diffActive ? 'rgba(37,99,235,0.10)' : 'transparent',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: TH.text, fontWeight: 500 }}>
                  {c.diff.duration}s
                </div>
                <div style={{ fontSize: '0.64rem', color: TH.muted }}>
                  Cs {c.diff.surfaceCarbon.toFixed(2)} % ·{' '}
                  <span style={{ color: CLR.depth, fontWeight: 600 }}>
                    {c.diff.depth.toFixed(2)} mm
                  </span>
                </div>
              </div>
            ) : <div />}

            {/* Cellule Final — uniquement sur la dernière ligne */}
            {hasFinal && (
              isLast ? (
                <div
                  onClick={() => handleSelect(finalEntry)}
                  style={{
                    ...cellBase,
                    cursor: 'pointer',
                    borderLeft: `2px solid ${selectedEntry?.phase === 'Final' ? CLR_FINAL : 'transparent'}`,
                    backgroundColor: selectedEntry?.phase === 'Final' ? 'rgba(124,58,237,0.10)' : 'transparent',
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: TH.text, fontWeight: 500 }}>
                    {finalEntry.duration}s
                  </div>
                  <div style={{ fontSize: '0.64rem', color: TH.muted }}>
                    Cs {finalEntry.surfaceCarbon.toFixed(2)} % ·{' '}
                    <span style={{ color: CLR.depth, fontWeight: 600 }}>
                      {finalEntry.depth.toFixed(2)} mm
                    </span>
                  </div>
                </div>
              ) : <div />
            )}
          </div>
        );
      })}
    </div>
  );
};

/** Graphique profil carbone — X = carbone %, Y = profondeur mm */
const CarbonProfileChart = ({ profile, effCarbon, selectedDepth, phase, isDark }) => {
  const TH         = getTheme(isDark);
  const curveColor = phase === 'Boost' ? CLR.boost : phase === 'Final' ? CLR_FINAL : CLR.diff;

  const maxCarbon = useMemo(
    () => (profile.length > 0 ? Math.max(...profile.map((p) => p.carbon)) : effCarbon + 0.2),
    [profile, effCarbon]
  );
  const maxDepth = profile.length > 0 ? profile[profile.length - 1].depth : 1;

  // Données rééchantillonnées à 0.01 % pour une résolution de tooltip précise
  const resampledData = useMemo(() => resampleProfile(profile, 0.01), [profile]);

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: 'Profil carbone',
        data: resampledData,
        borderColor: curveColor,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.2,
        cubicInterpolationMode: 'monotone',
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: curveColor,
        borderWidth: 2.5,
      },
      {
        label: `ECD ${effCarbon.toFixed(2)} %`,
        data: [{ x: effCarbon, y: 0 }, { x: effCarbon, y: maxDepth }],
        borderColor: `${CLR.ecd}99`,
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
      {
        label: `${selectedDepth.toFixed(2)} mm`,
        data: [{ x: maxCarbon + 0.05, y: selectedDepth }, { x: 0, y: selectedDepth }],
        borderColor: `${CLR.depth}99`,
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
    ],
  }), [resampledData, effCarbon, selectedDepth, maxCarbon, maxDepth, curveColor]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 4, right: 6, bottom: 0, left: 0 } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: {
        type: 'linear',
        reverse: true,
        grid: { color: TH.gridLines },
        border: { display: false },
        title: { display: true, text: 'Carbon (%)', font: { size: 10 }, color: TH.tickColor },
        ticks: { stepSize: 0.1, font: { size: 9 }, color: TH.tickColor, callback: (v) => Number(v).toFixed(2) },
      },
      y: {
        type: 'linear',
        reverse: true,
        grid: { color: TH.gridLines },
        border: { display: false },
        title: { display: true, text: 'Depth (mm)', font: { size: 10 }, color: TH.tickColor },
        ticks: { font: { size: 9 }, color: TH.tickColor, callback: (v) => Number(v).toFixed(2) },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: TH.tooltipBg,
        padding: 8,
        titleColor: '#f4f4f5',
        bodyColor: '#a1a1aa',
        borderWidth: 0,
        callbacks: {
          title: (items) => items[0] ? `${Number(items[0].parsed.x).toFixed(2)} % C` : '',
          label: (item) => {
            if (item.datasetIndex === 0) return `  Profondeur : ${item.parsed.y.toFixed(2)} mm`;
            if (item.datasetIndex === 1) return `  Seuil ECD : ${item.parsed.x.toFixed(2)} %`;
            return `  Profondeur ECD : ${item.parsed.y.toFixed(2)} mm`;
          },
        },
      },
    },
  }), [isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ height: '250px', position: 'relative' }}>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

// ── Composant principal ───────────────────────────────────────────────────────

const SimulationSection = ({ formData, trial = null, viewMode = false, handleChange }) => {
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
  const TH = getTheme(isDarkTheme);

  const [params, setParams] = useState(() => {
    const temp = parseFloat(formData?.recipeData?.processTemp);
    if (temp && !isNaN(temp)) return { ...EMPTY_PARAMS, ...extractTempParams(temp) };
    return { ...EMPTY_PARAMS };
  });
  const [result, setResult]               = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [simLoading, setSimLoading]       = useState(false);
  const [simError, setSimError]           = useState(null);
  const [showFillConfirm, setShowFillConfirm] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const temp = parseFloat(formData?.recipeData?.processTemp);
    if (!temp || isNaN(temp)) return;
    setParams((prev) => ({ ...prev, ...extractTempParams(temp) }));
  }, [formData?.recipeData?.processTemp]);

  useEffect(() => {
    if (!trial) return;
    const trialId    = trial?.id || trial?.node_id;
    const directPart = trial?.node?.parent?.part;
    if (directPart) {
      const updates = extractPartParams(directPart);
      if (Object.keys(updates).length > 0) { setParams((prev) => ({ ...prev, ...updates })); return; }
    }
    if (!trialId) return;
    trialService.getTrial(trialId)
      .then((ft) => {
        const part = ft?.node?.parent?.part;
        if (!part) return;
        const updates = extractPartParams(part);
        if (Object.keys(updates).length > 0) setParams((prev) => ({ ...prev, ...updates }));
      })
      .catch((e) => console.warn('[SimulationSection] prefill part data failed:', e));
  }, [trial]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const allFilled = Object.values(params).every((v) => v !== '' && v !== null && !isNaN(parseFloat(v)));
    if (!allFilled) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSimLoading(true);
      setSimError(null);
      setSelectedEntry(null);
      setTimeout(() => {
        try {
          const num = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, parseFloat(v)]));
          const sim = runCBPWinSimulation(num);
          setResult(sim);
          setSelectedEntry(sim.history[sim.history.length - 1]);
        } catch (e) {
          setSimError(e.message || 'Erreur lors de la simulation');
          setResult(null);
        } finally {
          setSimLoading(false);
        }
      }, 0);
    }, 800);
    return () => clearTimeout(debounceRef.current);
  }, [params]);

  const handleParamChange = (key, value) => setParams((prev) => ({ ...prev, [key]: value }));

  const handleFillCycles = () => {
    if (!result || !handleChange) return;

    // Construire reconstructed_recipe depuis l'historique de simulation
    // Format attendu par predictionService : [[carb, diff], ..., [carb, diff]]
    const cycles = [];
    result.history.forEach((e) => {
      if (e.phase === 'Boost') {
        cycles.push({ boost: e.duration, diff: null });
      } else if (e.phase === 'Diffusion' && cycles.length > 0) {
        cycles[cycles.length - 1].diff = e.duration;
      }
    });

    const lastFinalTime = result.summary.last_final_time || 0;
    const reconstructedRecipe = cycles.map((c, idx) => {
      const isLast = idx === cycles.length - 1;
      if (isLast && lastFinalTime > 0) {
        return [c.boost || 0, c.diff || 0, lastFinalTime];
      }
      return [c.boost || 0, c.diff || 0];
    });
    if (reconstructedRecipe.length === 0) return;

    // Mapper vers cycles chimiques (réutilise la brique de predictionService)
    const predictedCycles = predictionService.mapToChemicalCycles(reconstructedRecipe).map(step => ({
      ...step,
      debit1: step._phase === 'carburation' ? 2500 : '',  // C2H2 : 2500 Nl/h sur boost
      debit2: step._phase !== 'carburation' ? 1500 : '',  // N2   : 1500 Nl/h sur diffusion/final
      pressure: 10,
    }));

    // Calculer le cycle thermique
    const recipeTemperature = parseFloat(params.temperature) || 950;
    const thermalCycleData = predictionService.calculateThermalCycle(
      reconstructedRecipe,
      {
        rampUpTime: 60,
        treatmentTemp: recipeTemperature,
        quenchTemp: null,
        coolingTime: 20,
      }
    );

    // Mettre à jour le cycle chimique
    handleChange({ target: { name: 'recipeData.chemicalCycle', value: predictedCycles } });

    // Mettre à jour le cycle thermique
    if (thermalCycleData) {
      const thermalSteps = thermalCycleData.thermalCycle.map((step, index) => ({
        step: index + 1,
        setpoint: step.temperature,
        temperature: step.temperature,
        duration: step.duration,
        tempUnit: '°C',
        durationUnit: 'min',
      }));
      handleChange({ target: { name: 'recipeData.thermalCycle', value: thermalSteps } });
    }
  };

  const phaseColor = selectedEntry?.phase === 'Boost' ? CLR.boost
    : selectedEntry?.phase === 'Final' ? CLR_FINAL
    : CLR.diff;

  const labelStyle = {
    fontSize: '0.63rem', fontWeight: 700, color: TH.faint,
    textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px',
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Paramètres groupés ── */}
      <div style={{ border: `1px solid ${TH.border}`, borderRadius: '8px', padding: '12px 16px', marginBottom: '14px', backgroundColor: TH.bg }}>
        <Row className="g-0">

          {/* Pièce */}
          <Col md={4} style={{ paddingRight: '14px', borderRight: `1px solid ${TH.borderFaint}` }}>
            <div style={labelStyle}>Pièce</div>
            <Row className="g-2">
              <Col xs={6}>
                <Field def={GROUPS[0].fields[0]} value={params.initial_carbon} onChange={handleParamChange} disabled={viewMode} isDark={isDarkTheme} />
              </Col>
              <Col xs={6}>
                <Field def={GROUPS[0].fields[1]} value={params.eff_carbon} onChange={handleParamChange} disabled={viewMode} isDark={isDarkTheme} />
              </Col>
              <Col xs={12} className="mt-2">
                <Field def={GROUPS[0].fields[2]} value={params.target_depth} onChange={handleParamChange} disabled={viewMode} isDark={isDarkTheme} />
              </Col>
            </Row>
          </Col>

          {/* Process */}
          <Col md={3} style={{ padding: '0 14px', borderRight: `1px solid ${TH.borderFaint}` }}>
            <div style={labelStyle}>Process</div>
            <div className="mb-2">
              <Field def={GROUPS[1].fields[0]} value={params.temperature} onChange={handleParamChange} disabled={viewMode} isDark={isDarkTheme} />
            </div>
            <Field def={GROUPS[1].fields[1]} value={params.carbon_flow} onChange={handleParamChange} disabled={viewMode} isDark={isDarkTheme} />
          </Col>

          {/* Seuils */}
          <Col md={5} style={{ paddingLeft: '14px' }}>
            <div style={labelStyle}>Seuils carbone</div>
            <Row className="g-2">
              {GROUPS[2].fields.map((f) => (
                <Col key={f.key} xs={4}>
                  <Field def={f} value={params[f.key]} onChange={handleParamChange} disabled={viewMode} isDark={isDarkTheme} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>

      {/* ── Chargement ── */}
      {simLoading && (
        <div className="d-flex align-items-center justify-content-center py-4" style={{ color: TH.muted }}>
          <Spinner animation="border" size="sm" className="me-2" style={{ opacity: 0.6 }} />
          <span style={{ fontSize: '0.85rem' }}>Simulation en cours…</span>
        </div>
      )}

      {/* ── Erreur ── */}
      {!simLoading && simError && (
        <Alert variant="danger" className="py-2" style={{ fontSize: '0.85rem' }}>{simError}</Alert>
      )}

      {/* ── Résultats ── */}
      {!simLoading && !simError && result && (
        <>
          {/* Barre de résumé */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '7px 14px', backgroundColor: TH.summaryBg,
            borderRadius: '6px', fontSize: '0.80rem', marginBottom: '12px', flexWrap: 'wrap',
          }}>
            <span>
              <strong style={{ color: TH.text }}>{result.summary.num_cycles}</strong>
              <span style={{ color: TH.muted, marginLeft: '4px' }}>cycle{result.summary.num_cycles > 1 ? 's' : ''}</span>
            </span>
            <span style={{ color: TH.separator }}>|</span>
            <span>
              <strong style={{ color: CLR.boost }}>{formatTime(result.summary.total_carb)}</strong>
              <span style={{ color: TH.muted, marginLeft: '4px' }}>boost</span>
            </span>
            <span style={{ color: TH.separator }}>|</span>
            <span>
              <strong style={{ color: CLR.diff }}>{formatTime(result.summary.total_diff)}</strong>
              <span style={{ color: TH.muted, marginLeft: '4px' }}>diff</span>
            </span>
            <span style={{ color: TH.separator }}>|</span>
            <span>
              <strong style={{ color: TH.text }}>{formatTime(result.summary.total_time)}</strong>
              <span style={{ color: TH.muted, marginLeft: '4px' }}>total</span>
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>
                <strong style={{ color: CLR.depth, fontSize: '0.88rem' }}>{result.summary.final_depth.toFixed(2)} mm</strong>
                <span style={{ color: TH.muted, marginLeft: '4px' }}>ECD</span>
              </span>
              {!viewMode && handleChange && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowFillConfirm(true)}
                  style={{ fontSize: '0.78rem', padding: '2px 10px', whiteSpace: 'nowrap' }}
                >
                  Remplir les cycles
                </Button>
              )}
            </span>
          </div>

          {/* Split : historique | graphique */}
          <Row className="g-2" style={{ alignItems: 'stretch' }}>

            {/* Historique cycles */}
            <Col md={5}>
              <div style={{ border: `1px solid ${TH.border}`, borderRadius: '8px', padding: '10px 6px 10px 8px', height: '100%' }}>
                <div style={labelStyle}>Historique</div>
                <CyclesGrid
                  history={result.history}
                  selectedEntry={selectedEntry}
                  onSelect={setSelectedEntry}
                  isDark={isDarkTheme}
                  finalEntry={result.summary.final_entry}
                />
              </div>
            </Col>

            {/* Panneau graphique */}
            <Col md={7}>
              {selectedEntry ? (
                <div style={{ border: `1px solid ${TH.border}`, borderRadius: '8px', padding: '10px 14px', height: '100%' }}>
                  {/* En-tête sélection */}
                  <div className="d-flex align-items-baseline justify-content-between mb-2">
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: phaseColor }}>
                        {selectedEntry.phase}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: TH.muted, marginLeft: '6px' }}>
                        Cycle {selectedEntry.cycle} · Cs {selectedEntry.surfaceCarbon.toFixed(2)} %
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.70rem', color: TH.muted }}>ECD </span>
                      <strong style={{ fontSize: '0.88rem', color: CLR.depth }}>
                        {selectedEntry.depth.toFixed(2)} mm
                      </strong>
                    </div>
                  </div>
                  {/* Légende manuelle */}
                  <div className="d-flex gap-3 mb-2" style={{ fontSize: '0.70rem', color: TH.muted }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: phaseColor, borderRadius: '1px' }} />
                      Profil carbone
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: `${CLR.ecd}99`, borderRadius: '1px', borderBottom: '1px dashed' }} />
                      ECD {parseFloat(params.eff_carbon).toFixed(2)} %
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: `${CLR.depth}99`, borderRadius: '1px' }} />
                      {selectedEntry.depth.toFixed(2)} mm
                    </span>
                  </div>
                  <CarbonProfileChart
                    profile={selectedEntry.profile}
                    effCarbon={parseFloat(params.eff_carbon)}
                    selectedDepth={selectedEntry.depth}
                    phase={selectedEntry.phase}
                    isDark={isDarkTheme}
                  />
                </div>
              ) : (() => {
                const defaultEntry = result.history[result.history.length - 1];
                const defaultColor = defaultEntry?.phase === 'Boost' ? CLR.boost : CLR.diff;
                return (
                  <div style={{ border: `1px solid ${TH.border}`, borderRadius: '8px', padding: '10px 14px', height: '100%' }}>
                    <div className="d-flex align-items-baseline justify-content-between mb-2">
                      <div>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: defaultColor }}>
                          {defaultEntry?.phase}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: TH.muted, marginLeft: '6px' }}>
                          Cycle {defaultEntry?.cycle} · Cs {defaultEntry?.surfaceCarbon.toFixed(2)} %
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.70rem', color: TH.muted }}>ECD </span>
                        <strong style={{ fontSize: '0.88rem', color: CLR.depth }}>
                          {defaultEntry?.depth.toFixed(2)} mm
                        </strong>
                      </div>
                    </div>
                    <div className="d-flex gap-3 mb-2" style={{ fontSize: '0.70rem', color: TH.muted }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: defaultColor, borderRadius: '1px' }} />
                        Profil carbone
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: `${CLR.ecd}99`, borderRadius: '1px' }} />
                        ECD {parseFloat(params.eff_carbon).toFixed(2)} %
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '16px', height: '2px', backgroundColor: `${CLR.depth}99`, borderRadius: '1px' }} />
                        {defaultEntry?.depth.toFixed(2)} mm
                      </span>
                    </div>
                    <CarbonProfileChart
                      profile={defaultEntry?.profile}
                      effCarbon={parseFloat(params.eff_carbon)}
                      selectedDepth={defaultEntry?.depth}
                      phase={defaultEntry?.phase}
                      isDark={isDarkTheme}
                    />
                  </div>
                );
              })()}
            </Col>
          </Row>
        </>
      )}

      {/* ── État vide ── */}
      {!simLoading && !simError && !result && (
        <p className="text-center py-3 mb-0" style={{ color: TH.hint, fontSize: '0.85rem' }}>
          Renseignez les paramètres pour lancer la simulation automatiquement.
        </p>
      )}

      <ConfirmationModal
        show={showFillConfirm}
        onHide={() => setShowFillConfirm(false)}
        onConfirm={handleFillCycles}
        title={t('trials.before.recipeData.simulation.fillConfirmTitle')}
        message={t('trials.before.recipeData.simulation.fillConfirmMessage')}
        confirmText={t('trials.before.recipeData.simulation.fillConfirmButton')}
        cancelText={t('common.cancel')}
        variant="warning"
      />
    </>
  );
};

export default SimulationSection;
