import { useState, useEffect } from 'react';
import enumService from '../../../../../services/enumService';
import steelService from '../../../../../services/steelService';

const useOptionsFetcher = (setLoading) => {
  const [steelFamilyOptions, setSteelFamilyOptions] = useState([]);
  const [steelStandardOptions, setSteelStandardOptions] = useState([]);
  const [steelGradeOptions, setSteelGradeOptions] = useState([]);
  const [elementOptions, setElementOptions] = useState([]);

  // Style pour les composants Select
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      borderColor: '#ced4da',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#80bdff'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999
    })
  };
  
  // Fonction utilitaire pour obtenir l'option sélectionnée
  const getSelectedOption = (options, value) => {
    if (!options || !Array.isArray(options)) {
      return null;
    }
    
    if (!value) {
      return null;
    }
    
    return options.find(option => option.value === value) || null;
  };

  // Charger les données des options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);

        // Récupérer les options de famille d'acier
        const familyResponse = await enumService.getEnumValues('steels', 'family');
        if (familyResponse.data && familyResponse.data.values) {
          const families = familyResponse.data.values || [];
          setSteelFamilyOptions(families.map(family => ({ 
            value: family, 
            label: family 
          })));
        }
        
        // Récupérer les options de standard d'acier
        const standardResponse = await enumService.getEnumValues('steels', 'standard');
        if (standardResponse.data && standardResponse.data.values) {
          const standards = standardResponse.data.values || [];
          setSteelStandardOptions(standards.map(standard => ({ 
            value: standard, 
            label: standard 
          })));
        }
        
        // Récupérer les aciers pour les équivalents
        try {
          const steelsResponse = await steelService.getAllSteels();
          console.log("Réponse API des aciers:", steelsResponse);
          
          let steelsList = [];
          
          if (steelsResponse && steelsResponse.data) {
            if (steelsResponse.data.steels && Array.isArray(steelsResponse.data.steels)) {
              steelsList = steelsResponse.data.steels;
            } else if (Array.isArray(steelsResponse.data)) {
              steelsList = steelsResponse.data;
            }
          } else if (Array.isArray(steelsResponse)) {
            steelsList = steelsResponse;
          }
          
          if (steelsList && steelsList.length > 0) {
            const options = steelsList.map(steel => {
              const steelData = steel.Steel || steel;
              const id = steel.id;
              const grade = steelData.grade || '';
              const standard = steelData.standard || '';
              const label = standard ? `${grade} (${standard})` : grade;
              
              return {
                value: id,  // C'est l'ID que vous voulez comme valeur
                label: label
              };
            });
            
            setSteelGradeOptions(options);
          } else {
            console.warn('Aucun acier trouvé dans la réponse');
            setSteelGradeOptions([]);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des aciers:', error);
          setSteelGradeOptions([]);
        }
        
        // Récupérer les éléments chimiques
        const elementsResponse = await enumService.getEnumValues('steels', 'elements');
        if (elementsResponse.data && elementsResponse.data.values) {
          const elements = elementsResponse.data.values || [];
          setElementOptions(elements.map(element => ({ 
            value: element, 
            label: element 
          })));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [setLoading]);

  return {
    steelFamilyOptions,
    steelStandardOptions,
    steelGradeOptions,
    elementOptions,
    selectStyles,
    getSelectedOption
  };
};

export default useOptionsFetcher;
