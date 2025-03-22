import { useState, useEffect } from 'react';
import enumService from '../../../../../services/enumService';

const useOptionsFetcher = (setLoading) => {
  const [countryOptions, setCountryOptions] = useState([]);

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

        // Récupérer les options d'énumération pour les pays
        const countryResponse = await enumService.getEnumValues('clients', 'country');
        if (countryResponse.data && countryResponse.data.values) {
          const countries = countryResponse.data.values || [];
          setCountryOptions(countries.map(country => ({ 
            value: country, 
            label: country 
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
    countryOptions,
    selectStyles,
    getSelectedOption
  };
};

export default useOptionsFetcher;