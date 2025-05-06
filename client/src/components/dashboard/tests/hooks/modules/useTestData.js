import { useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useTestData = (test, setFormData, setMessage, setFetchingTest) => {
  useEffect(() => {
    if (test && test.id) {
      const fetchTestDetails = async () => {
        setFetchingTest(true);
        try {
          const response = await axios.get(`${API_URL}/tests/${test.id}`);
          const testData = response.data;
          
          // Check if data is in the Test property or directly in testData
          const data = testData.Test || testData;
          
          console.log('Raw test data from API:', data);
          
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
            quenchData, 
            resultsData 
          });
          
          // Map from API structure to form structure
          setFormData({
            // Basic information
            name: data.test_code || '',
            loadNumber: data.load_number || '',
            testDate: data.test_date || '',
            location: data.location || '',
            status: data.status || '',
            description: testData.description || '',
            
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
              waitTime: recipeData.wait_time?.value || '',
              waitTimeUnit: recipeData.wait_time?.unit || '',
              programDuration: recipeData.program_duration?.value || '',
              programDurationUnit: recipeData.program_duration?.unit || '',
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
            
            // Results data - improved handling based on the provided example format
            resultsData: {
              results: Array.isArray(resultsData?.results) 
                ? resultsData.results.map(result => {
                    // Process hardness points
                    const hardnessPoints = Array.isArray(result.hardness_points) 
                      ? result.hardness_points.map(point => ({
                          location: point.location || '',
                          value: point.value || '',
                          unit: point.unit || ''
                        }))
                      : [{ location: '', value: '', unit: '' }];
                      
                    // Process ECD data - Adapter pour le nouveau format avec positions variables
                    const ecdData = {
                      hardnessValue: result.ecd?.hardness_value || '',
                      hardnessUnit: result.ecd?.hardness_unit || '',
                      ecdPoints: []
                    };
                    
                    // Traiter les positions ECD
                    if (result.ecd?.positions && Array.isArray(result.ecd.positions)) {
                      // Nouveau format avec tableau de positions
                      ecdData.ecdPoints = result.ecd.positions.map(pos => ({
                        name: pos.name || '',
                        distance: pos.distance || '',
                        unit: pos.unit || ''
                      }));
                    } else if (result.ecd?.tooth_flank || result.ecd?.tooth_root) {
                      // Ancien format avec positions fixes - conversion pour retrocompatibilité
                      if (result.ecd?.tooth_flank) {
                        ecdData.ecdPoints.push({
                          name: 'Flanc de dent',
                          distance: result.ecd.tooth_flank.distance || '',
                          unit: result.ecd.tooth_flank.unit || ''
                        });
                      }
                      
                      if (result.ecd?.tooth_root) {
                        ecdData.ecdPoints.push({
                          name: 'Pied de dent',
                          distance: result.ecd.tooth_root.distance || '',
                          unit: result.ecd.tooth_root.unit || ''
                        });
                      }
                    }
                    
                    // Si aucun point n'existe, créer au moins un point vide
                    if (ecdData.ecdPoints.length === 0) {
                      ecdData.ecdPoints.push({
                        name: '',
                        distance: '',
                        unit: ''
                      });
                    }
                    
                    // Nouveau: traiter les données de courbe avec prise en compte des positions dynamiques
                    const curvePoints = Array.isArray(result.curve_data?.points) 
                      ? result.curve_data.points.map(point => {
                          // Créer un objet de base avec la distance
                          const curvePoint = {
                            distance: point.distance || ''
                          };
                          
                          // Ajouter les valeurs de dureté pour les positions ECD dynamiques
                          if (result.ecd?.positions && Array.isArray(result.ecd.positions)) {
                            result.ecd.positions.forEach(pos => {
                              if (pos.name) {
                                // Générer le nom du champ en snake_case comme stocké dans l'API
                                const fieldKey = pos.name.toLowerCase().replace(/\s+/g, '_');
                                // Générer le nom du champ en camelCase comme utilisé dans le frontend
                                const fieldName = `hardness_${fieldKey.replace(/[^a-zA-Z0-9_]/g, '')}`;
                                
                                // Ajouter au point de courbe si la valeur existe dans les données
                                if (point[fieldKey] !== undefined) {
                                  curvePoint[fieldName] = point[fieldKey] || '';
                                }
                              }
                            });
                          }
                          
                          // Conserver l'ancien format pour la rétrocompatibilité
                          curvePoint.flankHardness = point.flank_hardness || '';
                          curvePoint.rootHardness = point.root_hardness || '';
                          
                          return curvePoint;
                        })
                      : [];
                      
                    return {
                      step: result.step || 1,
                      description: result.description || '',
                      hardnessPoints: hardnessPoints,
                      ecd: ecdData,
                      hardnessUnit: result.hardness_unit || '',
                      curveData: { points: curvePoints },
                      comment: result.comment || ''
                    };
                  })
                : [{
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
            }
          });
          
          console.log('FormData set successfully');
          
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