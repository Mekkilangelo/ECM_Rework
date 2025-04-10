// useOptionsData.js

import { useEffect, useCallback, useState } from 'react';
import enumService from '../../../../../services/enumService';
import steelService from '../../../../../services/steelService';

const useOptionsData = (setLoading, setDesignationOptions, setUnitOptions, setSteelOptions) => {
  // État pour suivre le dernier rafraîchissement
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Fonction pour récupérer les désignations
  const fetchDesignationOptions = useCallback(async () => {
    try {
      const designationsResponse = await enumService.getDesignations();
      if (designationsResponse.data && designationsResponse.data.values) {
        const designations = designationsResponse.data.values || [];
        setDesignationOptions(designations.map(designation => ({ 
          value: designation, 
          label: designation 
        })));
      } else {
        console.warn('Format de réponse des désignations inattendu:', designationsResponse);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des désignations:', error);
    }
  }, [setDesignationOptions]);

  // Fonction pour récupérer les unités
  const fetchUnitOptions = useCallback(async () => {
    try {
      const unitsResponse = await enumService.getUnits();
      
      if (unitsResponse && unitsResponse.data) {
        const units = unitsResponse.data;
        setUnitOptions(units.map(unit => ({ 
          value: unit.id || unit.value, 
          label: unit.name || unit.label,
          type: unit.type 
        })));
      } else if (Array.isArray(unitsResponse)) {
        setUnitOptions(unitsResponse.map(unit => ({ 
          value: unit.id || unit.value, 
          label: unit.name || unit.label,
          type: unit.type 
        })));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des unités:', error);
    }
  }, [setUnitOptions]);

  // Fonction pour récupérer les aciers (inchangée)
  const fetchSteelOptions = useCallback(async () => {
    try {
      console.log("Récupération des aciers en cours...");
      const response = await steelService.getAllSteels();
      console.log("Réponse API des aciers:", response);
      
      let steelsList = [];
      
      if (response && response.data) {
        if (response.data.steels && Array.isArray(response.data.steels)) {
          steelsList = response.data.steels;
        } else if (Array.isArray(response.data)) {
          steelsList = response.data;
        }
      } else if (Array.isArray(response)) {
        steelsList = response;
      }
      
      console.log("Liste d'aciers extraite:", steelsList);
      
      if (steelsList && steelsList.length > 0) {
        const steelOptions = steelsList.map(steel => {
          const steelData = steel.Steel || {};
          const grade = steelData.grade || '';
          const standard = steelData.standard || '';
          const label = standard ? `${grade} (${standard})` : grade;
          
          return {
            value: grade,
            label: label,
            nodeId: steel.id,
            family: steelData.family || '',
            standard: standard
          };
        });
        
        console.log("Options d'acier formatées:", steelOptions);
        setSteelOptions(steelOptions);
      } else {
        console.warn('Aucun acier trouvé dans la réponse');
        setSteelOptions([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des aciers:', error);
      setSteelOptions([]);
    }
  }, [setSteelOptions]);

  // Fonction de rafraîchissement général des options
  const refreshAllOptions = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Récupérer les désignations de pièces
        await fetchDesignationOptions();
        
        // Récupérer les unités
        await fetchUnitOptions();
        
        // Récupérer les aciers
        await fetchSteelOptions();
        
      } catch (error) {
        console.error('Erreur générale lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [setLoading, fetchDesignationOptions, fetchUnitOptions, fetchSteelOptions, refreshCounter]);
  
  // Retourner les fonctions de rafraîchissement
  return { 
    refreshSteelOptions: fetchSteelOptions,
    refreshDesignationOptions: fetchDesignationOptions,
    refreshUnitOptions: fetchUnitOptions,
    refreshAllOptions
  };
};

export default useOptionsData;