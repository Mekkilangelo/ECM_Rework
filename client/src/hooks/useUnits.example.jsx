/**
 * EXEMPLES D'UTILISATION DU HOOK useUnits
 * Système optimisé pour gérer les unités avec filtrage par type
 * 
 * ✅ AVANTAGES :
 * - Une seule requête HTTP pour charger toutes les unités
 * - Cache automatique côté client
 * - Filtrage instantané sans latence réseau
 * - Support du filtrage par type d'unité
 * - Performance optimale pour les dropdowns
 */

import React from 'react';
import useUnits, { useUnitTypes } from './useUnits';

// ============================================================
// EXEMPLE 1 : Dropdown simple pour toutes les unités
// ============================================================
const AllUnitsDropdown = () => {
  const { units, loading, error } = useUnits();

  if (loading) return <div>Chargement des unités...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <select>
      <option value="">Sélectionnez une unité</option>
      {units.map(unit => (
        <option key={unit.value} value={unit.value}>
          {unit.label}
        </option>
      ))}
    </select>
  );
};

// ============================================================
// EXEMPLE 2 : Dropdown filtré par type (LONGUEUR uniquement)
// ============================================================
const LengthUnitsDropdown = () => {
  // Filtrage automatique par type "Length"
  const { units, loading, error } = useUnits('Length');

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <select>
      <option value="">Sélectionnez une unité de longueur</option>
      {units.map(unit => (
        <option key={unit.value} value={unit.value}>
          {unit.label}
        </option>
      ))}
    </select>
  );
};

// ============================================================
// EXEMPLE 3 : Formulaire de pièce avec unités contextuelles
// ============================================================
const PartDimensionsForm = () => {
  const [formData, setFormData] = React.useState({
    weight: '',
    weight_unit: '',
    length: '',
    length_unit: '',
    width: '',
    width_unit: ''
  });

  // Chargement optimisé - UNE SEULE requête pour toutes les unités
  const { unitsByType, loading } = useUnits();

  if (loading) return <div>Chargement du formulaire...</div>;

  return (
    <form>
      {/* Poids */}
      <div>
        <label>Poids</label>
        <input
          type="number"
          value={formData.weight}
          onChange={e => setFormData({ ...formData, weight: e.target.value })}
        />
        <select
          value={formData.weight_unit}
          onChange={e => setFormData({ ...formData, weight_unit: e.target.value })}
        >
          <option value="">Unité</option>
          {/* Affiche uniquement les unités de type "Weight" */}
          {(unitsByType.Weight || []).map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>

      {/* Longueur */}
      <div>
        <label>Longueur</label>
        <input
          type="number"
          value={formData.length}
          onChange={e => setFormData({ ...formData, length: e.target.value })}
        />
        <select
          value={formData.length_unit}
          onChange={e => setFormData({ ...formData, length_unit: e.target.value })}
        >
          <option value="">Unité</option>
          {/* Affiche uniquement les unités de type "Length" */}
          {(unitsByType.Length || []).map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>

      {/* Largeur */}
      <div>
        <label>Largeur</label>
        <input
          type="number"
          value={formData.width}
          onChange={e => setFormData({ ...formData, width: e.target.value })}
        />
        <select
          value={formData.width_unit}
          onChange={e => setFormData({ ...formData, width_unit: e.target.value })}
        >
          <option value="">Unité</option>
          {/* Affiche uniquement les unités de type "Length" */}
          {(unitsByType.Length || []).map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
};

// ============================================================
// EXEMPLE 4 : Dropdown avec filtrage dynamique
// ============================================================
const DynamicUnitDropdown = () => {
  const [selectedType, setSelectedType] = React.useState('');
  const { unitTypes } = useUnitTypes();
  const { units, loading } = useUnits(selectedType);

  return (
    <div>
      {/* Sélection du type */}
      <select
        value={selectedType}
        onChange={e => setSelectedType(e.target.value)}
      >
        <option value="">Tous les types</option>
        {unitTypes.map(type => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {/* Unités filtrées automatiquement */}
      <select disabled={loading}>
        <option value="">Sélectionnez une unité</option>
        {units.map(unit => (
          <option key={unit.value} value={unit.value}>
            {unit.label}
            {unit.unit_type && ` (${unit.unit_type})`}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================================
// EXEMPLE 5 : Utilisation avec useOptionsFetcher (intégration)
// ============================================================
const IntegratedExample = () => {
  const { units: weightUnits } = useUnits('Weight');
  const { units: lengthUnits } = useUnits('Length');
  const { units: tempUnits } = useUnits('Temperature');

  // Tous les hooks utilisent le MÊME cache
  // Donc même avec 3 appels, il n'y a qu'UNE SEULE requête HTTP !

  return (
    <div>
      <h3>Unités de poids ({weightUnits.length})</h3>
      <ul>
        {weightUnits.map(u => <li key={u.value}>{u.label}</li>)}
      </ul>

      <h3>Unités de longueur ({lengthUnits.length})</h3>
      <ul>
        {lengthUnits.map(u => <li key={u.value}>{u.label}</li>)}
      </ul>

      <h3>Unités de température ({tempUnits.length})</h3>
      <ul>
        {tempUnits.map(u => <li key={u.value}>{u.label}</li>)}
      </ul>
    </div>
  );
};

// ============================================================
// EXEMPLE 6 : Affichage groupé par type
// ============================================================
const UnitsByTypeDisplay = () => {
  const { unitsByType, loading, error } = useUnits();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error}</div>;

  return (
    <div>
      {Object.entries(unitsByType).map(([type, units]) => (
        <div key={type}>
          <h3>{type}</h3>
          <ul>
            {units.map(unit => (
              <li key={unit.value}>
                {unit.label}
                {unit.description && ` - ${unit.description}`}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// EXPORT DES EXEMPLES
// ============================================================
export {
  AllUnitsDropdown,
  LengthUnitsDropdown,
  PartDimensionsForm,
  DynamicUnitDropdown,
  IntegratedExample,
  UnitsByTypeDisplay
};
