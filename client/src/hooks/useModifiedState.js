import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook pour suivre si un état a été modifié par rapport à son état initial.
 * Ce hook attend que les données soient complètement chargées avant d'initialiser l'état de référence.
 * 
 * @param {Object} currentState - L'état actuel du formulaire
 * @param {boolean} isLoading - Indique si les données sont en cours de chargement
 * @param {boolean} isFetching - Indique si des données asynchrones sont en cours de récupération
 * @param {Function} [customCompare] - Fonction personnalisée de comparaison (optionnelle)
 * @returns {Object} - Fonctions et états pour gérer le suivi des modifications
 */
const useModifiedState = (currentState, isLoading, isFetching, customCompare = null) => {
  // État qui stocke si le formulaire a été modifié
  const [isModified, setIsModified] = useState(false);
  // État qui stocke l'état initial pour la comparaison
  const [initialState, setInitialState] = useState(null);
  // État qui indique si l'initialisation a été effectuée
  const [isInitialized, setIsInitialized] = useState(false);
  // Compteur pour les tentatives d'initialisation
  const initAttempts = useRef(0);
  // Timeout pour la stabilisation
  const stabilizationTimeout = useRef(null);  // Fonction pour normaliser les données avant comparaison
  const normalizeDataForComparison = useCallback((data) => {
    if (!data || typeof data !== 'object') return data;
    
    // Si c'est un objet avec une structure API (success, data), extraire les données réelles
    if (data.success !== undefined && data.data !== undefined) {
      return normalizeDataForComparison(data.data);
    }
    
    // Si c'est un objet avec un sous-modèle (ex: { Order: {...}, id: 1, ... })
    const modelKey = Object.keys(data).find(key => 
      typeof data[key] === 'object' && 
      data[key] !== null && 
      key === key.charAt(0).toUpperCase() + key.slice(1) && 
      !Array.isArray(data[key]) &&
      // S'assurer que c'est vraiment un modèle et non une propriété normale
      Object.keys(data[key]).length > 1
    );
    
    if (modelKey) {
      // Fusionner les propriétés du modèle avec les propriétés du niveau supérieur
      const modelData = data[modelKey];
      const otherData = { ...data };
      delete otherData[modelKey];
      
      // Créer un objet normalisé en privilégiant les données du modèle
      const normalized = {
        ...otherData,
        ...modelData
      };
      
      // Nettoyer les propriétés techniques
      return cleanTechnicalProperties(normalized);
    }
    
    return cleanTechnicalProperties(data);
  }, []);
  
  // Fonction pour nettoyer les propriétés techniques qui ne doivent pas être comparées
  const cleanTechnicalProperties = useCallback((data) => {
    if (!data || typeof data !== 'object') return data;
    
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Ignorer les propriétés techniques
      if (key.startsWith('_') || 
          key === 'id' || 
          key === 'createdAt' || 
          key === 'updatedAt' ||
          key === 'created_at' || 
          key === 'updated_at' ||
          key === 'modified_at' ||
          key === 'node_id') {
        continue;
      }
      
      // Traitement récursif pour les objets et tableaux
      if (Array.isArray(value)) {
        cleaned[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? cleanTechnicalProperties(item) 
            : item
        );
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = cleanTechnicalProperties(value);
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }, []);

  // Fonction pour comparer les objets de manière approfondie
  const deepCompare = useCallback((obj1, obj2) => {
    // Normaliser les données avant comparaison
    const normalized1 = normalizeDataForComparison(obj1);
    const normalized2 = normalizeDataForComparison(obj2);
    
    // Si les objets sont identiques (même référence), ils sont égaux
    if (normalized1 === normalized2) return true;
    
    // Si l'un des deux est null ou non-objet, comparer directement
    if (typeof normalized1 !== 'object' || typeof normalized2 !== 'object' || 
        normalized1 === null || normalized2 === null) {
      return normalized1 === normalized2;
    }    
    // Traitement spécial pour les options des listes Select de react-select
    // qui peuvent avoir une structure particulière avec value, label, etc.
    if (normalized1 && normalized2 && ((normalized1.value !== undefined || normalized2.value !== undefined) || 
                         (normalized1.name === 'status' || normalized2.name === 'status'))) {
      // Pour les objets d'option (comme ceux de react-select), comparer uniquement les valeurs
      // Cas spécial pour le champ "status" - assurer que la modification est détectée
      if (normalized1.name === 'status' || normalized2.name === 'status') {
        return normalized1.value === normalized2.value;
      }
      return normalized1.value === normalized2.value;
    }
    
    // Pour les tableaux
    if (Array.isArray(normalized1) && Array.isArray(normalized2)) {
      if (normalized1.length !== normalized2.length) return false;
      
      // Cas spécial: tableaux vides ou tableaux d'objets simples
      if (normalized1.length === 0 && normalized2.length === 0) return true;
      
      // Traitement pour les tableaux d'éléments primitifs
      const isPrimitive = (val) => val === null || 
                                  typeof val !== 'object' || 
                                  (typeof val === 'object' && val.value !== undefined);
                                  
      if (normalized1.every(isPrimitive) && normalized2.every(isPrimitive)) {
        // Trier les tableaux de primitives pour une comparaison indépendante de l'ordre
        const sorted1 = [...normalized1].sort((a, b) => {
          const aVal = a === null ? '' : (a.value !== undefined ? a.value : a);
          const bVal = b === null ? '' : (b.value !== undefined ? b.value : b);
          return String(aVal).localeCompare(String(bVal));
        });
        
        const sorted2 = [...normalized2].sort((a, b) => {
          const aVal = a === null ? '' : (a.value !== undefined ? a.value : a);
          const bVal = b === null ? '' : (b.value !== undefined ? b.value : b);
          return String(aVal).localeCompare(String(bVal));
        });
        
        // Comparer les éléments un par un
        for (let i = 0; i < sorted1.length; i++) {
          const item1 = sorted1[i];
          const item2 = sorted2[i];
          
          if (item1 === null && item2 === null) continue;
          if (item1 === null || item2 === null) return false;
          
          if (typeof item1 === 'object' && typeof item2 === 'object') {
            if (item1.value !== item2.value) return false;
          } else if (item1 !== item2) {
            return false;
          }
        }
        
        return true;
      }
        // Pour les objets complexes, utiliser les identifiants pour la correspondance
      for (let i = 0; i < normalized1.length; i++) {
        const item1 = normalized1[i];
        if (typeof item1 !== 'object' || item1 === null) {
          // Pour les éléments non-objets, vérifier l'équivalence directe
          if (normalized2.indexOf(item1) === -1) return false;
          continue;
        }
        
        // Pour les objets, chercher un équivalent dans l'autre tableau
        const item1Id = item1.id || item1._id;
        if (item1Id) {
          // Si l'objet a un ID, chercher un objet avec le même ID
          const matchingItem = normalized2.find(i => i.id === item1Id || i._id === item1Id);
          if (!matchingItem) return false;
          if (!deepCompare(item1, matchingItem)) return false;
        } else {
          // Sans ID, comparer avec chaque élément (moins efficace)
          let found = false;
          for (const item2 of normalized2) {
            if (deepCompare(item1, item2)) {
              found = true;
              break;
            }
          }
          if (!found) return false;
        }
      }
      
      return true;
    }
      // Pour les objets standards
    const keys1 = Object.keys(normalized1);
    const keys2 = Object.keys(normalized2);
    
    // Filtrer les clés techniques déjà nettoyées dans la normalisation
    const getFilteredKeys = (keys) => {
      return keys.filter(key => !key.startsWith('_') && 
                               key !== 'id' && 
                               key !== 'createdAt' && 
                               key !== 'updatedAt' &&
                               key !== 'created_at' &&
                               key !== 'updated_at' &&
                               key !== 'modified_at' &&
                               key !== 'node_id');
    };
    
    const filteredKeys1 = getFilteredKeys(keys1);
    const filteredKeys2 = getFilteredKeys(keys2);
    
    if (filteredKeys1.length !== filteredKeys2.length) return false;
      // Vérifier chaque propriété (hors propriétés techniques)
    for (const key of filteredKeys1) {
      if (!keys2.includes(key)) return false;
      
      // Vérification récursive pour les objets et tableaux
      if (!deepCompare(normalized1[key], normalized2[key])) return false;
    }
    
    return true;
  }, [normalizeDataForComparison]);  // Fonction pour vérifier si l'état actuel est différent de l'état initial
  const checkIfModified = useCallback(() => {
    if (!initialState || !currentState) return false;
    
    // Utiliser la fonction de comparaison personnalisée si fournie
    if (customCompare) {
      return customCompare(initialState, currentState);
    }
    
    // Normaliser les deux états avant comparaison
    const normalizedInitial = normalizeDataForComparison(initialState);
    const normalizedCurrent = normalizeDataForComparison(currentState);
    
    // Utiliser la comparaison profonde avec les données normalisées
    const result = !deepCompare(normalizedInitial, normalizedCurrent);
    
    // Journaliser les modifications pour le débogage si nécessaire
    if (result) {
      console.debug('État modifié détecté dans useModifiedState', { 
        normalizedInitial, 
        normalizedCurrent,
        originalInitialState: initialState,
        originalCurrentState: currentState
      });
    }
    
    return result;
  }, [initialState, currentState, deepCompare, customCompare, normalizeDataForComparison]);

  // Méthode pour définir explicitement l'état comme modifié
  const setModified = useCallback((modified = true) => {
    setIsModified(modified);
  }, []);  // Méthode pour réinitialiser l'état initial avec l'état actuel
  const resetInitialState = useCallback(() => {
    if (currentState) {
      // Normaliser les données avant de les stocker comme état initial
      const normalizedState = normalizeDataForComparison(currentState);
      
      // Créer une copie profonde pour éviter les références partagées
      try {
        const cleanState = JSON.parse(JSON.stringify(normalizedState));
        setInitialState(cleanState);
        setIsModified(false);
        console.debug('État initial réinitialisé dans useModifiedState avec données normalisées', cleanState);
      } catch (error) {
        // En cas d'erreur lors de la sérialisation (par ex. circular references),
        // utiliser une copie simple
        console.warn("Error creating deep copy for initialState. Using shallow copy.", error);
        setInitialState({...normalizedState});
        setIsModified(false);
      }
    }
  }, [currentState, normalizeDataForComparison]);

  // Initialiser l'état initial une fois que les données sont stables
  useEffect(() => {
    // Nettoyer le timeout précédent si existant
    if (stabilizationTimeout.current) {
      clearTimeout(stabilizationTimeout.current);
      stabilizationTimeout.current = null;
    }

    // Si les données sont encore en chargement, ne rien faire
    if (isLoading || isFetching) {
      return;
    }

    // Si nous avons déjà initialisé ou si currentState est null, ne rien faire
    if (isInitialized || !currentState) {
      return;
    }    // Attendre que les données soient stables (ne changent plus pendant un court délai)
    stabilizationTimeout.current = setTimeout(() => {
      initAttempts.current += 1;
      
      // Normaliser les données avant de les stocker comme état initial
      const normalizedState = normalizeDataForComparison(currentState);
      
      // Création d'une copie profonde pour éviter les références partagées
      try {
        const cleanState = JSON.parse(JSON.stringify(normalizedState));
        setInitialState(cleanState);
        setIsInitialized(true);
        setIsModified(false);
        
        // Réinitialiser le compteur de tentatives
        initAttempts.current = 0;
        
        console.debug('État initial défini dans useModifiedState avec données normalisées', cleanState);
      } catch (error) {
        console.warn("Error creating deep copy during initialization. Using shallow copy.", error);
        try {
          // Essayons de créer une copie simple mais plus sécurisée
          const shallowCleanState = {};
          for (const key in normalizedState) {
            if (typeof normalizedState[key] !== 'function' && key !== '_reactInternals' && !key.startsWith('__')) {
              shallowCleanState[key] = normalizedState[key];
            }
          }
          setInitialState(shallowCleanState);
        } catch (fallbackError) {
          console.error("Fallback copy also failed. Using direct reference.", fallbackError);
          setInitialState(normalizedState);
        }
        setIsInitialized(true);
        setIsModified(false);
      }
    }, 500); // Un délai de 500ms pour la stabilisation

    // Nettoyage à la désactivation du composant
    return () => {
      if (stabilizationTimeout.current) {
        clearTimeout(stabilizationTimeout.current);
      }
    };
  }, [isLoading, isFetching, currentState, isInitialized, normalizeDataForComparison]);

  // Mettre à jour l'état de modification chaque fois que l'état actuel change
  useEffect(() => {
    if (isInitialized && !isLoading && !isFetching) {
      // Vérifier après un petit délai pour éviter les problèmes de timing
      const checkTimeout = setTimeout(() => {
        const wasModified = isModified;
        const nowModified = checkIfModified();
        
        console.log('🟡 useModifiedState check:', {
          isInitialized,
          isLoading,
          isFetching,
          wasModified,
          nowModified,
          currentState: Object.keys(currentState || {}),
          initialState: Object.keys(initialState || {})
        });
        
        setIsModified(nowModified);
        
        if (wasModified !== nowModified) {
          console.log('🟡 Modification state changed from', wasModified, 'to', nowModified);
        }
      }, 100);
      
      return () => clearTimeout(checkTimeout);
    }
  }, [currentState, checkIfModified, isInitialized, isLoading, isFetching, isModified, initialState]);

  return {
    isModified,
    setModified,
    resetInitialState,
    initialState,
    isInitialized  // Exposer isInitialized pour aider au debugging
  };
};

export default useModifiedState;