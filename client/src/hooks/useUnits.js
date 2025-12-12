/**
 * Hook personnalisé pour gérer les unités de manière optimisée
 * Charge toutes les unités UNE FOIS et les met en cache
 * Permet le filtrage instantané par type côté client
 */
import { useState, useEffect, useMemo } from 'react';
import referenceService from '../services/referenceService';

/**
 * Hook pour récupérer et filtrer les unités
 * @param {string} [unitType] - Type d'unité pour filtrage (optionnel)
 * @returns {Object} - { units, loading, error, allUnits, unitsByType }
 */
const useUnits = (unitType = null) => {
  const [allUnits, setAllUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger toutes les unités UNE SEULE FOIS au montage
  useEffect(() => {
    let isMounted = true;

    const loadUnits = async () => {
      try {
        setLoading(true);
        const response = await referenceService.getValues('ref_units');
        console.log('[useUnits] Response from API:', response);
        console.log('[useUnits] Response type:', typeof response);
        console.log('[useUnits] Is array?:', Array.isArray(response));
        if (response && response.length > 0) {
          console.log('[useUnits] First item:', response[0]);
          console.log('[useUnits] First 5 items with unit_type:', response.slice(0, 5).map(u => ({ name: u.name, unit_type: u.unit_type })));
          
          // Obtenir tous les unit_type uniques
          const uniqueTypes = [...new Set(response.map(u => u.unit_type))];
          console.log('[useUnits] UNIQUE UNIT_TYPES IN DATABASE:', uniqueTypes);
        }
        
        if (isMounted) {
          setAllUnits(response || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useUnits] Error loading units:', err);
          setError(err.message || 'Failed to load units');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUnits();

    return () => {
      isMounted = false;
    };
  }, []); // Pas de dépendances - charge une seule fois

  // Filtrer les unités par type (mémorisé pour performance)
  const filteredUnits = useMemo(() => {
    console.log('[useUnits] Filtering - unitType:', unitType, 'allUnits length:', allUnits.length);
    
    if (!unitType || allUnits.length === 0) {
      return allUnits;
    }

    // Si les unités sont des objets avec unit_type
    if (typeof allUnits[0] === 'object' && allUnits[0].unit_type !== undefined) {
      const filtered = allUnits.filter(u => u.unit_type === unitType);
      console.log('[useUnits] Filtered by type', unitType, ':', filtered);
      return filtered;
    }

    // Sinon retourner toutes (fallback)
    console.log('[useUnits] Fallback - returning all units');
    return allUnits;
  }, [allUnits, unitType]);

  // Formater pour les dropdowns
  const formattedUnits = useMemo(() => {
    const formatted = filteredUnits.map(unit => {
      if (typeof unit === 'string') {
        return { value: unit, label: unit };
      }
      return {
        value: unit.name,
        label: unit.name,
        unit_type: unit.unit_type,
        description: unit.description
      };
    });
    console.log('[useUnits] Formatted units:', formatted);
    return formatted;
  }, [filteredUnits]);

  // Grouper toutes les unités par type (pour affichage de toutes les catégories)
  const unitsByType = useMemo(() => {
    if (allUnits.length === 0 || typeof allUnits[0] !== 'object') {
      return {};
    }

    const grouped = {};
    allUnits.forEach(unit => {
      const type = unit.unit_type || 'Other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({
        value: unit.name,
        label: unit.name,
        description: unit.description
      });
    });

    return grouped;
  }, [allUnits]);

  return {
    units: formattedUnits,        // Unités filtrées et formatées
    loading,                       // État de chargement
    error,                         // Erreur éventuelle
    allUnits,                      // Toutes les unités brutes (pour usage avancé)
    unitsByType                    // Map complète groupée par type
  };
};

/**
 * Hook pour récupérer les types d'unités
 * @returns {Object} - { unitTypes, loading, error }
 */
export const useUnitTypes = () => {
  const [unitTypes, setUnitTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadUnitTypes = async () => {
      try {
        setLoading(true);
        const response = await referenceService.getValues('ref_unit_types');
        
        if (isMounted) {
          // Formatter pour dropdown
          const formatted = (response || []).map(type => {
            if (typeof type === 'string') {
              return { value: type, label: type };
            }
            return {
              value: type.name,
              label: type.name,
              description: type.description
            };
          });
          setUnitTypes(formatted);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useUnitTypes] Error loading unit types:', err);
          setError(err.message || 'Failed to load unit types');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUnitTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  return { unitTypes, loading, error };
};

export default useUnits;
