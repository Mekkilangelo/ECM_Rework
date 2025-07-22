import { useEffect } from 'react';
import testService from '../../../../../services/testService';

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
 * Hook pour récupérer et formater les données d'un test
 * @param {Object} test - Le test à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingTest - Fonction pour indiquer l'état de chargement
 */
const useTestData = (test, setFormData, setMessage, setFetchingTest) => {
  useEffect(() => {
    if (test && test.id) {
      const fetchTestDetails = async () => {
        setFetchingTest(true);
        try {
          // Récupération des données du test avec la méthode refactorisée
          const testData = await testService.getTest(test.id);
            // Check if data is in the Test property or directly in testData
          const data = testData.Test || testData;
          
          // Parse JSON strings if necessary
          const furnaceData = typeof data.furnace_data === 'string' 
            ? JSON.parse(data.furnace_data) 
            : (data.furnace_data || {});
            
          const loadData = typeof data.load_data === 'string'
            ? JSON.parse(data.load_data) 
            : (data.load_data || {});
            
          const recipeData = typeof data.recipe_data === 'string' 
            ? JSON.parse(data.recipe_data) 
            : (data.recipe_data || {});

          // Extraire d'abord les gaz globaux sélectionnés
          const selectedGas1 = recipeData.selected_gas1 || '';
          const selectedGas2 = recipeData.selected_gas2 || '';
          const selectedGas3 = recipeData.selected_gas3 || '';
            
          const quenchData = typeof data.quench_data === 'string' 
            ? JSON.parse(data.quench_data) 
            : (data.quench_data || {});
              const resultsData = typeof data.results_data === 'string' 
            ? JSON.parse(data.results_data) 
            : (data.results_data || {});
          
          console.log('Parsed test data:', { 
            furnaceData, 
            loadData, 
            recipeData, 
            quenchData,            resultsData 
          });
          
          // Map from API structure to form structure
          setFormData({
            // Basic information
            name: data.test_code || '',
            loadNumber: data.load_number || '',
            testDate: data.test_date || '',
            location: data.location || '',
            status: data.status || '',
            description: data.description || '',
            
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

              // Ajouter les gaz globaux sélectionnés
              selectedGas1: selectedGas1,
              selectedGas2: selectedGas2,
              selectedGas3: selectedGas3,
                // Other recipe parameters
              // Charger directement les valeurs en minutes sans conversion
              waitTime: recipeData.wait_time?.value || '',
              waitTimeUnit: recipeData.wait_time?.unit || '',
              cellTemp: recipeData.cell_temp?.value || '',
              cellTempUnit: recipeData.cell_temp?.unit || '',
              waitPressure: recipeData.wait_pressure?.value || '',
              waitPressureUnit: recipeData.wait_pressure?.unit || '',
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
                                  name: pos.name || '',
                                  distance: pos.distance || '',
                                  unit: pos.unit || ''
                                }))
                              : []
                          };
                          
                          // Traiter les données de courbe avec prise en compte des positions dynamiques
                          const curvePoints = Array.isArray(sample.curve_data?.points)
                            ? sample.curve_data.points.map(point => {
                                const curvePoint = { distance: point.distance || '' };
                                
                                // Ajouter toutes les propriétés du point (pas seulement les positions ECD connues)
                                Object.keys(point).forEach(key => {
                                  if (key !== 'distance') {
                                    curvePoint[key] = point[key];
                                  }
                                });
                                
                                // Si on a des positions ECD définies, s'assurer qu'elles existent dans le point
                                if (Array.isArray(sample.ecd?.positions)) {
                                  sample.ecd.positions.forEach(pos => {
                                    if (pos.name) {
                                      const normalizedKey = pos.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
                                      if (curvePoint[normalizedKey] === undefined) {
                                        curvePoint[normalizedKey] = point[normalizedKey] || point[pos.name] || '';
                                      }
                                    }
                                  });
                                }
                                
                                return curvePoint;
                              })
                            : [];

                          // Debug log pour vérifier les données de courbe chargées
                          if (process.env.NODE_ENV === 'development' && curvePoints.length > 0) {
                            console.log(`=== CHARGEMENT CURVE DATA [Result ${resultBlock.step}][Sample ${sample.step}] ===`);
                            console.log('Points chargés depuis API:', curvePoints.length);
                            console.log('Premier point:', curvePoints[0]);
                            console.log('Clés disponibles:', Object.keys(curvePoints[0]));
                          }
                          
                          return {
                            step: sample.step || 1,
                            description: sample.description || '',
                            hardnessPoints: hardnessPoints,
                            ecd: ecdData,
                            hardnessUnit: sample.hardness_unit || '',
                            curveData: { points: curvePoints },
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
                          curveData: { points: [] },
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
                        ecdPoints: [{ name: '', distance: '', unit: '' }]
                      },
                      hardnessUnit: '',
                      curveData: { points: [] },
                      comment: ''
                    }]
                  }]
            }          });          
        } catch (error) {
          console.error('Error while fetching test details:', error);
          console.error('Error details:', error.response?.data || error.message);
          setMessage({
            type: 'danger',
            text: 'Unable to load test details'
          });
        } finally {
          setFetchingTest(false);
        }
      };
      
      fetchTestDetails();
    }
  }, [test, setFormData, setMessage, setFetchingTest]);
};

export default useTestData;