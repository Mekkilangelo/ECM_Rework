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
  const stabilizationTimeout = useRef(null);

  // Fonction pour comparer les objets de manière approfondie
  const deepCompare = useCallback((obj1, obj2) => {
    // Si les objets sont identiques (même référence), ils sont égaux
    if (obj1 === obj2) return true;
    
    // Si l'un des deux est null ou non-objet, comparer directement
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }
    
    // Traitement spécial pour les options des listes Select de react-select
    // qui peuvent avoir une structure particulière avec value, label, etc.
    if (obj1 && obj2 && ((obj1.value !== undefined || obj2.value !== undefined) || 
                         (obj1.name === 'status' || obj2.name === 'status'))) {
      // Pour les objets d'option (comme ceux de react-select), comparer uniquement les valeurs
      // Cas spécial pour le champ "status" - assurer que la modification est détectée
      if (obj1.name === 'status' || obj2.name === 'status') {
        return obj1.value === obj2.value;
      }
      return obj1.value === obj2.value;
    }
    
    // Pour les tableaux
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      
      // Cas spécial: tableaux vides ou tableaux d'objets simples
      if (obj1.length === 0 && obj2.length === 0) return true;
      
      // Traitement pour les tableaux d'éléments primitifs
      const isPrimitive = (val) => val === null || 
                                  typeof val !== 'object' || 
                                  (typeof val === 'object' && val.value !== undefined);
                                  
      if (obj1.every(isPrimitive) && obj2.every(isPrimitive)) {
        // Trier les tableaux de primitives pour une comparaison indépendante de l'ordre
        const sorted1 = [...obj1].sort((a, b) => {
          const aVal = a === null ? '' : (a.value !== undefined ? a.value : a);
          const bVal = b === null ? '' : (b.value !== undefined ? b.value : b);
          return String(aVal).localeCompare(String(bVal));
        });
        
        const sorted2 = [...obj2].sort((a, b) => {
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
      
      // Pour les tableaux d'objets complexes, vérifier chaque élément
      for (let i = 0; i < obj1.length; i++) {
        // Trouver une correspondance avec un objet dans l'autre tableau
        // en cherchant des identifiants uniques (id, _id, etc.)
        const item1 = obj1[i];
        if (typeof item1 !== 'object' || item1 === null) {
          // Pour les éléments non-objets, vérifier l'équivalence directe
          if (obj2.indexOf(item1) === -1) return false;
          continue;
        }
        
        // Pour les objets, chercher un équivalent dans l'autre tableau
        const item1Id = item1.id || item1._id;
        if (item1Id) {
          // Si l'objet a un ID, chercher un objet avec le même ID
          const matchingItem = obj2.find(i => (i.id === item1Id || i._id === item1Id));
          if (!matchingItem || !deepCompare(item1, matchingItem)) return false;
        } else {
          // Sans ID, comparer avec chaque élément (moins efficace)
          let found = false;
          for (const item2 of obj2) {
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
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    // Si le nombre de propriétés diffère (en excluant les propriétés techniques)
    const getFilteredKeys = (keys) => {
      return keys.filter(key => !key.startsWith('_') && 
                               key !== 'id' && 
                               key !== 'createdAt' && 
                               key !== 'updatedAt');
    };
    
    const filteredKeys1 = getFilteredKeys(keys1);
    const filteredKeys2 = getFilteredKeys(keys2);
    
    if (filteredKeys1.length !== filteredKeys2.length) return false;
    
    // Vérifier chaque propriété (hors propriétés techniques)
    for (const key of filteredKeys1) {
      // Ignorer certains champs techniques qui peuvent changer sans intervention utilisateur
      if (key.startsWith('_') || key === 'id' || key === 'createdAt' || key === 'updatedAt') continue;
      
      if (!keys2.includes(key)) return false;
      
      // Vérification récursive pour les objets et tableaux
      if (!deepCompare(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }, []);

  // Fonction pour vérifier si l'état actuel est différent de l'état initial
  const checkIfModified = useCallback(() => {
    if (!initialState || !currentState) return false;
    
    // Utiliser la fonction de comparaison personnalisée si fournie
    if (customCompare) {
      return customCompare(initialState, currentState);
    }
    
    // Sinon utiliser la comparaison profonde par défaut
    return !deepCompare(initialState, currentState);
  }, [initialState, currentState, deepCompare, customCompare]);

  // Méthode pour définir explicitement l'état comme modifié
  const setModified = useCallback((modified = true) => {
    setIsModified(modified);
  }, []);

  // Méthode pour réinitialiser l'état initial avec l'état actuel
  const resetInitialState = useCallback(() => {
    if (currentState) {
      // Créer une copie profonde pour éviter les références partagées
      try {
        const cleanState = JSON.parse(JSON.stringify(currentState));
        setInitialState(cleanState);
        setIsModified(false);
      } catch (error) {
        // En cas d'erreur lors de la sérialisation (par ex. circular references),
        // utiliser une copie simple
        console.warn("Error creating deep copy for initialState. Using shallow copy.", error);
        setInitialState({...currentState});
        setIsModified(false);
      }
    }
  }, [currentState]);

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
    }

    // Attendre que les données soient stables (ne changent plus pendant un court délai)
    stabilizationTimeout.current = setTimeout(() => {
      initAttempts.current += 1;
      
      // Création d'une copie profonde pour éviter les références partagées
      try {
        const cleanState = JSON.parse(JSON.stringify(currentState));
        setInitialState(cleanState);
        setIsInitialized(true);
        setIsModified(false);
        
        // Réinitialiser le compteur de tentatives
        initAttempts.current = 0;
      } catch (error) {
        console.warn("Error creating deep copy during initialization. Using shallow copy.", error);
        setInitialState({...currentState});
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
  }, [isLoading, isFetching, currentState, isInitialized]);

  // Mettre à jour l'état de modification chaque fois que l'état actuel change
  useEffect(() => {
    if (isInitialized && !isLoading && !isFetching) {
      // Vérifier après un petit délai pour éviter les problèmes de timing
      const checkTimeout = setTimeout(() => {
        setIsModified(checkIfModified());
      }, 100);
      
      return () => clearTimeout(checkTimeout);
    }
  }, [currentState, checkIfModified, isInitialized, isLoading, isFetching]);

  return {
    isModified,
    setModified,
    resetInitialState,
    initialState,
    isInitialized  // Exposer isInitialized pour aider au debugging
  };
};

export default useModifiedState;