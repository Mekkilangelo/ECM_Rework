import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, Nav, Table, Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import testService from '../../../../../services/testService';

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

const ResultCurveSection = ({
  result,
  resultIndex,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  hardnessUnitOptions,
  loading,
  selectStyles,
  test,
  formData,
  parentId,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('curve');
  
  // Structure de données pour les points de mesure
  const [dataPoints, setDataPoints] = useState(() => {
    // Initialiser à partir des données existantes ou créer un tableau vide
    if (result.curveData && result.curveData.points) {
      return [...result.curveData.points];
    }
    return [];
  });
  
  // État séparé pour l'affichage du tableau (données triées)
  const [displayPoints, setDisplayPoints] = useState(() => {
    if (result.curveData && result.curveData.points) {
      return [...result.curveData.points].sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distA - distB;
      });
    }
    return [];
  });
  
  // Ajout du state pour le pas d'incrémentation
  const [stepValue, setStepValue] = useState(0.1);
  const [specData, setSpecData] = useState(null);
  
  // Récupérer l'unité de dureté à partir des données ECD
  const hardnessUnit = result.ecd?.hardnessUnit || "HV";
  
  // Effet pour charger les spécifications ECD depuis l'API
  useEffect(() => {
    const fetchSpecData = async () => {
      if (test && test.id && parentId) {
        try {
          // Appeler la nouvelle méthode du service pour récupérer les spécifications
          const response = await testService.getTestSpecs(test.id, parentId);
          if (response.data && response.data.ecdPoints) {
            // Utiliser directement les points formatés par le backend
            setSpecData(response.data.ecdPoints);
          }
        } catch (error) {
          console.error(t('tests.after.results.resultCurve.specError'), error);
        }
      }
    };
    
    fetchSpecData();
  }, [test, parentId, t]);
  
  // Mettre à jour le formData parent avec les nouvelles données
  const updateParentFormData = (newPoints) => {
    const updatedResults = [...formData.resultsData.results];
    updatedResults[resultIndex].curveData = { points: newPoints };
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
  const addDataPoint = () => {
    let nextDistance = '';
    // Calculer la prochaine distance en ajoutant le pas à la dernière valeur
    if (dataPoints.length > 0) {
      const sortedPoints = [...dataPoints].sort((a, b) => {
        const distA = parseFloat(a.distance) || 0;
        const distB = parseFloat(b.distance) || 0;
        return distB - distA; // Tri décroissant pour avoir la plus grande valeur en premier
      });
      const lastDistance = parseFloat(sortedPoints[0].distance) || 0;
      nextDistance = (lastDistance + stepValue).toFixed(2); // Arrondir à 2 décimales
    }
    
    const newPoint = {
      distance: nextDistance,
      flankHardness: '',
      rootHardness: ''
    };
    
    const newPoints = [...dataPoints, newPoint];
    setDataPoints(newPoints);
    setDisplayPoints(newPoints);
    updateParentFormData(newPoints);
  };
  
  // Supprimer un point de données
  const removeDataPoint = (index) => {
    const newPoints = dataPoints.filter((_, i) => i !== index);
    setDataPoints(newPoints);
    setDisplayPoints(newPoints);
    updateParentFormData(newPoints);
  };
  
  // Préparer les données pour le graphique
  const prepareChartData = () => {
    // Utiliser des points triés pour le graphique
    const sortedPoints = [...dataPoints].sort((a, b) => {
      const distA = parseFloat(a.distance) || 0;
      const distB = parseFloat(b.distance) || 0;
      return distA - distB;
    });
    
    // Filtrer les points valides pour les courbes
    const flankPoints = sortedPoints.filter(p => p.distance && p.flankHardness);
    const rootPoints = sortedPoints.filter(p => p.distance && p.rootHardness);
    
    // Créer les datasets pour les mesures
    const datasets = [
      {
        label: t('tests.after.results.resultCurve.flankHardness'),
        data: flankPoints.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.flankHardness)})),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      },
      {
        label: t('tests.after.results.resultCurve.rootHardness'),
        data: rootPoints.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.rootHardness)})),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ];
    
    // Ajouter la courbe de spécification si disponible
    if (specData) {
      datasets.push({
        label: t('tests.after.results.resultCurve.specification'),
        data: specData.map(p => ({x: parseFloat(p.distance), y: parseFloat(p.value)})),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderDash: [5, 5],
        tension: 0
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
          {/* Champ d'unité de dureté supprimé ici */}
          
          {/* Nouveau champ pour le pas d'incrémentation */}
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
                <th style={{ width: '25%' }}>{t('tests.after.results.resultCurve.distanceMm')}</th>
                <th style={{ width: '30%' }}>{t('tests.after.results.resultCurve.flankHardness')}</th>
                <th style={{ width: '30%' }}>{t('tests.after.results.resultCurve.rootHardness')}</th>
                <th style={{ width: '15%' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {dataPoints.map((point, index) => (
                <tr key={`point-${index}`}>
                  <td>
                    <Form.Control
                      type="number"
                      name={`resultsData.results[${resultIndex}].curveData.points[${index}].distance`}
                      value={point.distance}
                      onChange={(e) => handlePointChange(index, 'distance', e.target.value)}
                      onBlur={handleBlur}
                      placeholder={t('tests.after.results.resultCurve.distance')}
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      name={`resultsData.results[${resultIndex}].curveData.points[${index}].flankHardness`}
                      value={point.flankHardness || ''}
                      onChange={(e) => handlePointChange(index, 'flankHardness', e.target.value)}
                      onBlur={handleBlur}
                      placeholder={t('tests.after.results.resultCurve.flankHardnessValue')}
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <Form.Control
                      type="number"
                      value={point.rootHardness || ''}
                      name={`resultsData.results[${resultIndex}].curveData.points[${index}].rootHardness`}
                      onChange={(e) => handlePointChange(index, 'rootHardness', e.target.value)}
                      onBlur={handleBlur}
                      placeholder={t('tests.after.results.resultCurve.rootHardnessValue')}
                      disabled={loading}
                    />
                  </td>
                  <td className="text-center">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeDataPoint(index)}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="text-end">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={addDataPoint}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.resultCurve.addPoint')}
            </Button>
          </div>
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default ResultCurveSection;
