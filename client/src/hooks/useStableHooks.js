// Hook personnalisé pour debouncer les mises à jour et éviter les boucles infinies
import { useCallback, useRef } from 'react';

// Fonction utilitaire pour sérialiser en JSON sans références circulaires
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // Ignorer les propriétés React et DOM
    if (typeof value === 'object' && value !== null && (
      key.startsWith('__react') || 
      key.startsWith('_owner') ||
      value instanceof HTMLElement ||
      value instanceof Event
    )) {
      return '[DOM/React Object]';
    }
    return value;
  });
};

export const useStableCallback = (callback, delay = 100) => {
  const timeoutRef = useRef(null);
  const lastArgsRef = useRef(null);

  return useCallback((...args) => {
    // Éviter les appels avec les mêmes arguments (utiliser la sérialisation sécurisée)
    try {
      const argsStr = safeStringify(args);
      if (lastArgsRef.current === argsStr) {
        return;
      }
      lastArgsRef.current = argsStr;
    } catch (error) {
      // Si la sérialisation échoue, on continue quand même
      console.warn('Failed to serialize args for comparison:', error);
    }

    // Annuler l'appel précédent s'il existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Programmer le nouvel appel
    timeoutRef.current = setTimeout(() => {
      try {
        callback(...args);
      } catch (error) {
        console.error('Error in stable callback:', error);
      } finally {
        timeoutRef.current = null;
        lastArgsRef.current = null;
      }
    }, delay);
  }, [callback, delay]);
};

export const useDeepMemo = (value, deps = []) => {
  const prevValueRef = useRef();
  const prevDepsRef = useRef();

  // Comparer les dépendances
  const depsChanged = !prevDepsRef.current || 
    deps.length !== prevDepsRef.current.length ||
    deps.some((dep, index) => dep !== prevDepsRef.current[index]);

  if (depsChanged) {
    try {
      const valueStr = safeStringify(value);
      const prevValueStr = safeStringify(prevValueRef.current);
      
      if (valueStr !== prevValueStr) {
        prevValueRef.current = value;
      }
    } catch (error) {
      // Si la sérialisation échoue, on met à jour la valeur
      console.warn('Failed to serialize value for comparison:', error);
      prevValueRef.current = value;
    }
    prevDepsRef.current = deps;
  }

  return prevValueRef.current;
};

export default {
  useStableCallback,
  useDeepMemo
};
