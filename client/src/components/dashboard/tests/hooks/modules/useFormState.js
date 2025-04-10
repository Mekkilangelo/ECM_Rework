
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
      preoxMedia: '',
      
      // Cycle thermique (tableau dynamique)
      thermalCycle: [
        {
          step: 1,
          ramp: 'up',
          setpoint: '',
          duration: ''
        }
      ],
      
      // Configuration globale des gaz (nouveaux champs)
      selectedGas1: '',
      selectedGas2: '',
      selectedGas3: '',
      
      // Cycle chimique (tableau dynamique) - MODIFIÉ pour utiliser les gaz globaux + turbine
      chemicalCycle: [
        {
          step: 1,
          time: '',
          debit1: '',
          debit2: '',
          debit3: '',
          pressure: '',
          turbine: false  // Valeur par défaut pour la turbine (non/false)
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
      oilInertingPressure: '',
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
            hardnessValue: '',
            hardnessUnit: '',
            toothFlank: {
              distance: '',
              unit: ''
            },
            toothRoot: {
              distance: '',
              unit: ''
            }
          },
          comment: '',
          
          hardnessUnit: 'HV',
          curveData: {
            points: []
          }
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