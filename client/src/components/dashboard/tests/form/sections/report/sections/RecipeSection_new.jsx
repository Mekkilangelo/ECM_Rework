import React, { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import fr from 'date-fns/locale/fr';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faCogs, faUser, faCalendarAlt, faThermometerHalf, faTachometerAlt, faClock, faChartLine } from '@fortawesome/free-solid-svg-icons';
import SectionHeader from './common/SectionHeader';

const RecipeSection = ({ testData, recipeData: passedRecipeData, clientData }) => {
  const [totalThermalDuration, setTotalThermalDuration] = useState(0);
  const [totalChemicalDuration, setTotalChemicalDuration] = useState(0);
  const [chartData, setChartData] = useState(null);
  
  // Utiliser recipeData passé directement ou extrait de testData
  const recipeData = passedRecipeData || 
    (typeof testData?.recipe_data === 'string' 
      ? (() => {
          try {
            return JSON.parse(testData.recipe_data);
          } catch (e) {
            console.error('Failed to parse recipe_data string:', e);
            return {};
          }
        })()
      : testData?.recipe_data || {});

  // Traitement des données de trempe
  const quenchData = (() => {
    let rawQuenchData = passedRecipeData?.quench_data || testData?.quench_data;
    
    if (typeof rawQuenchData === 'string') {
      try {
        rawQuenchData = JSON.parse(rawQuenchData);
      } catch (e) {
        console.error('Failed to parse quench_data string:', e);
        return {};
      }
    }
    
    if (!rawQuenchData) return {};
    
    const { oil_quench, gas_quench } = rawQuenchData;
    
    if (!rawQuenchData.oil_quench && !rawQuenchData.gas_quench) {
      if (rawQuenchData.oilTemperature || rawQuenchData.oilQuenchSpeed || rawQuenchData.gasQuenchSpeed) {
        const convertedData = {
          oil_quench: {},
          gas_quench: {}
        };
        
        if (rawQuenchData.oilTemperature) {
          convertedData.oil_quench.temperature = {
            value: rawQuenchData.oilTemperature,
            unit: rawQuenchData.oilTempUnit || 'C'
          };
        }
        
        if (rawQuenchData.oilInertingPressure) {
          convertedData.oil_quench.inerting_pressure = rawQuenchData.oilInertingPressure;
        }
        
        if (rawQuenchData.oilInertingDelay) {
          convertedData.oil_quench.inerting_delay = rawQuenchData.oilInertingDelay;
        }
        
        if (rawQuenchData.oilDrippingTime) {
          convertedData.oil_quench.dripping_time = rawQuenchData.oilDrippingTime;
        }
        
        if (Array.isArray(rawQuenchData.oilQuenchSpeed) && rawQuenchData.oilQuenchSpeed.length > 0) {
          convertedData.oil_quench.speed_parameters = rawQuenchData.oilQuenchSpeed;
        }
        
        if (rawQuenchData.gasQuenchSpeed) {
          convertedData.gas_quench.speed_parameters = rawQuenchData.gasQuenchSpeed;
        }
        
        if (Array.isArray(rawQuenchData.gasQuenchPressure) && rawQuenchData.gasQuenchPressure.length > 0) {
          convertedData.gas_quench.pressure_parameters = rawQuenchData.gasQuenchPressure;
        }
        rawQuenchData = convertedData;
      }
    }
    
    return rawQuenchData;
  })();
  
  const formattedDate = testData?.testDate 
    ? format(new Date(testData.testDate), 'd MMMM yyyy', { locale: fr }) 
    : 'Not specified';

  useEffect(() => {
    if (recipeData) {
      if (recipeData.thermal_cycle) {
        const total = recipeData.thermal_cycle.reduce((acc, step) => 
          acc + (parseInt(step.duration) || 0), 0);
        setTotalThermalDuration(total);
      }
      
      if (recipeData.chemical_cycle) {
        const chemicalTotal = recipeData.chemical_cycle.reduce((acc, step) => 
          acc + (parseInt(step.time) || 0), 0);
        
        const waitTime = parseInt(recipeData.wait_time?.value) || 0;
        const waitTimeInSeconds = recipeData.wait_time?.unit === 'min' ? waitTime * 60 : waitTime;
        
        setTotalChemicalDuration(chemicalTotal + waitTimeInSeconds);
      }
      
      generateChartData();
    }
  }, [recipeData]);

  const generateChartData = () => {
    if (!recipeData.thermal_cycle || !recipeData.chemical_cycle) {
      setChartData(null);
      return;
    }

    const thermalCycle = recipeData.thermal_cycle;
    const chemicalCycle = recipeData.chemical_cycle;
    
    let temperaturePoints = [];
    
    const cellTemp = parseInt(recipeData.cell_temp?.value) || 20;
    
    const waitTime = parseInt(recipeData.wait_time?.value) || 0;
    const waitTimeInMinutes = recipeData.wait_time?.unit === 'min' 
      ? waitTime 
      : waitTime / 60;
    
    temperaturePoints.push({ x: 0, y: cellTemp });
    temperaturePoints.push({ x: waitTimeInMinutes, y: cellTemp });
    
    let timeOffset = waitTimeInMinutes;
    
    thermalCycle.forEach((step, index) => {
      const duration = parseInt(step.duration) || 0;
      const setpoint = parseInt(step.setpoint) || 0;
      
      const startTemp = index === 0 ? cellTemp : parseInt(thermalCycle[index - 1].setpoint) || 0;
      
      temperaturePoints.push({ x: timeOffset, y: startTemp });
      temperaturePoints.push({ x: timeOffset + duration, y: setpoint });
      
      timeOffset += duration;
    });

    const gasDatasets = {};
    const gasColors = {
      'N2': (alpha = 1) => `rgba(54, 162, 235, ${alpha})`,
      'Ar': (alpha = 1) => `rgba(255, 99, 132, ${alpha})`,
      'H2': (alpha = 1) => `rgba(153, 0, 255, ${alpha})`,
      'default': (alpha = 1) => `rgba(255, 100, 0, ${alpha})`
    };

    [recipeData.selected_gas1, recipeData.selected_gas2, recipeData.selected_gas3]
      .filter(Boolean)
      .forEach(gas => {
        gasDatasets[gas] = {
          label: `Débit ${gas} (Nl/h)`,
          data: [],
          borderColor: gasColors[gas] ? gasColors[gas](1) : gasColors.default(1),
          backgroundColor: gasColors[gas] ? gasColors[gas](0.1) : gasColors.default(0.1),
          borderWidth: 2,
          pointRadius: 2,
          yAxisID: 'y1',
          fill: false
        };
      });

    let chemTimeOffset = waitTimeInMinutes;
    
    chemicalCycle.forEach(step => {
      const stepTime = (parseInt(step.time) || 0) / 60;
      const stepEnd = chemTimeOffset + stepTime;
      
      step.gases?.forEach(gas => {
        const debit = parseInt(gas.debit) || 0;
        
        if (debit > 0 && gasDatasets[gas.gas]) {
          gasDatasets[gas.gas].data.push({ x: chemTimeOffset, y: debit });
          gasDatasets[gas.gas].data.push({ x: stepEnd, y: debit });
        }
      });
      
      chemTimeOffset = stepEnd;
    });

    const datasets = [
      {
        label: 'Température (°C)',
        data: temperaturePoints,
        borderColor: 'rgba(220, 53, 69, 1)',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderWidth: 3,
        pointRadius: 0,
        yAxisID: 'y',
        fill: false
      }
    ];

    for (const gas in gasDatasets) {
      if (gasDatasets[gas].data.length > 0) {
        datasets.push(gasDatasets[gas]);
      }
    }

    setChartData({ datasets });
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Temps (min)'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Température (°C)'
        },
        min: 0,
        suggestedMax: parseInt(recipeData.cell_temp?.value || 0) * 1.1 || 1000,
        grid: {
          color: 'rgba(220, 53, 69, 0.1)'
        },
        ticks: {
          callback: function(value) {
            return value + '°C';
          }
        }
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Débit (Nl/h)'
        },
        min: 0,
        suggestedMax: Math.max(
          ...recipeData.chemical_cycle?.flatMap(step => 
            step.gases?.map(gas => parseInt(gas.debit) || 0) || []
          ) || [100]
        ) * 1.1,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return value + ' Nl/h';
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 15,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Évolution de la température et des débits de gaz',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('Température')) {
                label += context.parsed.y + '°C';
              } else if (label.includes('Débit')) {
                label += context.parsed.y + ' Nl/h';
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          },
          title: function(context) {
            return 'Temps: ' + context[0].parsed.x + ' min';
          }
        }
      }
    }
  };

  const renderQuenchData = () => {
    const { oil_quench, gas_quench } = quenchData;
    
    if (oil_quench && (
      oil_quench.temperature?.value || 
      oil_quench.inerting_delay?.value || 
      oil_quench.dripping_time?.value || 
      oil_quench.pressure ||
      oil_quench.inerting_pressure ||
      (Array.isArray(oil_quench.speed_parameters) && oil_quench.speed_parameters.length > 0)
    )) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faThermometerHalf} />
            Oil Quench Parameters
          </h4>
          
          <div style={{ 
            background: '#f8f9fa', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
            marginBottom: '15px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#e3f2fd' }}>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#1565c0' }}>Parameter</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {oil_quench.temperature?.value && (
                  <tr>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Temperature</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.temperature.value} {oil_quench.temperature.unit || '°C'}
                    </td>
                  </tr>
                )}
                {oil_quench.inerting_delay?.value && (
                  <tr>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Inerting Delay</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.inerting_delay.value} {oil_quench.inerting_delay.unit || 's'}
                    </td>
                  </tr>
                )}
                {oil_quench.dripping_time?.value && (
                  <tr>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Dripping Time</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.dripping_time.value} {oil_quench.dripping_time.unit || 's'}
                    </td>
                  </tr>
                )}
                {(oil_quench.pressure || oil_quench.inerting_pressure) && (
                  <tr>
                    <td style={{ padding: '10px 8px', border: '1px solid #e0e0e0' }}>Inerting Pressure</td>
                    <td style={{ padding: '10px 8px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '600' }}>
                      {oil_quench.pressure || oil_quench.inerting_pressure}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {Array.isArray(oil_quench.speed_parameters) && oil_quench.speed_parameters.length > 0 && (
            <div>
              <h5 style={{ 
                fontSize: '16px', 
                marginBottom: '10px', 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                Speed Parameters
              </h5>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#e3f2fd' }}>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Step</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Speed</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oil_quench.speed_parameters.map((param, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '500' }}>
                          {param.step || index + 1}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.speed || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.duration || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    } else if (gas_quench && (
      (Array.isArray(gas_quench.speed_parameters) && gas_quench.speed_parameters.length > 0) ||
      (Array.isArray(gas_quench.pressure_parameters) && gas_quench.pressure_parameters.length > 0)
    )) {
      return (
        <div style={{ marginTop: '15px' }}>
          <h4 style={{ 
            fontSize: '18px', 
            marginBottom: '15px',
            color: '#1976d2',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FontAwesomeIcon icon={faThermometerHalf} />
            Gas Quench Parameters
          </h4>
          
          {Array.isArray(gas_quench.speed_parameters) && gas_quench.speed_parameters.length > 0 && (
            <div>
              <h5 style={{ 
                fontSize: '16px', 
                marginBottom: '10px', 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                Speed Parameters
              </h5>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#e3f2fd' }}>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Step</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Speed</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gas_quench.speed_parameters.map((param, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '500' }}>
                          {param.step || index + 1}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.speed || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.duration || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {Array.isArray(gas_quench.pressure_parameters) && gas_quench.pressure_parameters.length > 0 && (
            <div>
              <h5 style={{ 
                fontSize: '16px', 
                marginBottom: '10px', 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FontAwesomeIcon icon={faTachometerAlt} />
                Pressure Parameters
              </h5>
              <div style={{ 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#e3f2fd' }}>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Step</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Pressure (mb)</th>
                      <th style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '600', color: '#1565c0' }}>Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gas_quench.pressure_parameters.map((param, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0', fontWeight: '500' }}>
                          {param.step || index + 1}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.pressure || '-'}
                        </td>
                        <td style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          {param.duration || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#666',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px dashed #ccc'
        }}>
          <FontAwesomeIcon icon={faThermometerHalf} style={{ fontSize: '32px', color: '#ccc', marginBottom: '10px' }} />
          <p style={{ margin: 0, fontSize: '16px' }}>No quench data available</p>
        </div>
      );
    }
  };

  // Calcul des estimations de hauteur pour le découpage intelligent
  const estimateSectionHeight = (sectionType, data) => {
    switch (sectionType) {
      case 'generalParams':
        return 200;
      
      case 'thermalCycle':
        if (!data || !data.thermal_cycle) return 0;
        const thermalRows = data.thermal_cycle.length;
        return 250 + (thermalRows * 35);
      
      case 'chemicalCycle':
        if (!data || !data.chemical_cycle) return 0;
        const chemicalRows = data.chemical_cycle.length;
        return 250 + (chemicalRows * 35);
      
      case 'chart':
        return 500;
      
      case 'quench':
        if (!quenchData || (!quenchData.oil_quench && !quenchData.gas_quench)) return 0;
        let quenchHeight = 200;
        
        if (quenchData.oil_quench && Object.keys(quenchData.oil_quench).length > 0) {
          quenchHeight += 300;
          if (quenchData.oil_quench.speed_parameters?.length > 0) {
            quenchHeight += 150 + (quenchData.oil_quench.speed_parameters.length * 30);
          }
        }
        
        if (quenchData.gas_quench && Object.keys(quenchData.gas_quench).length > 0) {
          quenchHeight += 300;
          if (quenchData.gas_quench.speed_parameters?.length > 0) {
            quenchHeight += 150 + (quenchData.gas_quench.speed_parameters.length * 30);
          }
          if (quenchData.gas_quench.pressure_parameters?.length > 0) {
            quenchHeight += 150 + (quenchData.gas_quench.pressure_parameters.length * 30);
          }
        }
        
        return quenchHeight;
      
      default:
        return 150;
    }
  };

  // Logique de découpage intelligent en pages
  const organizeContentInPages = useMemo(() => {
    if (Object.keys(recipeData).length === 0) {
      return [{
        sections: ['empty'],
        estimatedHeight: 400
      }];
    }

    const maxPageHeight = 800;
    const headerHeight = 120;
    const footerHeight = 60;
    const availableHeight = maxPageHeight - headerHeight - footerHeight;
    
    const sections = [
      { type: 'generalParams', data: recipeData },
      { type: 'thermalCycle', data: recipeData },
      { type: 'chemicalCycle', data: recipeData },
      { type: 'chart', data: recipeData },
      { type: 'quench', data: recipeData }
    ];

    const pages = [];
    let currentPage = { sections: [], estimatedHeight: 0 };
    
    sections.forEach(section => {
      const sectionHeight = estimateSectionHeight(section.type, section.data);
      
      if (sectionHeight === 0) return;
      
      if (currentPage.estimatedHeight + sectionHeight > availableHeight && currentPage.sections.length > 0) {
        pages.push(currentPage);
        currentPage = { sections: [], estimatedHeight: 0 };
      }
      
      currentPage.sections.push(section.type);
      currentPage.estimatedHeight += sectionHeight + 30;
    });
    
    if (currentPage.sections.length > 0) {
      pages.push(currentPage);
    }
    
    return pages.length > 0 ? pages : [{ sections: ['empty'], estimatedHeight: 400 }];
  }, [recipeData, quenchData]);

  // Fonction pour créer le header de page
  const createPageHeader = (pageIndex, isFirstPage = false) => (
    <div key={`header-${pageIndex}`}>
      {isFirstPage ? (
        <SectionHeader
          title="RECIPE"
          subtitle={`Recipe ${recipeData?.number || 'N/A'}`}
          icon={faFlask}
          testData={testData}
          clientData={clientData}
          sectionType="recipe"
          showSubtitle={true}
        />
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #f44336 0%, #ff9800 100%)',
          borderRadius: '8px',
          padding: '15px 25px',
          marginBottom: '25px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faFlask} />
            RECIPE (continued)
            <span style={{ fontSize: '16px', opacity: 0.9, marginLeft: 'auto' }}>
              Page {pageIndex + 1}
            </span>
          </h2>
        </div>
      )}
    </div>
  );

  // Fonction pour créer le footer de page
  const createPageFooter = (pageIndex, totalPages) => (
    <div key={`footer-${pageIndex}`} style={{
      marginTop: 'auto',
      paddingTop: '20px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#666'
    }}>
      <div>
        <strong>Recipe Parameters</strong> - ECM Industrial Analysis
      </div>
      <div>
        {new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
      <div>
        Page {pageIndex + 1} of {totalPages}
      </div>
    </div>
  );

  // Fonctions de rendu pour chaque section
  const renderGeneralParams = () => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #ffebee'
    }}>
      <h3 style={{ 
        color: '#d32f2f', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FontAwesomeIcon icon={faCogs} style={{ color: '#f44336' }} />
        General Parameters
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        <div style={{ 
          background: '#fffbf0', 
          borderRadius: '8px', 
          padding: '15px',
          border: '1px solid #ffe0b2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faTachometerAlt} style={{ fontSize: '16px', color: '#f57c00' }} />
            <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Wait Pressure</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {recipeData.wait_pressure?.value || '-'} {recipeData.wait_pressure?.unit || ''}
          </div>
        </div>
        
        <div style={{ 
          background: '#fffbf0', 
          borderRadius: '8px', 
          padding: '15px',
          border: '1px solid #ffe0b2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: '16px', color: '#f57c00' }} />
            <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Wait Time</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {recipeData.wait_time?.value || '-'} {recipeData.wait_time?.unit || ''}
          </div>
        </div>
        
        <div style={{ 
          background: '#fffbf0', 
          borderRadius: '8px', 
          padding: '15px',
          border: '1px solid #ffe0b2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faThermometerHalf} style={{ fontSize: '16px', color: '#f57c00' }} />
            <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Cell Temperature</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {recipeData.cell_temp?.value || '-'} {recipeData.cell_temp?.unit || ''}
          </div>
        </div>
        
        <div style={{ 
          background: '#fffbf0', 
          borderRadius: '8px', 
          padding: '15px',
          border: '1px solid #ffe0b2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: '16px', color: '#f57c00' }} />
            <span style={{ fontWeight: '700', color: '#e65100', fontSize: '14px' }}>Thermal Duration</span>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
            {totalThermalDuration || '-'} min
          </div>
        </div>
      </div>
    </div>
  );

  const renderThermalCycle = () => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #fff8e1'
    }}>
      <h3 style={{ 
        color: '#f57c00', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FontAwesomeIcon icon={faThermometerHalf} style={{ color: '#ff9800' }} />
        Thermal Cycle
      </h3>
      
      <div style={{ 
        background: '#fafafa', 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#ffe0b2' }}>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Step</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Ramp Type</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Temperature (°C)</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#e65100' }}>Duration (min)</th>
            </tr>
          </thead>
          <tbody>
            {recipeData.thermal_cycle?.map((step, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '500' }}>{step.step}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: step.ramp === 'up' ? '#ffebee' : step.ramp === 'down' ? '#e3f2fd' : '#fff3e0',
                    color: step.ramp === 'up' ? '#d32f2f' : step.ramp === 'down' ? '#1976d2' : '#f57c00'
                  }}>
                    {step.ramp === 'up' ? 'Heating' : 
                     step.ramp === 'down' ? 'Cooling' : 
                     step.ramp === 'continue' ? 'Hold' : step.ramp}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: '600', color: '#333' }}>{step.setpoint}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center', color: '#666' }}>{step.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChemicalCycle = () => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #f3e5f5'
    }}>
      <h3 style={{ 
        color: '#7b1fa2', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FontAwesomeIcon icon={faFlask} style={{ color: '#ab47bc' }} />
        Chemical Cycle
      </h3>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#fafafa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <div style={{ fontWeight: '600', color: '#7b1fa2', marginBottom: '5px' }}>Program Duration:</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>
          {Math.floor(totalChemicalDuration / 60)} min {totalChemicalDuration % 60} s
          {recipeData.wait_time?.value && (
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
              {' '}(including {recipeData.wait_time.value} {recipeData.wait_time.unit} wait time)
            </span>
          )}
        </div>
      </div>
      
      <div style={{ 
        background: '#fafafa', 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '1px solid #e0e0e0'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#e1bee7' }}>
              <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Step</th>
              <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Duration (s)</th>
              <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Pressure (mbar)</th>
              {recipeData.selected_gas1 && (
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>
                  {recipeData.selected_gas1} (Nl/h)
                </th>
              )}
              {recipeData.selected_gas2 && (
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>
                  {recipeData.selected_gas2} (Nl/h)
                </th>
              )}
              {recipeData.selected_gas3 && (
                <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>
                  {recipeData.selected_gas3} (Nl/h)
                </th>
              )}
              <th style={{ padding: '12px 6px', textAlign: 'center', fontWeight: '600', color: '#4a148c' }}>Turbine</th>
            </tr>
          </thead>
          <tbody>
            {recipeData.chemical_cycle?.map((step, index) => (
              <tr key={index} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                <td style={{ padding: '10px 6px', textAlign: 'center', fontWeight: '500' }}>{step.step}</td>
                <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>{step.time}</td>
                <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>{step.pressure}</td>
                {recipeData.selected_gas1 && (
                  <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>
                    {step.gases?.find(g => g.gas === recipeData.selected_gas1)?.debit || '-'}
                  </td>
                )}
                {recipeData.selected_gas2 && (
                  <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>
                    {step.gases?.find(g => g.gas === recipeData.selected_gas2)?.debit || '-'}
                  </td>
                )}
                {recipeData.selected_gas3 && (
                  <td style={{ padding: '10px 6px', textAlign: 'center', color: '#666' }}>
                    {step.gases?.find(g => g.gas === recipeData.selected_gas3)?.debit || '-'}
                  </td>
                )}
                <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    background: step.turbine ? '#e8f5e8' : '#ffebee',
                    color: step.turbine ? '#2e7d32' : '#d32f2f'
                  }}>
                    {step.turbine ? 'Yes' : 'No'}
                  </span>
                </td>
              </tr>
            ))}
            <tr style={{ backgroundColor: '#e1bee7', fontWeight: 'bold' }}>
              <td style={{ padding: '12px 6px', textAlign: 'center', color: '#4a148c' }}>Total</td>
              <td style={{ padding: '12px 6px', textAlign: 'center', color: '#4a148c' }}>
                {recipeData.chemical_cycle?.reduce((total, step) => total + parseInt(step.time || 0), 0)} s
              </td>
              <td colSpan={recipeData.selected_gas3 ? 5 : recipeData.selected_gas2 ? 4 : 3} 
                  style={{ padding: '12px 6px', textAlign: 'center', color: '#4a148c' }}>
                {Math.floor(totalChemicalDuration / 60)} min {totalChemicalDuration % 60} s (total including wait time)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChart = () => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #e8f5e8'
    }}>
      <h3 style={{ 
        color: '#2e7d32', 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <FontAwesomeIcon icon={faChartLine} style={{ color: '#4caf50' }} />
        Process Parameters Evolution
      </h3>
      
      <div style={{ 
        height: '350px',
        background: '#fafafa',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #e0e0e0'
      }}>
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div style={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#666',
            border: '1px dashed #ccc',
            borderRadius: '8px',
            background: 'white'
          }}>
            <FontAwesomeIcon icon={faChartLine} style={{ fontSize: '48px', color: '#ccc', marginBottom: '15px' }} />
            <span style={{ fontSize: '16px' }}>Insufficient data to generate chart</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderQuench = () => renderQuenchData();

  const renderEmptyState = () => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '60px',
      textAlign: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px dashed #dee2e6'
    }}>
      <FontAwesomeIcon icon={faFlask} style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }} />
      <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>No recipe data available</p>
    </div>
  );

  // Fonction de rendu de section par type
  const renderSectionByType = (sectionType) => {
    switch (sectionType) {
      case 'generalParams': return renderGeneralParams();
      case 'thermalCycle': return renderThermalCycle();
      case 'chemicalCycle': return renderChemicalCycle();
      case 'chart': return renderChart();
      case 'quench': return renderQuench();
      case 'empty': return renderEmptyState();
      default: return null;
    }
  };

  // Rendu principal avec découpage intelligent
  return (
    <>
      {organizeContentInPages.map((page, pageIndex) => (
        <div key={`recipe-page-${pageIndex}`} style={{ 
          minHeight: '297mm',
          maxHeight: '297mm', 
          width: '210mm',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '10mm',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pageBreakAfter: pageIndex < organizeContentInPages.length - 1 ? 'always' : 'auto',
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header de page */}
          {createPageHeader(pageIndex, pageIndex === 0)}
          
          {/* Contenu de la page */}
          <div style={{ 
            flex: 1,
            display: 'grid', 
            gap: '20px',
            alignContent: 'start',
            overflow: 'hidden'
          }}>
            {page.sections.map((sectionType, sectionIndex) => (
              <div key={`${sectionType}-${sectionIndex}`}>
                {renderSectionByType(sectionType)}
              </div>
            ))}
          </div>
          
          {/* Footer de page */}
          {createPageFooter(pageIndex, organizeContentInPages.length)}
        </div>
      ))}
    </>
  );
};

export default RecipeSection;
