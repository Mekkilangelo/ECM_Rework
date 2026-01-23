import { useEffect } from 'react';
import trialService from '../../../../../services/trialService';

/**
 * Fonction utilitaire pour convertir les secondes en heures, minutes, secondes
 */
const convertSecondsToHMS = (totalSeconds) => {
  if (!totalSeconds || totalSeconds === '') {
    return { hours: '', minutes: '', seconds: '' };
  }
  
  const total = parseInt(totalSeconds, 10);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  
  return {
    hours: hours > 0 ? hours.toString() : '',
    minutes: minutes > 0 ? minutes.toString() : '',
    seconds: seconds > 0 ? seconds.toString() : ''
  };
};

/**
 * Hook pour récupérer et formater les données d'un trial
 * @param {Object} trial - Le trial à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingTest - Fonction pour indiquer l'état de chargement
 */
const useTrialData = (trial, setFormData, setMessage, setFetchingTest) => {
  useEffect(() => {
    if (trial && trial.id) {
      const fetchTrialDetails = async () => {
        setFetchingTest(true);
        try {
          // Récupération des données du trial avec la méthode refactorisée
          const trialData = await trialService.getTrial(trial.id);
          
          // DEBUG: Log pour voir la structure des données reçues
          
          
          
          
          // Les données sont déjà à la racine de trialData (pas dans trialData.trial)
          const data = trialData;
          
          // Les données sont déjà des objets, pas des strings JSON
          const furnaceData = data.furnace_data || {};
          const loadData = data.load_data || {};
          const recipeData = data.recipe_data || {};
          const quenchData = data.quench_data || {};
          const resultsData = data.results_data || {};
          
          // DEBUG: Log des données extraites
          
          
          
          
          // DEBUG: Log des valeurs de sélection
          
          
          
          
          
          
          
          
          
          // Map from API structure to form structure
          setFormData({
            // Basic information
            name: data.name || '',  // Utiliser le vrai nom du nœud, pas le trial_code
            loadNumber: data.load_number || '',
            trialDate: data.trial_date || '',
            location: data.location || '',
            status: data.status || '',
            description: data.description || '',
            conclusion: data.conclusion || '',

            // Test types
            mountingType: data.mounting_type || '',
            positionType: data.position_type || '',
            processType: data.process_type || '',
            
            // Furnace data
            furnaceData: {
              furnaceType: furnaceData.furnace_type || '',
              heatingCell: furnaceData.heating_cell || '',
              coolingMedia: furnaceData.cooling_media || '',
              furnaceSize: furnaceData.furnace_size || '',
              quenchCell: furnaceData.quench_cell || '',
            },
            
            // Load data
            loadData: {
              length: loadData.size?.length?.value || '',
              width: loadData.size?.width?.value || '',
              height: loadData.size?.height?.value || '',
              sizeUnit: loadData.size?.length?.unit || loadData.size?.width?.unit || loadData.size?.height?.unit || '',
              floorCount: loadData.floor_count || '',
              partCount: loadData.part_count || '',
              weight: loadData.weight?.value || '',
              weightUnit: loadData.weight?.unit || '',
              loadComments: loadData.comments || '',
            },
            
            // Recipe data
            recipeData: {
              recipeNumber: recipeData.number || '',
              
              // Preoxidation
              preoxTemp: recipeData.preox?.temperature?.value || '',
              preoxTempUnit: recipeData.preox?.temperature?.unit || '',
              preoxDuration: recipeData.preox?.duration?.value || '',
              preoxDurationUnit: recipeData.preox?.duration?.unit || '',
              preoxMedia: recipeData.preox?.media || '',
              
              // Thermal cycle (dynamic array)
              thermalCycle: Array.isArray(recipeData.thermal_cycle) && recipeData.thermal_cycle.length > 0
                ? recipeData.thermal_cycle.map((cycle, index) => ({
                    step: index + 1,
                    ramp: cycle.ramp || 'up',
                    setpoint: cycle.setpoint || '',
                    duration: cycle.duration || ''
                  }))
                : [{ step: 1, ramp: 'up', setpoint: '', duration: '' }],
              
              // Gaz sélectionnés pour le cycle chimique
              selectedGas1: recipeData.selected_gas1 || '',
              selectedGas2: recipeData.selected_gas2 || '',
              selectedGas3: recipeData.selected_gas3 || '',
              
              // Chemical cycle (dynamic array)
              chemicalCycle: Array.isArray(recipeData.chemical_cycle) && recipeData.chemical_cycle.length > 0
                ? recipeData.chemical_cycle.map((cycle, index) => {
                    // Initialiser avec des valeurs vides
                    const cycleData = {
                      step: index + 1,
                      time: cycle.time || '',
                      debit1: '',
                      debit2: '',
                      debit3: '',
                      pressure: cycle.pressure || '',
                      turbine: cycle.turbine === true
                    };
                    
                    // Remplir les débits aux bonnes positions
                    if (Array.isArray(cycle.gases)) {
                      const selectedGas1 = recipeData.selected_gas1 || '';
                      const selectedGas2 = recipeData.selected_gas2 || '';
                      const selectedGas3 = recipeData.selected_gas3 || '';
                      
                      cycle.gases.forEach(gasItem => {
                        // Si nous avons l'indice stocké
                        if (gasItem.index) {
                          cycleData[`debit${gasItem.index}`] = gasItem.debit || '';
                        } else {
                          // Pour la rétrocompatibilité avec les anciens formats de données
                          // On vérifie à quel gaz sélectionné correspond ce gaz
                          if (gasItem.gas === selectedGas1) {
                            cycleData.debit1 = gasItem.debit || '';
                          } else if (gasItem.gas === selectedGas2) {
                            cycleData.debit2 = gasItem.debit || '';
                          } else if (gasItem.gas === selectedGas3) {
                            cycleData.debit3 = gasItem.debit || '';
                          }
                        }
                      });
                    }
                    
                    return cycleData;
                  })
                : [{ step: 1, time: '', debit1: '', debit2: '', debit3: '', pressure: '', turbine: false }],

              // Other recipe parameters
              // Charger directement les valeurs en minutes sans conversion
              waitTime: recipeData.wait_time?.value || '',
              waitTimeUnit: recipeData.wait_time?.unit || '',
              cellTemp: recipeData.cell_temp?.value || '',
              cellTempUnit: recipeData.cell_temp?.unit || '',
              waitPressure: recipeData.wait_pressure?.value || '',
              waitPressureUnit: recipeData.wait_pressure?.unit || '',
              waitGas: recipeData.wait_gas || '',
              waitFlow: recipeData.wait_flow || '',
            },
            
            // Quench data
            quenchData: {
              // Gas quench (dynamic arrays)
              gasQuenchSpeed: Array.isArray(quenchData.gas_quench?.speed_parameters) && quenchData.gas_quench?.speed_parameters.length > 0
                ? quenchData.gas_quench.speed_parameters.map((param, index) => ({
                    step: index + 1,
                    duration: param.duration || '',
                    speed: param.speed || ''
                  }))
                : [{ step: 1, duration: '', speed: '' }],
              
              gasQuenchPressure: Array.isArray(quenchData.gas_quench?.pressure_parameters) && quenchData.gas_quench?.pressure_parameters.length > 0
                ? quenchData.gas_quench.pressure_parameters.map((param, index) => ({
                    step: index + 1,
                    duration: param.duration || '',
                    pressure: param.pressure || ''
                  }))
                : [{ step: 1, duration: '', pressure: '' }],
              
              // Oil quench (dynamic array)
              oilQuenchSpeed: Array.isArray(quenchData.oil_quench?.speed_parameters) && quenchData.oil_quench?.speed_parameters.length > 0
                ? quenchData.oil_quench.speed_parameters.map((param, index) => ({
                    step: index + 1,
                    duration: param.duration || '',
                    speed: param.speed || ''
                  }))
                : [{ step: 1, duration: '', speed: '' }],
              
              oilTemperature: quenchData.oil_quench?.temperature?.value || '',
              oilTempUnit: quenchData.oil_quench?.temperature?.unit || '',
              oilInertingPressure: quenchData.oil_quench?.inerting_pressure || '',
              oilInertingDelay: quenchData.oil_quench?.inerting_delay?.value || '',
              oilInertingDelayUnit: quenchData.oil_quench?.inerting_delay?.unit || '',
              oilDrippingTime: quenchData.oil_quench?.dripping_time?.value || '',
              oilDrippingTimeUnit: quenchData.oil_quench?.dripping_time?.unit || ''
            },
              // Results data - Traitement de la nouvelle structure avec results > samples
            resultsData: {
              results: Array.isArray(resultsData?.results) 
                ? resultsData.results.map(resultBlock => {
                    // Traiter les échantillons dans chaque bloc de résultat
                    const samples = Array.isArray(resultBlock.samples) && resultBlock.samples.length > 0
                      ? resultBlock.samples.map(sample => {
                          // Process hardness points
                          const hardnessPoints = Array.isArray(sample.hardness_points) 
                            ? sample.hardness_points.map(point => ({
                                location: point.location || '',
                                value: point.value || '',
                                unit: point.unit || ''
                              }))
                            : [{ location: '', value: '', unit: '' }];
                          
                          // Process ECD data - Nouveau format uniquement
                          const ecdData = {
                            hardnessValue: sample.ecd?.hardness_value || '',
                            hardnessUnit: sample.ecd?.hardness_unit || '',
                            ecdPoints: Array.isArray(sample.ecd?.positions)
                              ? sample.ecd.positions.map(pos => ({
                                  position: pos.position || pos.name || '',
                                  distance: pos.distance || ''
                                }))
                              : []
                          };
                          
                          // Traiter les données de courbe - NOUVEAU FORMAT PRIORITAIRE
                          let curveData = { distances: [], series: [] };
                          
                          if (sample.curve_data) {
                            // NOUVEAU FORMAT: distances + series (prioritaire)
                            // Vérifier la présence des propriétés, pas leur truthiness
                            if (sample.curve_data.hasOwnProperty('distances') && sample.curve_data.hasOwnProperty('series')) {
                              curveData = {
                                distances: Array.isArray(sample.curve_data.distances) ? sample.curve_data.distances : [],
                                series: Array.isArray(sample.curve_data.series) ? sample.curve_data.series : []
                              };
                            }
                            // ANCIEN FORMAT: points (conversion)
                            else if (Array.isArray(sample.curve_data.points) && sample.curve_data.points.length > 0) {
                              
                              // Extraire les distances uniques
                              const distances = [...new Set(sample.curve_data.points.map(p => p.distance))].sort((a, b) => a - b);
                              const seriesNames = new Set();
                              
                              // Découvrir tous les noms de séries
                              sample.curve_data.points.forEach(point => {
                                Object.keys(point).forEach(key => {
                                  if (key !== 'distance') {
                                    seriesNames.add(key);
                                  }
                                });
                              });
                              
                              // Créer les séries
                              const series = Array.from(seriesNames).map(seriesName => ({
                                name: seriesName,
                                values: distances.map(distance => {
                                  const point = sample.curve_data.points.find(p => p.distance === distance);
                                  return point && point[seriesName] !== undefined ? point[seriesName] : '';
                                })
                              }));
                              
                              curveData = { distances, series };
                            }
                          }
                          
                          return {
                            step: sample.step || 1,
                            description: sample.description || '',
                            hardnessPoints: hardnessPoints,
                            ecd: ecdData,
                            hardnessUnit: sample.hardness_unit || '',
                            curveData: curveData, // Nouveau format directement
                            comment: sample.comment || ''
                          };
                        })
                      : [{
                          step: 1,
                          description: '',
                          hardnessPoints: [{ location: '', value: '', unit: '' }],
                          ecd: {
                            hardnessValue: '',
                            hardnessUnit: '',
                            ecdPoints: []
                          },
                          hardnessUnit: '',
                          curveData: { distances: [], series: [] }, // Nouveau format par défaut
                          comment: ''
                        }];

                    return {
                      step: resultBlock.step || 1,
                      description: resultBlock.description || '',
                      samples: samples
                    };
                  })
                : [{
                    step: 1,
                    description: '',
                    samples: [{
                      step: 1,
                      description: '',
                      hardnessPoints: [{ location: '', value: '', unit: '' }],
                      ecd: {
                        hardnessValue: '',
                        hardnessUnit: '',
                        ecdPoints: [{ position: '', distance: '' }]
                      },
                      hardnessUnit: '',
                      curveData: { distances: [], series: [] }, // Nouveau format par défaut
                      comment: ''
                    }]
                  }]
            }          
          });
          
          // DEBUG: Log après setFormData
          
          
        } catch (error) {
          console.error('Error while fetching trial details:', error);
          console.error('Error details:', error.response?.data || error.message);
          setMessage({
            type: 'danger',
            text: 'Unable to load trial details'
          });
        } finally {
          setFetchingTest(false);
        }
      };
      
      fetchTrialDetails();
    }
  }, [trial, setFormData, setMessage, setFetchingTest]);
};

export default useTrialData;