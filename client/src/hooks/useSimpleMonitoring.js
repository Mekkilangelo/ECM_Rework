// Version simplifiée du monitoring des performances pour éviter les boucles
import { useEffect, useRef } from 'react';

export const useSimpleRenderTracker = (componentName) => {
  const renderCountRef = useRef(0);
  const lastLogTimeRef = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCountRef.current += 1;
      const now = Date.now();
      
      // Log seulement toutes les 5 secondes pour éviter le spam
      if (now - lastLogTimeRef.current > 5000) {
        if (renderCountRef.current > 10) {
          console.warn(`🔄 ${componentName} has rendered ${renderCountRef.current} times`);
        }
        lastLogTimeRef.current = now;
      }
    }
  });
};

export const useCircularRefDetector = (data, maxDepth = 5) => {
  const detectCircular = (obj, visited = new WeakSet(), depth = 0) => {
    if (depth > maxDepth) return false;
    if (!obj || typeof obj !== 'object') return false;
    if (visited.has(obj)) return true;
    
    visited.add(obj);
    
    try {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            if (detectCircular(value, visited, depth + 1)) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error detecting circular references:', error);
      return true; // Assume circular if we can't check
    }
    
    return false;
  };

  return detectCircular(data);
};
