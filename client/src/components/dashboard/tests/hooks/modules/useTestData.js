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
                ? recipeData.chemical_cycle.map((cycle, index) => ({
                    step: index + 1,
                    time: cycle.time || '',
                    gas: cycle.gas || '',
                    debit: cycle.debit || '',
                    pressure: cycle.pressure || ''
                  }))
                : [{ step: 1, time: '', gas: '', debit: '', pressure: '' }],
              
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
                ? resultsData.results.map(result => ({
                    step: result.step || 1,
                    description: result.description || '',
                    hardnessPoints: Array.isArray(result.hardness_points) 
                      ? result.hardness_points.map(point => ({
                          location: point.location || '',
                          value: point.value || '',
                          unit: point.unit || ''
                        }))
                      : [{ location: '', value: '', unit: '' }],
                    ecd: {
                      hardnessValue: result.ecd?.hardness_value || '',
                      hardnessUnit: result.ecd?.hardness_unit || '',
                      toothFlank: { 
                        distance: result.ecd?.tooth_flank?.distance || '', 
                        unit: result.ecd?.tooth_flank?.unit || '' 
                      },
                      toothRoot: { 
                        distance: result.ecd?.tooth_root?.distance || '', 
                        unit: result.ecd?.tooth_root?.unit || '' 
                      }
                    },
                    comment: result.comment || ''
                  }))
                : [{
                    step: 1,
                    description: '',
                    hardnessPoints: [{ location: '', value: '', unit: '' }],
                    ecd: {
                      hardnessValue: '',
                      hardnessUnit: '',
                      toothFlank: { distance: '', unit: '' },
                      toothRoot: { distance: '', unit: '' }
                    },
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