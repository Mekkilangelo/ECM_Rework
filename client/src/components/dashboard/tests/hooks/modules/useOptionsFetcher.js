import { useState, useEffect } from 'react';
import enumService from '../../../../../services/enumService';

const useOptionsFetcher = (setLoading) => {
  // États pour les options des select
  const [locationOptions, setLocationOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [mountingTypeOptions, setMountingTypeOptions] = useState([]);
  const [positionTypeOptions, setPositionTypeOptions] = useState([]);
  const [processTypeOptions, setProcessTypeOptions] = useState([]);
  const [furnaceTypeOptions, setFurnaceTypeOptions] = useState([]);
  const [heatingCellOptions, setHeatingCellOptions] = useState([]);
  const [coolingMediaOptions, setCoolingMediaOptions] = useState([]);
  const [furnaceSizeOptions, setFurnaceSizeOptions] = useState([]);
  const [quenchCellOptions, setQuenchCellOptions] = useState([]);
  
  // États pour toutes les unités et les unités filtrées par type
  const [unitOptions, setUnitOptions] = useState([]);
  const [lengthUnitOptions, setLengthUnitOptions] = useState([]);
  const [weightUnitOptions, setWeightUnitOptions] = useState([]);
  const [timeUnitOptions, setTimeUnitOptions] = useState([]);
  const [temperatureUnitOptions, setTemperatureUnitOptions] = useState([]);
  const [pressureUnitOptions, setPressureUnitOptions] = useState([]);
  const [hardnessUnitOptions, setHardnessUnitOptions] = useState([]);
  
  const [gasOptions] = useState([
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' }
  ]);
  const [rampOptions] = useState([
    { value: 'up', label: 'Ramp Up', icon: 'fa-arrow-up' },
    { value: 'down', label: 'Ramp Down', icon: 'fa-arrow-down' },
    { value: 'continue', label: 'Continue', icon: 'fa-arrow-right' }
  ]);
  
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
  
  // Charger les options pour les selects
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Récupérer les options d'énumération pour les tests
        try {
          // Récupérer les options de localisation
          const locationResponse = await enumService.getEnumValues('tests', 'location');
          if (locationResponse.data && locationResponse.data.values) {
            const locations = locationResponse.data.values || [];
            setLocationOptions(locations.map(location => ({ 
              value: location, 
              label: location 
            })));
          }
          
          // Récupérer les options de statut
          const statusResponse = await enumService.getEnumValues('tests', 'status');
          if (statusResponse.data && statusResponse.data.values) {
            const statuses = statusResponse.data.values || [];
            setStatusOptions(statuses.map(status => ({ 
              value: status, 
              label: status 
            })));
          }
          
          // Récupérer les options de type de montage
          const mountingTypeResponse = await enumService.getEnumValues('tests', 'mounting_type');
          if (mountingTypeResponse.data && mountingTypeResponse.data.values) {
            const mountingTypes = mountingTypeResponse.data.values || [];
            setMountingTypeOptions(mountingTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
          
          // Récupérer les options de type de position
          const positionTypeResponse = await enumService.getEnumValues('tests', 'position_type');
          if (positionTypeResponse.data && positionTypeResponse.data.values) {
            const positionTypes = positionTypeResponse.data.values || [];
            setPositionTypeOptions(positionTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
          
          // Récupérer les options de type de processus
          const processTypeResponse = await enumService.getEnumValues('tests', 'process_type');
          if (processTypeResponse.data && processTypeResponse.data.values) {
            const processTypes = processTypeResponse.data.values || [];
            setProcessTypeOptions(processTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des options de test:', error);
        }
        
        // Récupérer les options d'énumération pour les fours
        try {
          // Récupérer les options de type de four
          const furnaceTypeResponse = await enumService.getEnumValues('furnaces', 'furnace_type');
          if (furnaceTypeResponse.data && furnaceTypeResponse.data.values) {
            const furnaceTypes = furnaceTypeResponse.data.values || [];
            setFurnaceTypeOptions(furnaceTypes.map(type => ({ 
              value: type, 
              label: type 
            })));
          }
          
          // Récupérer les options de cellule de chauffage
          const heatingCellResponse = await enumService.getEnumValues('furnaces', 'heating_cell_type');
          if (heatingCellResponse.data && heatingCellResponse.data.values) {
            const heatingCells = heatingCellResponse.data.values || [];
            setHeatingCellOptions(heatingCells.map(cell => ({ 
              value: cell, 
              label: cell 
            })));
          }
          
          // Récupérer les options de média de refroidissement
          const coolingMediaResponse = await enumService.getEnumValues('furnaces', 'cooling_media');
          if (coolingMediaResponse.data && coolingMediaResponse.data.values) {
            const coolingMedias = coolingMediaResponse.data.values || [];
            setCoolingMediaOptions(coolingMedias.map(media => ({ 
              value: media, 
              label: media 
            })));
          }
          
          // Récupérer les options de taille de four
          const furnaceSizeResponse = await enumService.getEnumValues('furnaces', 'furnace_size');
          if (furnaceSizeResponse.data && furnaceSizeResponse.data.values) {
            const furnaceSizes = furnaceSizeResponse.data.values || [];
            setFurnaceSizeOptions(furnaceSizes.map(size => ({ 
              value: size, 
              label: size 
            })));
          }
          
          // Récupérer les options de cellule de trempe
          const quenchCellResponse = await enumService.getEnumValues('furnaces', 'quench_cell');
          if (quenchCellResponse.data && quenchCellResponse.data.values) {
            const quenchCells = quenchCellResponse.data.values || [];
            setQuenchCellOptions(quenchCells.map(cell => ({ 
              value: cell, 
              label: cell 
            })));
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des options de four:', error);
        }
        
        // Récupérer les unités et les filtrer par type
        try {
          const units = await enumService.getUnits();
          console.log('Units retrieved:', units);
          
          if (Array.isArray(units) && units.length > 0) {
            // Convertir toutes les unités au format d'option
            const allUnitOptions = units.map(unit => ({ 
              value: unit.id, 
              label: unit.name,
              type: unit.type 
            }));
            
            // Stocker toutes les unités
            setUnitOptions(allUnitOptions);
            
            // Filtrer et stocker les unités par type
            setLengthUnitOptions(allUnitOptions.filter(unit => unit.type === 'length'));
            setWeightUnitOptions(allUnitOptions.filter(unit => unit.type === 'weight'));
            setTimeUnitOptions(allUnitOptions.filter(unit => unit.type === 'time'));
            setTemperatureUnitOptions(allUnitOptions.filter(unit => unit.type === 'temperature'));
            setPressureUnitOptions(allUnitOptions.filter(unit => unit.type === 'pressure'));
            setHardnessUnitOptions(allUnitOptions.filter(unit => unit.type === 'hardness'));
            
            // Log pour déboguer
            console.log('Length units:', allUnitOptions.filter(unit => unit.type === 'length'));
            console.log('Temperature units:', allUnitOptions.filter(unit => unit.type === 'temperature'));
          } else {
            console.warn('Units data is not in expected format:', units);
            setUnitOptions([]);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des unités:', error);
          setUnitOptions([]);
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
    locationOptions,
    statusOptions,
    mountingTypeOptions,
    positionTypeOptions,
    processTypeOptions,
    furnaceTypeOptions,
    heatingCellOptions,
    coolingMediaOptions,
    furnaceSizeOptions,
    quenchCellOptions,
    unitOptions,
    lengthUnitOptions,
    weightUnitOptions,
    timeUnitOptions,
    temperatureUnitOptions,
    pressureUnitOptions,
    hardnessUnitOptions,
    gasOptions,
    rampOptions,
    selectStyles,
    getSelectedOption
  };
};

export default useOptionsFetcher;