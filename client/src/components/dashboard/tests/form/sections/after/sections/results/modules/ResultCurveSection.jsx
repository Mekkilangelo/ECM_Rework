import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Nav, Table, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import testService from '../../../../../../../../../services/testService';

// Enregistrement des composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Palette de 6 couleurs distinctes pour les courbes
const colorPalette = [
  { borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' },   // Rose
  { borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.5)' },   // Turquoise
  { borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)' },   // Bleu
  { borderColor: 'rgb(255, 159, 64)', backgroundColor: 'rgba(255, 159, 64, 0.5)' },   // Orange
  { borderColor: 'rgb(153, 102, 255)', backgroundColor: 'rgba(153, 102, 255, 0.5)' }, // Violet
  { borderColor: 'rgb(255, 205, 86)', backgroundColor: 'rgba(255, 205, 86, 0.5)' }    // Jaune
];

const ResultCurveSection = forwardRef(({
  result,
  resultIndex,
  sampleIndex,  // Ajout du sampleIndex
  handleChange,
  handleSelectChange,
  getSelectedOption,
  hardnessUnitOptions,
  loading,
  selectStyles,
  test,
  formData,
  parentId,
  viewMode = false,
  readOnlyFieldStyle = {}
}, ref) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('curve');
    // Structure de données pour les points de mesure
  const [dataPoints, setDataPoints] = useState([]);
  
  // État séparé pour l'affichage du tableau (données triées)
  const [displayPoints, setDisplayPoints] = useState([]);
  
  // Effet pour synchroniser les données quand result change
  useEffect(() => {
    if (result && result.curveData && result.curveData.points) {
      console.log('Mise à jour des données de courbe:', result.curveData.points);
      setDataPoints([...result.curveData.points]);
      
      // Trier les points pour l'affichage
      const sortedPoints = [...result.curveData.points].sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distA - distB;
      });
      setDisplayPoints(sortedPoints);
    } else {
      console.log('Aucune donnée de courbe trouvée dans result:', result);
      setDataPoints([]);
      setDisplayPoints([]);
    }
  }, [result]);
    // Ajout du state pour le pas d'incrémentation
  const [stepValue, setStepValue] = useState(0.1);
  const [specData, setSpecData] = useState([]);
  
  // Exposer les méthodes au composant parent via ref
  useImperativeHandle(ref, () => ({
    addDataPoint,
    addMultipleDataPoints,
    removeDataPoint
  }));

  // Récupérer l'unité de dureté à partir des données ECD
  const hardnessUnit = result.ecd?.hardnessUnit || "HV";
    // Positions ECD disponibles pour les colonnes
  const ecdPositions = result.ecd?.ecdPoints || [];
  
  // Log pour debugger les colonnes dynamiques
  console.log(`ResultCurveSection - Positions ECD disponibles:`, ecdPositions.length, ecdPositions.map(p => p.name));
    // Effet pour charger les spécifications ECD depuis l'API
  useEffect(() => {
    const fetchSpecData = async () => {
      if (test && test.id && parentId) {
        try {
          // Appeler la nouvelle méthode du service pour récupérer les spécifications
          const response = await testService.getTestSpecs(test.id, parentId);
          console.log('Réponse du service getTestSpecs pour ResultCurveSection:', response);
          
          let specifications = null;
          
          // Extraction des spécifications selon la structure de réponse
          if (response && response.specifications) {
            specifications = typeof response.specifications === 'string' 
              ? JSON.parse(response.specifications) 
              : response.specifications;
          } else if (response && response.data && response.data.specifications) {
            specifications = typeof response.data.specifications === 'string'
              ? JSON.parse(response.data.specifications)
              : response.data.specifications;
          }
          
          if (specifications) {
            const specLines = [];
            
            // Nouveau format : traitement des spécifications ECD multiples
            if (specifications.ecdSpecs && Array.isArray(specifications.ecdSpecs)) {
              console.log('Spécifications ECD multiples trouvées:', specifications.ecdSpecs);
              
              specifications.ecdSpecs.forEach((ecdSpec, index) => {
                if (ecdSpec.hardness && (ecdSpec.depthMin !== undefined || ecdSpec.depthMax !== undefined)) {
                  const depthMin = parseFloat(ecdSpec.depthMin) || 0.0;
                  const depthMax = parseFloat(ecdSpec.depthMax) || 1.0;
                  const hardnessValue = parseFloat(ecdSpec.hardness);
                  
                  // Créer une ligne de spécification pour cette ECD
                  const specLine = {
                    name: ecdSpec.name || `ECD ${index + 1}`,
                    points: [
                      { distance: depthMin, value: hardnessValue },
                      { distance: depthMax, value: hardnessValue }
                    ],
                    unit: ecdSpec.hardnessUnit || 'HV'
                  };
                  
                  specLines.push(specLine);
                }
              });
            }
            // Format ancien : compatibilité avec l'ancien format ECD unique
            else if (specifications.ecd && specifications.ecd.hardness) {
              console.log('Spécification ECD unique trouvée (format ancien):', specifications.ecd);
              
              const depthMin = parseFloat(specifications.ecd.depthMin) || 0.0;
              const depthMax = parseFloat(specifications.ecd.depthMax) || 1.0;
              const hardnessValue = parseFloat(specifications.ecd.hardness);
              
              const specLine = {
                name: 'ECD',
                points: [
                  { distance: depthMin, value: hardnessValue },
                  { distance: depthMax, value: hardnessValue }
                ],
                unit: specifications.ecd.unit || 'HV'
              };
              
              specLines.push(specLine);
            }
            
            console.log('Lignes de spécification générées:', specLines);
            setSpecData(specLines);
          } else {
            console.warn('Aucune spécification trouvée dans la réponse');
            setSpecData([]);
          }
        } catch (error) {
          console.error(t('tests.after.results.resultCurve.specError'), error);
          setSpecData([]);
        }
      }
    };
    
    fetchSpecData();
  }, [test, parentId, t]);
    // Mettre à jour le formData parent avec les nouvelles données
  const updateParentFormData = (newPoints) => {
    const updatedResults = [...formData.resultsData.results];
    updatedResults[resultIndex].samples[sampleIndex].curveData = { points: newPoints };
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };
  
  // Mise à jour d'un point de données (pendant la saisie)
  const handlePointChange = (index, field, value) => {
    const newPoints = [...dataPoints];
    newPoints[index][field] = value;
    setDataPoints(newPoints);
    updateParentFormData(newPoints);
  };
  
  // Gestion du changement de la valeur du pas
  const handleStepChange = (e) => {
    setStepValue(parseFloat(e.target.value) || 0.1);
  };
  
  // Trier les données après la fin de la saisie
  const handleBlur = () => {
    // Trier les points par distance
    const sorted = [...dataPoints].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
    // Mettre à jour l'affichage
    setDisplayPoints(sorted);
    // Mettre à jour les données
    setDataPoints(sorted);
    updateParentFormData(sorted);
  };
    // Ajouter un nouveau point de données avec incrémentation automatique
  const addDataPoint = (customData = null) => {
    let nextDistance = '';
    // Calculer la prochaine distance en ajoutant le pas à la dernière valeur
    if (dataPoints.length > 0 && !customData) {
      const sortedPoints = [...dataPoints].sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distB - distA; // Tri décroissant pour avoir la plus grande valeur en premier
      });
      const lastDistance = parseFloat(sortedPoints[0].distance) || 0;
      nextDistance = (lastDistance + stepValue).toFixed(2); // Arrondir à 2 décimales
    }
    
    // Créer un nouveau point avec champs pour toutes les positions ECD
    const newPoint = {
      distance: customData ? customData.distance : nextDistance
    };
      // Ajouter un champ pour chaque position ECD
    ecdPositions.forEach(position => {
      const fieldName = `hardness_${position.name.replace(/\s+/g, '_').toLowerCase()}`;
      const positionKey = position.name.toLowerCase();
      
      // Créer les deux formats
      newPoint[fieldName] = customData && customData[fieldName] ? customData[fieldName] : '';
      newPoint[positionKey] = customData && customData[positionKey] ? customData[positionKey] : '';
    });
    
    // Pour la compatibilité avec le format existant, conserver les champs flankHardness et rootHardness
    newPoint.flankHardness = customData && customData.flankHardness ? customData.flankHardness : '';
    newPoint.rootHardness = customData && customData.rootHardness ? customData.rootHardness : '';
    
    // Si des données personnalisées sont fournies, les utiliser
    if (customData) {
      Object.keys(customData).forEach(key => {
        if (key !== 'distance') {
          newPoint[key] = customData[key];
        }
      });
    }
    
    // Utiliser le callback de setState pour éviter des mises à jour multiples
    setDataPoints(prevPoints => {
      const newPoints = [...prevPoints, newPoint];
      setDisplayPoints(newPoints);
      updateParentFormData(newPoints);
      return newPoints;
    });
  };
    // Ajouter plusieurs points de données en une fois (pour l'import Excel)
  const addMultipleDataPoints = (pointsData) => {
    if (!pointsData || pointsData.length === 0) return;
    
    console.log('Ajout de plusieurs points de courbe:', pointsData);
    console.log('ecdPositions disponibles lors de l\'ajout:', ecdPositions.length, ecdPositions.map(p => p.name));
    
    const newPoints = pointsData.map(pointData => {
      const newPoint = {
        distance: pointData.distance || ''
      };
      
      console.log('Traitement point avec données:', Object.keys(pointData));
        // Ajouter un champ pour chaque position ECD
      ecdPositions.forEach(position => {
        const fieldName = `hardness_${position.name.replace(/\s+/g, '_').toLowerCase()}`;
        const positionKey = position.name.toLowerCase();
        const exactPositionKey = position.name; // Clé exacte avec la casse originale
        
        console.log(`Création champs pour position "${position.name}": ${fieldName}, ${positionKey}, ${exactPositionKey}`);
        
        // Chercher la valeur dans plusieurs formats possibles
        const value = pointData[fieldName] || pointData[positionKey] || pointData[exactPositionKey] || '';
        
        // Créer les deux formats
        newPoint[fieldName] = value;
        newPoint[positionKey] = value;
        
        if (value) {
          console.log(`Valeur trouvée pour ${position.name}:`, value);
        } else {
          console.log(`Aucune valeur trouvée pour ${position.name} dans:`, Object.keys(pointData));
        }
      });
      
      // Pour la compatibilité avec le format existant
      newPoint.flankHardness = pointData.flankHardness || pointData.Flank || '';
      newPoint.rootHardness = pointData.rootHardness || pointData.Root || '';
      
      // Ajouter tous les autres champs personnalisés
      Object.keys(pointData).forEach(key => {
        if (!newPoint.hasOwnProperty(key)) {
          newPoint[key] = pointData[key];
        }
      });
      
      return newPoint;
    });
    
    // Fusionner avec les points existants
    setDataPoints(prevPoints => {
      const allPoints = [...prevPoints, ...newPoints];
      // Trier par distance
      const sortedPoints = allPoints.sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distA - distB;
      });
      
      setDisplayPoints(sortedPoints);
      updateParentFormData(sortedPoints);
      return sortedPoints;
    });
    
    console.log(`${newPoints.length} points de courbe ajoutés avec succès`);
  };

  // Supprimer un point de données
  const removeDataPoint = (index) => {
    const newPoints = dataPoints.filter((_, i) => i !== index);
    setDataPoints(newPoints);
    setDisplayPoints(newPoints);
    updateParentFormData(newPoints);
  };
  
  // Génère un nom de champ unique pour chaque position ECD
  const getFieldNameForPosition = (positionName) => {
    return `hardness_${positionName.replace(/\s+/g, '_').toLowerCase()}`;
  };
    // Obtenir la valeur de dureté pour une position et un point donné
  const getHardnessForPosition = (point, positionName) => {
    const fieldName = getFieldNameForPosition(positionName);
    
    // Si le champ avec le format hardness_xxx existe, utiliser cette valeur
    if (point[fieldName] !== undefined) {
      return point[fieldName];
    }
    
    // Essayer avec la clé directe (nom de position en minuscules)
    const positionKey = positionName.toLowerCase();
    if (point[positionKey] !== undefined) {
      return point[positionKey];
    }
    
    // Compatibilité avec l'ancien format - vérifier les cas spéciaux
    if (positionName.toLowerCase().includes('flanc') && point.flankHardness !== undefined) {
      return point.flankHardness;
    }
    if (positionName.toLowerCase().includes('pied') && point.rootHardness !== undefined) {
      return point.rootHardness;
    }
    
    return '';
  };
    // Mettre à jour la valeur de dureté pour une position et un point donné
  const setHardnessForPosition = (index, positionName, value) => {
    const fieldName = getFieldNameForPosition(positionName);
    const positionKey = positionName.toLowerCase();
    
    // Mettre à jour avec les deux formats pour assurer la compatibilité
    handlePointChange(index, fieldName, value);
    handlePointChange(index, positionKey, value);
    
    // Compatibilité avec l'ancien format - mettre à jour les champs spéciaux
    if (positionName.toLowerCase().includes('flanc')) {
      handlePointChange(index, 'flankHardness', value);
    }
    if (positionName.toLowerCase().includes('pied')) {
      handlePointChange(index, 'rootHardness', value);
    }
  };
  
  // Préparer les données pour le graphique
  const prepareChartData = () => {
    // Utiliser des points triés pour le graphique
    const sortedPoints = [...dataPoints].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
    
    // Créer un dataset pour chaque position ECD
    const datasets = ecdPositions.map((position, index) => {
      const positionName = position.name;
      const colorIndex = index % colorPalette.length; // Utiliser l'opérateur modulo pour recycler les couleurs si plus de 6 positions
      
      // Filtrer les points valides pour cette position
      const validPoints = sortedPoints.filter(p => 
        p.distance && getHardnessForPosition(p, positionName)
      );
      
      return {
        label: positionName,
        data: validPoints.map(p => ({
          x: parseFloat(p.distance), 
          y: parseFloat(getHardnessForPosition(p, positionName))
        })),
        borderColor: colorPalette[colorIndex].borderColor,
        backgroundColor: colorPalette[colorIndex].backgroundColor,
        tension: 0.1
      };
    });
    
    // Pour maintenir la compatibilité avec le format d'affichage précédent
    if (datasets.length === 0 && (
      sortedPoints.some(p => p.flankHardness) || 
      sortedPoints.some(p => p.rootHardness)
    )) {
      // Ajouter les anciens datasets si aucun nouveau n'a été créé
      const flankPoints = sortedPoints.filter(p => p.distance && p.flankHardness);
      const rootPoints = sortedPoints.filter(p => p.distance && p.rootHardness);
      
      if (flankPoints.length > 0) {
        datasets.push({
          label: t('tests.after.results.resultCurve.flankHardness'),
          data: flankPoints.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.flankHardness)})),
          borderColor: colorPalette[0].borderColor,
          backgroundColor: colorPalette[0].backgroundColor,
          tension: 0.1
        });
      }
      
      if (rootPoints.length > 0) {
        datasets.push({
          label: t('tests.after.results.resultCurve.rootHardness'),
          data: rootPoints.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.rootHardness)})),
          borderColor: colorPalette[1].borderColor,
          backgroundColor: colorPalette[1].backgroundColor,
          tension: 0.1
        });
      }
    }      // Ajouter les courbes de spécification si disponibles
    if (specData && specData.length > 0) {
      console.log('Ajout des données de spécification à la courbe:', specData);
      
      specData.forEach((spec, index) => {
        if (spec.points && spec.points.length > 0) {
          datasets.push({
            label: `${t('tests.after.results.resultCurve.specification')} - ${spec.name}`,
            data: spec.points.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.value)})),
            borderColor: 'rgb(0, 0, 0)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderDash: [5, 5],
            tension: 0,
            pointRadius: 3,
            pointHoverRadius: 5
          });
        }
      });
    }
    
    return {
      datasets
    };
  };
  
  // Options pour le graphique
  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: t('tests.after.results.resultCurve.distanceMm')
        }
      },
      y: {
        title: {
          display: true,
          text: t('tests.after.results.resultCurve.hardnessWithUnit', { unit: hardnessUnit })
        }
      }
    }
  };
  
  // Générer les en-têtes dynamiques pour le tableau
  const renderTableHeaders = () => {
    const headers = [
      <th key="distance" style={{ width: `${25}%` }}>{t('tests.after.results.resultCurve.distanceMm')}</th>
    ];
    
    // Ajouter un en-tête pour chaque position ECD
    ecdPositions.forEach((position, index) => {
      const widthPercentage = ecdPositions.length <= 3 ? 
        Math.floor(60 / ecdPositions.length) : 
        Math.floor(75 / ecdPositions.length);
      
      headers.push(
        <th key={`hardness-${index}`} style={{ width: `${widthPercentage}%` }}>
          {position.name}
        </th>
      );
    });
    
    headers.push(
      <th key="actions" style={{ width: '15%' }}>{t('common.actions')}</th>
    );
    
    return headers;
  };
  
  // Générer les cellules de données pour chaque position
  const renderDataCells = (point, index) => {
    const cells = [
      <td key={`distance-${index}`}>
        <Form.Control
          type="number"
          value={point.distance}
          onChange={(e) => handlePointChange(index, 'distance', e.target.value)}
          onBlur={handleBlur}
          placeholder={t('tests.after.results.resultCurve.distance')}
          disabled={loading || viewMode}
          readOnly={viewMode}
          style={viewMode ? readOnlyFieldStyle : {}}
        />
      </td>
    ];
    
    // Ajouter une cellule pour chaque position ECD
    ecdPositions.forEach((position, posIndex) => {
      const positionName = position.name;
      cells.push(
        <td key={`hardness-${index}-${posIndex}`}>
          <Form.Control
            type="number"
            value={getHardnessForPosition(point, positionName) || ''}
            onChange={(e) => setHardnessForPosition(index, positionName, e.target.value)}
            onBlur={handleBlur}
            placeholder={`${positionName}`}
            disabled={loading || viewMode}
            readOnly={viewMode}
            style={viewMode ? readOnlyFieldStyle : {}}
          />
        </td>
      );
    });
    
    // Ajouter la cellule pour les actions
    cells.push(
      <td key={`actions-${index}`} className="text-center">
        {!viewMode && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => removeDataPoint(index)}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
      </td>
    );
    
    return cells;
  };
  
  // Si aucune position ECD n'est définie, afficher un message
  const noPositionsAlert = () => (
    <div className="alert alert-info mt-3">
      {t('tests.after.results.resultCurve.noPositions', 'Please define ECD positions in the previous section to generate curve data')}
    </div>
  );
  
  return (
    <Tab.Container id="result-curve-tabs" activeKey={activeTab} onSelect={k => setActiveTab(k)}>
      <Nav variant="tabs" className="mb-3">
        <Nav.Item>
          <Nav.Link eventKey="curve">{t('tests.after.results.resultCurve.curve')}</Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link eventKey="data">{t('tests.after.results.resultCurve.data')}</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content>
        <Tab.Pane eventKey="curve">
          <div style={{ height: '400px' }}>
            {dataPoints.length > 0 && (
              <Line data={prepareChartData()} options={chartOptions} />
            )}
          </div>
        </Tab.Pane>
        <Tab.Pane eventKey="data">
          {ecdPositions.length === 0 ? noPositionsAlert() : (
            <>
              <div className="mb-3">
                <div><label>{t('tests.after.results.resultCurve.incrementStep')}</label></div>
                <input
                  type="number"
                  className="form-control"
                  style={{ width: '150px' }}
                  value={stepValue}
                  onChange={handleStepChange}
                  disabled={loading}
                />
              </div>
              <Table responsive bordered size="sm" className="mt-2 mb-3">
                <thead className="bg-light">
                  <tr>
                    {renderTableHeaders()}
                  </tr>
                </thead>
                <tbody>
                  {dataPoints.map((point, index) => (
                    <tr key={`point-${index}`}>
                      {renderDataCells(point, index)}
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="text-end">
                {!viewMode && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={addDataPoint}
                    disabled={loading}
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.resultCurve.addPoint')}
                  </Button>
                )}
              </div>
            </>
          )}
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>  );
});

export default ResultCurveSection;
