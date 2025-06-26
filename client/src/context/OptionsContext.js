// Context pour partager les options entre les composants et éviter les duplications
import React, { createContext, useContext, useReducer, useMemo } from 'react';

// Actions pour le reducer
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_OPTIONS: 'SET_OPTIONS',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// État initial
const initialState = {
  loading: false,
  options: {
    // Options basiques
    location: [],
    status: [],
    mountingType: [],
    positionType: [],
    processType: [],
    preoxMedia: [],
    
    // Options des fours
    furnaceType: [],
    heatingCell: [],
    coolingMedia: [],
    furnaceSize: [],
    quenchCell: [],
    
    // Unités
    units: [],
    
    // Clients et aciers (chargés à la demande)
    countries: [],
    steelFamilies: [],
    steelGrades: [],
    
    // Métadonnées de cache
    lastFetch: {},
    fetchCounter: 0
  },
  errors: {}
};

// Reducer pour gérer l'état des options
function optionsReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ACTIONS.SET_OPTIONS:
      return {
        ...state,
        options: {
          ...state.options,
          [action.payload.type]: action.payload.data,
          lastFetch: {
            ...state.options.lastFetch,
            [action.payload.type]: Date.now()
          },
          fetchCounter: state.options.fetchCounter + 1
        },
        loading: false
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.type]: action.payload.error
        },
        loading: false
      };
    
    case ACTIONS.CLEAR_ERROR:
      const newErrors = { ...state.errors };
      delete newErrors[action.payload.type];
      return {
        ...state,
        errors: newErrors
      };
    
    default:
      return state;
  }
}

// Context
const OptionsContext = createContext();

// Provider component
export const OptionsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(optionsReducer, initialState);
  
  // Cache timeout en millisecondes (5 minutes)
  const CACHE_TIMEOUT = 5 * 60 * 1000;
  
  // Fonction pour vérifier si les données en cache sont encore valides
  const isCacheValid = (optionType) => {
    const lastFetch = state.options.lastFetch[optionType];
    return lastFetch && (Date.now() - lastFetch) < CACHE_TIMEOUT;
  };
  
  // Actions memoizées
  const actions = useMemo(() => ({
    setLoading: (loading) => dispatch({ type: ACTIONS.SET_LOADING, payload: loading }),
    
    setOptions: (type, data) => dispatch({ 
      type: ACTIONS.SET_OPTIONS, 
      payload: { type, data } 
    }),
    
    setError: (type, error) => dispatch({ 
      type: ACTIONS.SET_ERROR, 
      payload: { type, error } 
    }),
    
    clearError: (type) => dispatch({ 
      type: ACTIONS.CLEAR_ERROR, 
      payload: { type } 
    }),
    
    // Fonction utilitaire pour obtenir les options avec vérification de cache
    getOptions: (type) => {
      return state.options[type] || [];
    },
    
    // Fonction pour vérifier si on doit refetch
    shouldRefetch: (type) => {
      return !isCacheValid(type) || (state.options[type] && state.options[type].length === 0);
    }
  }), [state.options]);
  
  const value = useMemo(() => ({
    ...state,
    actions,
    isCacheValid
  }), [state, actions]);
  
  return (
    <OptionsContext.Provider value={value}>
      {children}
    </OptionsContext.Provider>
  );
};

// Hook pour utiliser le context
export const useOptionsContext = () => {
  const context = useContext(OptionsContext);
  if (!context) {
    throw new Error('useOptionsContext must be used within an OptionsProvider');
  }
  return context;
};

export default OptionsContext;
