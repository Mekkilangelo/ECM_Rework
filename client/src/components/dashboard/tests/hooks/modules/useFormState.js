import { useState } from 'react';

const useFormState = () => {
  // État du formulaire
  const [formData, setFormData] = useState({
    // Informations de base
    name: '',
    location: '',
    status: '',
    description: '',
    
    // Types de test
    mountingType: '',
    positionType: '',
    processType: '',
    
    // Données du four
    furnaceData: {
      furnaceType: '',
      heatingCell: '',
      coolingMedia: '',
      furnaceSize: '',
      quenchCell: '',
    },
    
    // Données de charge
    loadData: {
      length: '',
      width: '',
      height: '',
      sizeUnit: '',
      floorCount: '',
      partCount: '',
      weight: '',
      weightUnit: '',
      loadComments: '',
    },
    
    // Données de recette
    recipeData: {
      recipeNumber: '',
      
      // Préoxydation
      preoxTemp: '',
      preoxTempUnit: '',
      preoxDuration: '',
      preoxDurationUnit: '',
      
      // Cycle thermique (tableau dynamique)
      thermalCycle: [
        {
          step: 1,
          ramp: 'up',
          setpoint: '',
          duration: ''
        }
      ],
      
      // Cycle chimique (tableau dynamique)
      chemicalCycle: [
        {
          step: 1,
          time: '',
          gas: '',
          debit: '',
          pressure: ''
        }
      ],
      
      // Autres paramètres de recette
      waitTime: '',
      waitTimeUnit: '',
      programDuration: '',
      programDurationUnit: '',
      cellTemp: '',
      cellTempUnit: '',
      waitPressure: '',
      waitPressureUnit: '',
    },
    
    // Données de trempe
    quenchData: {
      // Trempe au gaz (tableaux dynamiques)
      gasQuenchSpeed: [
        {
          step: 1,
          duration: '',
          speed: ''
        }
      ],
      gasQuenchPressure: [
        {
          step: 1,
          duration: '',
          pressure: ''
        }
      ],
      gasToleranceMin: '',
      gasToleranceMax: '',
      
      // Trempe à l'huile (tableau dynamique)
      oilQuenchSpeed: [
        {
          step: 1,
          duration: '',
          speed: ''
        }
      ],
      oilTemperature: '',
      oilTempUnit: '',
      oilToleranceMin: '',
      oilToleranceMax: '',
      oilPressure: '',
      oilInertingDelay: '',
      oilInertingDelayUnit: '',
      oilDrippingTime: '',
      oilDrippingTimeUnit: ''
    },
    
    // Ajout de la section resultsData avec un bloc initial
    resultsData: {
      results: [
        {
          step: 1,
          description: '',
          hardnessPoints: [
            {
              location: '',
              value: '',
              unit: ''
            }
          ],
          ecd: {
            toothFlank: {
              distance: '',
              unit: ''
            },
            toothRoot: {
              distance: '',
              unit: ''
            }
          },
          comment: ''
        }
      ]
    }
  });
  
  // États pour la gestion des erreurs et du chargement
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    setLoading,
    message,
    setMessage
  };
};

export default useFormState;