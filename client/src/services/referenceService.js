/**
 * Service pour gérer les tables de référence (ref_*)
 * Remplace le système d'ENUM par des tables de référence normalisées
 * 
 * SYSTÈME DE CACHE INTELLIGENT :
 * - Cache avec durée de vie pour les lectures (performance)
 * - Invalidation immédiate après ajout/suppression (fraîcheur des données)
 * - Event emitter pour notifier les composants des changements
 */
import api from './api';
import performanceMonitor from '../utils/performanceMonitor';

const API_URL = '/references';

// Cache pour les références avec timestamp
const referenceCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const pendingRequests = new Map();

// Event listeners pour les changements de données
const cacheListeners = new Map(); // Map<tableName, Set<callback>>

/**
 * Récupère la liste de toutes les tables de référence disponibles
 * @returns {Promise<Array<string>>} Liste des noms de tables
 * @throws {Error} En cas d'échec de la requête
 */
const getAllTables = async () => {
  try {
    const response = await api.get(`${API_URL}`);
    
    if (response.data && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error('[ReferenceService] Error fetching all tables:', error.message);
    throw error;
  }
};

/**
 * Récupère toutes les valeurs d'une table de référence
 * @param {string} tableName - Nom de la table de référence
 * @returns {Promise<Array<string>>} Valeurs de la table
 * @throws {Error} En cas d'échec de la requête
 */
const getValues = async (tableName) => {
  try {
    // Clé de cache
    const cacheKey = tableName;
    const cached = referenceCache.get(cacheKey);
    
    // Tracker l'appel API pour détecter les duplicatas
    performanceMonitor.trackApiCall(`reference-${cacheKey}`, cacheKey);
    
    // Vérifier si les données en cache sont encore valides
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    // Vérifier si une requête similaire est déjà en cours (debouncing)
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }
    
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      
    }
    
    const url = `${API_URL}/${tableName}`;
    
    // Créer la promesse de requête
    const requestPromise = api.get(url)
      .then(response => {
        let data;
        
        // Traitement de la réponse selon le nouveau format d'API
        if (response.data && response.data.success === true && response.data.data) {
          // Format: { success: true, data: { tableName, values: [...] } }
          data = response.data.data.values || [];
        } else if (response.data && Array.isArray(response.data)) {
          // Format direct: [...]
          data = response.data;
        } else {
          data = [];
        }
        
        // Mettre en cache le résultat
        referenceCache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        return data;
      })
      .catch(error => {
        console.error(`[ReferenceService] Error fetching ${tableName}:`, error.message);
        throw error;
      })
      .finally(() => {
        // Nettoyer la requête en cours
        pendingRequests.delete(cacheKey);
      });
    
    // Mettre la requête en cache temporairement
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  } catch (error) {
    console.error(`[ReferenceService] Error fetching ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Ajoute une nouvelle valeur à une table de référence
 * INVALIDATION IMMÉDIATE : Le cache est vidé pour forcer le rechargement
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à ajouter
 * @param {Object} additionalData - Données additionnelles (ex: { unit_type: 'length' } pour ref_units)
 * @returns {Promise<Object>} Résultat de l'opération
 * @throws {Error} En cas d'échec de la requête
 */
const addValue = async (tableName, value, additionalData = {}) => {
  try {
    const payload = { value, ...additionalData };
    const response = await api.post(`${API_URL}/${tableName}`, payload);
    
    // INVALIDATION IMMÉDIATE du cache après ajout
    referenceCache.delete(tableName);
    
    // Notifier tous les listeners que les données ont changé
    notifyCacheListeners(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    // Retourner l'objet complet avec success pour compatibilité avec useFormHandlers
    if (response.data && response.data.success === true) {
      return response.data; // Retourner l'objet complet avec success et data
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error adding value to ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Supprime une valeur d'une table de référence
 * INVALIDATION IMMÉDIATE : Le cache est vidé pour forcer le rechargement
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à supprimer
 * @returns {Promise<Object>} Résultat de l'opération
 * @throws {Error} En cas d'échec de la requête
 */
const deleteValue = async (tableName, value) => {
  try {
    const response = await api.delete(`${API_URL}/${tableName}/${encodeURIComponent(value)}`);
    
    // INVALIDATION IMMÉDIATE du cache après suppression
    referenceCache.delete(tableName);
    
    // Notifier tous les listeners que les données ont changé
    notifyCacheListeners(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    // Traitement de la réponse selon le nouveau format d'API
    if (response.data && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error deleting value from ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Supprime une valeur en forçant (met les références à NULL)
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à supprimer
 * @returns {Promise<Object>} Résultat de l'opération
 */
const forceDelete = async (tableName, value) => {
  try {
    const response = await api.delete(`${API_URL}/${tableName}/${encodeURIComponent(value)}/force`);
    
    // INVALIDATION IMMÉDIATE du cache après suppression
    referenceCache.delete(tableName);
    
    // Notifier tous les listeners que les données ont changé
    notifyCacheListeners(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    // Traitement de la réponse selon le nouveau format d'API
    if (response.data && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error force deleting value from ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Vérifie si une valeur de référence est utilisée dans la base de données
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à vérifier
 * @returns {Promise<Object>} Informations sur l'utilisation de la valeur
 * @throws {Error} En cas d'échec de la requête
 */
const checkUsage = async (tableName, value) => {
  try {
    const response = await api.get(`${API_URL}/${tableName}/${encodeURIComponent(value)}/usage`);
    
    // Traitement de la réponse selon le nouveau format d'API
    if (response.data && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error checking usage for ${tableName}/${value}:`, error.message);
    throw error;
  }
};

/**
 * Remplace toutes les occurrences d'une valeur de référence par une autre avant de la supprimer
 * @param {string} tableName - Nom de la table de référence
 * @param {string} oldValue - Valeur à remplacer
 * @param {string} newValue - Nouvelle valeur de remplacement
 * @returns {Promise<Object>} Résultat de l'opération
 * @throws {Error} En cas d'échec de la requête
 */
const replaceValue = async (tableName, oldValue, newValue) => {
  try {
    const response = await api.put(`${API_URL}/${tableName}/${encodeURIComponent(oldValue)}/replace`, {
      newValue: newValue
    });
    
    // INVALIDATION IMMÉDIATE du cache après remplacement
    referenceCache.delete(tableName);
    
    // Notifier tous les listeners que les données ont changé
    notifyCacheListeners(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    // Traitement de la réponse selon le nouveau format d'API
    if (response.data && response.data.success === true) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error replacing value in ${tableName}:`, error.message);
    throw error;
  }
};

/**
 * Vide le cache des références
 */
const clearCache = () => {
  referenceCache.clear();
  pendingRequests.clear();
  if (process.env.NODE_ENV === 'development') {
    
  }
};

/**
 * Nettoie le cache en supprimant les entrées expirées
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  let removedCount = 0;
  
  for (const [key, value] of referenceCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      referenceCache.delete(key);
      removedCount++;
    }
  }
  
  if (process.env.NODE_ENV === 'development' && removedCount > 0) {
    
  }
  
  return removedCount;
};

/**
 * S'abonner aux changements d'une table de référence
 * Permet aux composants d'être notifiés immédiatement après un ajout/suppression
 * @param {string} tableName - Nom de la table à surveiller
 * @param {Function} callback - Fonction appelée lors d'un changement
 * @returns {Function} Fonction de désabonnement
 */
const subscribe = (tableName, callback) => {
  if (!cacheListeners.has(tableName)) {
    cacheListeners.set(tableName, new Set());
  }
  
  cacheListeners.get(tableName).add(callback);
  
  // Retourner la fonction de nettoyage
  return () => {
    const listeners = cacheListeners.get(tableName);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        cacheListeners.delete(tableName);
      }
    }
  };
};

/**
 * Notifier tous les listeners qu'une table a changé
 * @param {string} tableName - Nom de la table modifiée
 */
const notifyCacheListeners = (tableName) => {
  const listeners = cacheListeners.get(tableName);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[ReferenceService] Error in cache listener:', error);
      }
    });
  }
};

// ===== FONCTIONS DE COMPATIBILITÉ (appelant getValues en interne) =====



// ===== FONCTIONS DE COMPATIBILITÉ (appelant getValues en interne) =====

/**
 * Récupérer les valeurs d'une table de référence générique
 * @param {string} tableName - Nom de la table de référence (ex: 'ref_country')
 * @returns {Promise<Array>} - Tableau d'options au format {value, label}
 */
const getReferenceValues = async (tableName) => {
  const values = await getValues(tableName);
  return values.map(v => ({ value: v, label: v }));
};

/**
 * Récupérer tous les pays depuis ref_country
 * @returns {Promise<Array>} - Liste des pays au format {value, label}
 */
const getCountries = async () => getReferenceValues('ref_country');

/**
 * Récupérer tous les statuts depuis ref_status
 * @returns {Promise<Array>} - Liste des statuts au format {value, label}
 */
const getStatuses = async () => getReferenceValues('ref_status');

/**
 * Récupérer tous les types de localisation depuis ref_location
 * @returns {Promise<Array>} - Liste des localisations au format {value, label}
 */
const getLocations = async () => getReferenceValues('ref_location');

/**
 * Récupérer tous les types de montage depuis ref_mounting_type
 * @returns {Promise<Array>} - Liste des types de montage au format {value, label}
 */
const getMountingTypes = async () => getReferenceValues('ref_mounting_type');

/**
 * Récupérer tous les types de position depuis ref_position_type
 * @returns {Promise<Array>} - Liste des types de position au format {value, label}
 */
const getPositionTypes = async () => getReferenceValues('ref_position_type');

/**
 * Récupérer tous les types de processus depuis ref_process_type
 * @returns {Promise<Array>} - Liste des types de processus au format {value, label}
 */
const getProcessTypes = async () => getReferenceValues('ref_process_type');

/**
 * Récupérer toutes les désignations depuis ref_designation
 * @returns {Promise<Array>} - Liste des désignations au format {value, label}
 */
const getDesignations = async () => getReferenceValues('ref_designation');

/**
 * Récupérer tous les types de four depuis ref_furnace_types
 * @returns {Promise<Array>} - Liste des types de four au format {value, label}
 */
const getFurnaceTypes = async () => getReferenceValues('ref_furnace_types');

/**
 * Récupérer toutes les cellules de chauffage depuis ref_heating_cells
 * @returns {Promise<Array>} - Liste des cellules de chauffage au format {value, label}
 */
const getHeatingCells = async () => getReferenceValues('ref_heating_cells');

/**
 * Récupérer tous les médias de refroidissement depuis ref_cooling_media
 * @returns {Promise<Array>} - Liste des médias de refroidissement au format {value, label}
 */
const getCoolingMedia = async () => getReferenceValues('ref_cooling_media');

/**
 * Récupérer toutes les tailles de four depuis ref_furnace_sizes
 * @returns {Promise<Array>} - Liste des tailles de four au format {value, label}
 */
const getFurnaceSizes = async () => getReferenceValues('ref_furnace_sizes');

/**
 * Récupérer toutes les cellules de trempe depuis ref_quench_cells
 * @returns {Promise<Array>} - Liste des cellules de trempe au format {value, label}
 */
const getQuenchCells = async () => getReferenceValues('ref_quench_cells');

/**
 * Récupérer toutes les familles d'acier depuis ref_steel_family
 * @returns {Promise<Array>} - Liste des familles d'acier au format {value, label}
 */
const getSteelFamilies = async () => getReferenceValues('ref_steel_family');

/**
 * Récupérer tous les standards d'acier depuis ref_steel_standard
 * @returns {Promise<Array>} - Liste des standards d'acier au format {value, label}
 */
const getSteelStandards = async () => getReferenceValues('ref_steel_standard');

/**
 * Récupérer tous les éléments d'acier depuis ref_steel_elements
 * @returns {Promise<Array>} - Liste des éléments d'acier au format {value, label}
 */
const getSteelElements = async () => getReferenceValues('ref_steel_elements');

/**
 * Récupérer toutes les unités depuis ref_units avec leur type
 * OPTIMISÉ : Retourne les objets complets avec unit_type pour le filtrage
 * @returns {Promise<Array>} - Liste des unités au format {value, label, unit_type, description}
 */
const getUnits = async () => {
  try {
    // Utiliser getValues qui retourne les objets complets pour ref_units
    const unitsData = await getValues('ref_units');
    
    // Si c'est déjà un tableau d'objets, formatter pour les dropdowns
    if (Array.isArray(unitsData) && unitsData.length > 0) {
      if (typeof unitsData[0] === 'object' && unitsData[0].name) {
        return unitsData.map(unit => ({
          value: unit.name,
          label: unit.name,
          unit_type: unit.unit_type,
          description: unit.description
        }));
      }
    }
    
    // Fallback : si ce sont des strings simples
    return unitsData.map(u => ({
      value: typeof u === 'string' ? u : u.name,
      label: typeof u === 'string' ? u : u.name,
      unit_type: null
    }));
  } catch (error) {
    console.error('[ReferenceService] Error fetching units:', error);
    throw error;
  }
};

/**
 * Récupérer les unités filtrées par type
 * OPTIMISÉ : Charge toutes les unités UNE SEULE FOIS et les filtre côté client
 * @param {string} unitType - Type d'unité (ex: 'Length', 'Weight', 'Temperature', 'Hardness', 'Time', 'Pressure')
 * @returns {Promise<Array>} - Liste des unités filtrées au format {value, label, unit_type}
 */
const getUnitsByType = async (unitType) => {
  try {
    // Récupération avec cache - une seule requête HTTP pour toutes les unités
    const response = await api.get(`${API_URL}/ref_units`);
    
    let allUnits = [];
    if (response.data && response.data.success === true && response.data.data) {
      allUnits = response.data.data.values || [];
    } else if (response.data && Array.isArray(response.data)) {
      allUnits = response.data;
    }
    
    // Filtrage côté client - instantané, pas de latence réseau
    if (!unitType) {
      return allUnits.map(u => ({
        value: typeof u === 'string' ? u : u.name,
        label: typeof u === 'string' ? u : u.name,
        unit_type: typeof u === 'object' ? u.unit_type : null
      }));
    }
    
    // Si les unités sont des objets avec unit_type
    if (allUnits.length > 0 && typeof allUnits[0] === 'object') {
      return allUnits
        .filter(u => u.unit_type === unitType)
        .map(u => ({
          value: u.name,
          label: u.name,
          unit_type: u.unit_type
        }));
    }
    
    // Sinon, retourner toutes les unités (fallback)
    return allUnits.map(u => ({ value: u, label: u }));
    
  } catch (error) {
    console.error(`[ReferenceService] Error fetching units by type ${unitType}:`, error.message);
    throw error;
  }
};

/**
 * Récupérer tous les types d'unités depuis ref_unit_types
 * @returns {Promise<Array>} - Liste des types d'unités au format {value, label}
 */
const getUnitTypes = async () => getReferenceValues('ref_unit_types');

/**
 * Récupérer la map complète des unités groupées par type
 * ULTRA OPTIMISÉ : Une seule requête pour construire une structure complète
 * @returns {Promise<Object>} - Objet { 'Length': [...], 'Weight': [...], etc. }
 */
const getUnitsMap = async () => {
  try {
    const response = await api.get(`${API_URL}/ref_units`);
    
    let allUnits = [];
    if (response.data && response.data.success === true && response.data.data) {
      allUnits = response.data.data.values || [];
    } else if (response.data && Array.isArray(response.data)) {
      allUnits = response.data;
    }
    
    // Grouper par type
    const unitsMap = {};
    
    if (allUnits.length > 0 && typeof allUnits[0] === 'object') {
      allUnits.forEach(unit => {
        const type = unit.unit_type || 'Other';
        if (!unitsMap[type]) {
          unitsMap[type] = [];
        }
        unitsMap[type].push({
          value: unit.name,
          label: unit.name,
          description: unit.description
        });
      });
    }
    
    return unitsMap;
    
  } catch (error) {
    console.error('[ReferenceService] Error fetching units map:', error.message);
    throw error;
  }
};

/**
 * Met à jour une valeur de référence et toutes ses utilisations
 * @param {string} tableName - Nom de la table de référence
 * @param {string} oldValue - Ancienne valeur
 * @param {string} newValue - Nouvelle valeur
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const updateValue = async (tableName, oldValue, newValue) => {
  try {
    const response = await api.put(`${API_URL}/${tableName}`, {
      oldValue,
      newValue
    });
    
    // Invalider le cache et notifier les listeners
    referenceCache.delete(tableName);
    notifyCacheListeners(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    if (response.data && response.data.success === true) {
      return response.data;
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error updating value in ${tableName}:`, error);
    throw error;
  }
};

/**
 * Remplace une valeur par une autre puis supprime l'ancienne
 * @param {string} tableName - Nom de la table de référence
 * @param {string} oldValue - Valeur à supprimer
 * @param {string} replacementValue - Valeur de remplacement
 * @returns {Promise<Object>} - Résultat de l'opération
 */
const replaceAndDelete = async (tableName, oldValue, replacementValue) => {
  try {
    const response = await api.post(`${API_URL}/${tableName}/replace`, {
      oldValue,
      replacementValue
    });
    
    // Invalider le cache et notifier les listeners
    referenceCache.delete(tableName);
    notifyCacheListeners(tableName);
    
    if (process.env.NODE_ENV === 'development') {
      
    }
    
    if (response.data && response.data.success === true) {
      return response.data;
    }
    return response.data;
  } catch (error) {
    console.error(`[ReferenceService] Error replacing value in ${tableName}:`, error);
    throw error;
  }
};

export default {
  // API principale
  getAllTables,
  getValues,
  addValue,
  deleteValue,
  forceDelete,
  checkUsage,
  updateValue,
  replaceValue,
  replaceAndDelete,
  clearCache,
  cleanExpiredCache,
  subscribe,              // NOUVEAU : S'abonner aux changements
  
  // Fonctions de compatibilité
  getReferenceValues,
  getCountries,
  getStatuses,
  getLocations,
  getMountingTypes,
  getPositionTypes,
  getProcessTypes,
  getDesignations,
  getFurnaceTypes,
  getHeatingCells,
  getCoolingMedia,
  getFurnaceSizes,
  getQuenchCells,
  getSteelFamilies,
  getSteelStandards,
  getSteelElements,
  getUnits,
  getUnitsByType,      // NOUVEAU : Filtrage optimisé par type
  getUnitTypes,        // NOUVEAU : Liste des types d'unités
  getUnitsMap          // NOUVEAU : Map complète pour maximum de performance
};

