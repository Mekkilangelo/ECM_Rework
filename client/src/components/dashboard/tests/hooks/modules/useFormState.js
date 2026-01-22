import useGenericFormState from '../../../../../hooks/useGenericFormState';

/**
 * Hook pour gérer l'état du formulaire Test/Trial
 * Utilise le hook générique useGenericFormState avec configuration spécifique
 */
const useFormState = () => {
  // Obtenir la date du jour au format YYYY-MM-DD pour le champ de type date
  const today = new Date().toISOString().split('T')[0];

  return useGenericFormState(
    {
    // Informations de base
    name: '',
    loadNumber: '', // Numéro de charge
    trialDate: today, // Préremplir avec la date du jour
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
          samples: [
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
                ecdPoints: [
                  {
                    position: '',
                    distance: ''
                  }
                ]
              },
              comment: '',
              hardnessUnit: 'HV',
              curveData: {
                distances: [],
                series: []
              }
            }
          ]
        }
      ]
    }
  },
  {
    entityName: 'Trial',
    withFetching: false,
    withParentId: false
  }
);
};

export default useFormState;