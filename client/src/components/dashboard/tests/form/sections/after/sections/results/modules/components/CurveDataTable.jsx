import React, { useState } from 'react';
import { Table, Form, Button, InputGroup, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCog } from '@fortawesome/free-solid-svg-icons';

/**
 * Composant pour afficher et éditer le tableau de données des courbes
 */
const CurveDataTable = ({
  curveData,
  onUpdateDistance,
  onAddDistance,
  onRemoveDistance,
  onUpdateSeriesName,
  onUpdateSeriesValue,
  onAddSeries,
  onRemoveSeries,
  viewMode = false,
  readOnlyFieldStyle = {},
  t,
  // Nouveaux props pour le pas réglable
  distanceStep = 1,
  onDistanceStepChange,
  allowStepConfiguration = true
}) => {
  // État local pour afficher/masquer les paramètres avancés
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Assurer qu'on a toujours des données valides
  const distances = curveData?.distances || [0];
  const series = curveData?.series || [];

  const handleDistanceChange = (index, value) => {
    onUpdateDistance(index, value);
  };

  const handleSeriesNameChange = (seriesIndex, value) => {
    onUpdateSeriesName(seriesIndex, value);
  };

  const handleValueChange = (seriesIndex, distanceIndex, value) => {
    // Permettre les champs vides, ils seront traités comme 0 lors de la sauvegarde
    onUpdateSeriesValue(seriesIndex, distanceIndex, value);
  };

  const handleAddDistance = () => {
    // Utiliser le pas configuré pour calculer la nouvelle distance
    const maxDistance = distances.length > 0 ? Math.max(...distances) : 0;
    const newDistance = maxDistance + distanceStep;
    onAddDistance(newDistance);
  };

  const handleAddSeries = () => {
    const seriesCount = series.length;
    const newSeriesName = `Courbe ${seriesCount + 1}`;
    onAddSeries(newSeriesName);
  };

  // Gérer le changement du pas de distance
  const handleDistanceStepChange = (newStep) => {
    const step = Math.max(0.01, parseFloat(newStep) || 0.01); // Minimum 0.01
    if (onDistanceStepChange) {
      onDistanceStepChange(step);
    }
  };

  return (
    <div className="curve-data-table">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">
          <strong>Données des courbes</strong>
        </h6>
        {!viewMode && (
          <div className="d-flex align-items-center gap-2">
            {/* Bouton pour afficher/masquer les paramètres avancés */}
            {allowStepConfiguration && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                title="Paramètres de distance"
              >
                <FontAwesomeIcon icon={faCog} />
              </Button>
            )}
            
            <div className="btn-group">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleAddDistance}
                title={`Ajouter une distance (+${distanceStep})`}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Distance
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                onClick={handleAddSeries}
                title="Ajouter une colonne"
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Colonne
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Panneau de configuration du pas (affiché conditionnellement) */}
      {!viewMode && showAdvancedSettings && allowStepConfiguration && (
        <div className="mb-3 p-3 bg-light rounded">
          <Row className="align-items-center">
            <Col md={6}>
              <Form.Label className="mb-1">
                <strong>Pas de distance (mm):</strong>
              </Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0.01"
                value={distanceStep}
                onChange={(e) => handleDistanceStepChange(e.target.value)}
                size="sm"
                style={{ maxWidth: '120px' }}
              />
              <Form.Text className="text-muted">
                Minimum: 0.01 mm
              </Form.Text>
            </Col>
            <Col md={6}>
              <small className="text-info">
                <strong>Note:</strong> Ce paramètre sera ignoré lors de l'import Excel. 
                Les distances seront définies par les données importées.
              </small>
            </Col>
          </Row>
        </div>
      )}

      <div className="table-responsive">
        <Table bordered hover className="mb-0">
          <thead className="table-light">
            <tr>
              <th style={{ width: '120px' }}>
                Distance (mm)
              </th>
              {series.map((serie, seriesIndex) => (
                <th key={seriesIndex} style={{ minWidth: '150px' }}>
                  {!viewMode ? (
                    <InputGroup size="sm">
                      <Form.Control
                        type="text"
                        value={serie.name || ''}
                        onChange={(e) => handleSeriesNameChange(seriesIndex, e.target.value)}
                        placeholder="Nom de la colonne"
                        style={viewMode ? readOnlyFieldStyle : {}}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onRemoveSeries(seriesIndex)}
                        title="Supprimer"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </InputGroup>
                  ) : (
                    serie.name || `Série ${seriesIndex + 1}`
                  )}
                </th>
              ))}
              {!viewMode && (
                <th style={{ width: '50px' }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {distances.map((distance, distanceIndex) => (
              <tr key={distanceIndex}>
                <td>
                  {!viewMode ? (
                    <Form.Control
                      type="number"
                      step="0.1"
                      value={distance}
                      onChange={(e) => handleDistanceChange(distanceIndex, e.target.value)}
                      placeholder="0.0"
                      size="sm"
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  ) : (
                    `${distance} mm`
                  )}
                </td>
                {series.map((serie, seriesIndex) => (
                  <td key={seriesIndex}>
                    {!viewMode ? (
                      <Form.Control
                        type="number"
                        step="0.1"
                        value={serie.values[distanceIndex] === 0 ? '' : (serie.values[distanceIndex] || '')}
                        onChange={(e) => handleValueChange(seriesIndex, distanceIndex, e.target.value)}
                        placeholder={`Valeur ${serie.name || `Série ${seriesIndex + 1}`}`}
                        size="sm"
                        style={viewMode ? readOnlyFieldStyle : {}}
                      />
                    ) : (
                      serie.values[distanceIndex] || 0
                    )}
                  </td>
                ))}
                {!viewMode && (
                  <td>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onRemoveDistance(distanceIndex)}
                      title="Supprimer"
                      disabled={distances.length <= 1}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        
        {/* Message d'aide si aucune série */}
        {series.length === 0 && !viewMode && (
          <div className="text-center py-3 bg-light rounded mt-2">
            <small className="text-muted">
              Ajoutez une colonne pour commencer à saisir des données de courbes
            </small>
            <br />
            <Button variant="success" size="sm" onClick={handleAddSeries} className="mt-2">
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Première colonne
            </Button>
          </div>
        )}
      </div>

      {distances.length > 0 && (
        <div className="mt-3 text-muted">
          <small>
            {distances.length} distance(s) × {series.length} série(s) = {distances.length * series.length} point(s) de données
          </small>
        </div>
      )}
    </div>
  );
};

export default CurveDataTable;
