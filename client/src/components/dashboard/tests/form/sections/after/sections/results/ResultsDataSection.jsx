import React, { forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Button, Card, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';
import MicrographsSection from './modules/MicrographsSection';
import ControlLocationSection from './modules/ControlLocationSection';
import ResultCurveSection from './modules/ResultCurveSection';

/**
 * ResultsDataSection - Version simplifiée et nettoyée
 * 
 * Cette version se concentre sur les fonctionnalités de base :
 * - Gestion des résultats et échantillons
 * - Formulaires de base
 * - Structure simple et claire
 * 
 * Les fonctionnalités avancées seront ajoutées progressivement :
 * - Courbes de dureté (ResultCurveSection)
 * - Import Excel
 * - Micrographies et localisation
 */

const ResultsDataSection = forwardRef(({
  formData,
  parentId,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  lengthUnitOptions,
  hardnessUnitOptions,
  handleResultBlocAdd,
  handleResultBlocRemove,
  handleSampleAdd,
  handleSampleRemove,
  loading,
  selectStyles,
  test,
  handleFileAssociationNeeded,
  viewMode = false,
  readOnlyFieldStyle = {}
}, ref) => {
  const { t } = useTranslation();

  // S'assurer que le tableau de résultats existe
  const results = formData.resultsData?.results || [];

  // Fonctions de gestion des résultats
  const handleResultChange = (resultIndex, field, value) => {
    const updatedResults = [...results];
    updatedResults[resultIndex] = { ...updatedResults[resultIndex], [field]: value };
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  const handleSampleChange = (resultIndex, sampleIndex, field, value) => {
    const updatedResults = [...results];
    updatedResults[resultIndex].samples[sampleIndex] = { 
      ...updatedResults[resultIndex].samples[sampleIndex], 
      [field]: value 
    };
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour la gestion des points de dureté
  const handleHardnessChange = (resultIndex, sampleIndex, hardnessIndex, field, value) => {
    const updatedResults = [...results];
    const hardnessPoints = updatedResults[resultIndex].samples[sampleIndex].hardnessPoints || [];
    
    // Gérer la valeur du Select pour le champ unit
    const actualValue = (field === 'unit' && value?.value) ? value.value : value;
    
    hardnessPoints[hardnessIndex] = { ...hardnessPoints[hardnessIndex], [field]: actualValue };
    updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = hardnessPoints;
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour ajouter un point de dureté
  const addHardnessPoint = (resultIndex, sampleIndex) => {
    const updatedResults = [...results];
    const hardnessPoints = updatedResults[resultIndex].samples[sampleIndex].hardnessPoints || [];
    
    // Ajouter un nouveau point vide
    const newPoint = {
      location: '',
      value: '',
      unit: 'HV'
    };
    
    hardnessPoints.push(newPoint);
    updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = hardnessPoints;
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour supprimer un point de dureté
  const removeHardnessPoint = (resultIndex, sampleIndex, hardnessIndex) => {
    const updatedResults = [...results];
    const hardnessPoints = updatedResults[resultIndex].samples[sampleIndex].hardnessPoints || [];
    
    // Supprimer le point à l'index spécifié
    hardnessPoints.splice(hardnessIndex, 1);
    updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = hardnessPoints;
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour s'assurer qu'il y a toujours au moins un point de dureté
  const ensureMinimumHardnessPoints = (resultIndex, sampleIndex) => {
    const updatedResults = [...results];
    if (!updatedResults[resultIndex].samples[sampleIndex].hardnessPoints || 
        updatedResults[resultIndex].samples[sampleIndex].hardnessPoints.length === 0) {
      updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = [{
        location: '',
        value: '',
        unit: 'HV'
      }];
      
      handleChange({
        target: {
          name: 'resultsData.results',
          value: updatedResults
        }
      });
    }
  };

  // Fonction pour la gestion des positions ECD
  const handleEcdPositionChange = (resultIndex, sampleIndex, ecdIndex, field, value) => {
    const updatedResults = [...results];
    const ecdPositions = updatedResults[resultIndex].samples[sampleIndex].ecdPositions || [];
    
    ecdPositions[ecdIndex] = { ...ecdPositions[ecdIndex], [field]: value };
    updatedResults[resultIndex].samples[sampleIndex].ecdPositions = ecdPositions;
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour ajouter une position ECD
  const addEcdPosition = (resultIndex, sampleIndex) => {
    const updatedResults = [...results];
    const ecdPositions = updatedResults[resultIndex].samples[sampleIndex].ecdPositions || [];
    
    // Ajouter une nouvelle position vide
    const newPosition = {
      position: '',
      distance: '',
      unit: 'mm'
    };
    
    ecdPositions.push(newPosition);
    updatedResults[resultIndex].samples[sampleIndex].ecdPositions = ecdPositions;
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour supprimer une position ECD
  const removeEcdPosition = (resultIndex, sampleIndex, ecdIndex) => {
    const updatedResults = [...results];
    const ecdPositions = updatedResults[resultIndex].samples[sampleIndex].ecdPositions || [];
    
    // Supprimer la position à l'index spécifié
    ecdPositions.splice(ecdIndex, 1);
    updatedResults[resultIndex].samples[sampleIndex].ecdPositions = ecdPositions;
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // Fonction pour s'assurer qu'il y a toujours au moins une position ECD
  const ensureMinimumEcdPositions = (resultIndex, sampleIndex) => {
    const updatedResults = [...results];
    if (!updatedResults[resultIndex].samples[sampleIndex].ecdPositions || 
        updatedResults[resultIndex].samples[sampleIndex].ecdPositions.length === 0) {
      updatedResults[resultIndex].samples[sampleIndex].ecdPositions = [{
        position: '',
        distance: '',
        unit: 'mm'
      }];
      
      handleChange({
        target: {
          name: 'resultsData.results',
          value: updatedResults
        }
      });
    }
  };

  // Expose les méthodes nécessaires via ref (placeholder pour compatibilité)
  useImperativeHandle(ref, () => ({
    flushAllCurves: () => {
      // TODO: Implémenter quand les courbes seront ajoutées
      console.log('flushAllCurves appelé - pas encore implémenté');
    }
  }));

  return (
    <div>
      <h6 className="mb-3 d-flex justify-content-between align-items-center">
        <span>{t('tests.after.results.resultsLabel')}</span>
        {!viewMode && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleResultBlocAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addResult')}
          </Button>
        )}
      </h6>
      
      {results.map((result, resultIndex) => (
        <CollapsibleSection 
          key={resultIndex} 
          title={t('tests.after.results.resultNumber', { number: result.step })}
          isExpandedByDefault={resultIndex === 0}
          sectionId={`result-section-${resultIndex}`}
          rememberState={true}
          level={0}
          className="mb-3"
        >
          <div className="mb-3 d-flex justify-content-end">
            {!viewMode && results.length > 1 && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleResultBlocRemove(resultIndex)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('common.delete')}
              </Button>
            )}
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.after.results.description')}</Form.Label>
            <Form.Control
              type="text"
              value={result.description || ''}
              onChange={(e) => handleResultChange(resultIndex, 'description', e.target.value)}
              disabled={loading || viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
              placeholder={t('tests.after.results.enterDescription')}
            />
          </Form.Group>

          {/* Section des échantillons */}
          <div className="mb-3">
            <h6 className="mb-3 d-flex justify-content-between align-items-center">
              <span>{t('tests.after.results.samples')}</span>
              {!viewMode && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => handleSampleAdd(resultIndex)}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addSample')}
                </Button>
              )}
            </h6>

            {result.samples?.map((sample, sampleIndex) => (
              <CollapsibleSection 
                key={sampleIndex} 
                title={t('tests.after.results.sampleNumber', { number: sample.step })}
                isExpandedByDefault={sampleIndex === 0}
                sectionId={`sample-section-${resultIndex}-${sampleIndex}`}
                rememberState={true}
                level={1}
                className="mb-3"
              >
                <div className="mb-3 d-flex justify-content-end">
                  {!viewMode && result.samples.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleSampleRemove(resultIndex, sampleIndex)}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('common.delete')}
                    </Button>
                  )}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>{t('tests.after.results.sampleDescription')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={sample.description || ''}
                    onChange={(e) => handleSampleChange(resultIndex, sampleIndex, 'description', e.target.value)}
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    placeholder={t('tests.after.results.enterSampleDescription')}
                  />
                </Form.Group>

                {/* Section des points de dureté - Version améliorée */}
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-primary">
                        <strong>{t('tests.after.results.hardness')}</strong>
                      </h6>
                      {!viewMode && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => addHardnessPoint(resultIndex, sampleIndex)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faPlus} className="me-1" /> 
                          {t('tests.after.results.addPoint')}
                        </Button>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {(() => {
                      // S'assurer qu'il y a toujours au moins un point
                      const hardnessPoints = sample.hardnessPoints?.length > 0 
                        ? sample.hardnessPoints 
                        : [{ location: '', value: '', unit: 'HV' }];
                      
                      // Si le sample n'a pas de points, les initialiser
                      if (!sample.hardnessPoints || sample.hardnessPoints.length === 0) {
                        ensureMinimumHardnessPoints(resultIndex, sampleIndex);
                      }

                      return (
                        <Table responsive bordered hover className="mb-0">
                          <thead className="table-secondary">
                            <tr>
                              <th style={{ width: '35%' }}>
                                {t('tests.after.results.position')}
                              </th>
                              <th style={{ width: '25%' }}>
                                {t('tests.after.results.value')}
                              </th>
                              <th style={{ width: '25%' }}>
                                {t('common.unit')}
                              </th>
                              <th style={{ width: '15%' }} className="text-center">
                                {t('common.actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {hardnessPoints.map((point, hardnessIndex) => (
                              <tr key={hardnessIndex}>
                                <td>
                                  <Form.Control
                                    type="text"
                                    value={point.location || ''}
                                    onChange={(e) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'location', e.target.value)}
                                    placeholder={t('tests.after.results.enterPosition')}
                                    disabled={loading || viewMode}
                                    readOnly={viewMode}
                                    style={viewMode ? readOnlyFieldStyle : {}}
                                    size="sm"
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    value={point.value || ''}
                                    onChange={(e) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'value', e.target.value)}
                                    placeholder={t('tests.after.results.enterValue')}
                                    disabled={loading || viewMode}
                                    readOnly={viewMode}
                                    style={viewMode ? readOnlyFieldStyle : {}}
                                    size="sm"
                                  />
                                </td>
                                <td>
                                  <Select
                                    value={getSelectedOption(hardnessUnitOptions, point.unit || 'HV')}
                                    onChange={(option) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'unit', option)}
                                    options={hardnessUnitOptions}
                                    placeholder={t('common.selectUnit')}
                                    isDisabled={loading || viewMode}
                                    menuPortalTarget={document.body}
                                    styles={{
                                      ...selectStyles,
                                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                      control: (provided) => ({
                                        ...provided,
                                        minHeight: '31px',
                                        height: '31px',
                                        fontSize: '0.875rem',
                                        ...(viewMode ? {
                                          ...readOnlyFieldStyle,
                                          cursor: 'default'
                                        } : {})
                                      }),
                                      valueContainer: (provided) => ({
                                        ...provided,
                                        height: '31px',
                                        padding: '0 8px'
                                      }),
                                      input: (provided) => ({
                                        ...provided,
                                        margin: '0px'
                                      }),
                                      indicatorsContainer: (provided) => ({
                                        ...provided,
                                        height: '31px'
                                      }),
                                      ...(viewMode ? {
                                        dropdownIndicator: () => ({ display: 'none' }),
                                        indicatorSeparator: () => ({ display: 'none' })
                                      } : {})
                                    }}
                                    isClearable={!viewMode}
                                  />
                                </td>
                                <td className="text-center">
                                  {!viewMode && hardnessPoints.length > 1 && (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeHardnessPoint(resultIndex, sampleIndex, hardnessIndex)}
                                      disabled={loading}
                                      title={t('common.delete')}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      );
                    })()}
                    
                    {hardnessUnitOptions?.length === 0 && (
                      <div className="alert alert-warning mt-3 mb-0">
                        <small>
                          <FontAwesomeIcon icon={faPlus} className="me-2" />
                          {t('tests.after.results.noUnitsAvailable', 'Aucune unité de dureté disponible. Utilisation de "HV" par défaut.')}
                        </small>
                      </div>
                    )}
                  </Card.Body>
                </Card>

                {/* Section des positions ECD */}
                <Card className="mb-3">
                  <Card.Header className="bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0 text-primary">
                        <strong>{t('tests.after.results.ecdPosition', 'Positions ECD')}</strong>
                      </h6>
                      {!viewMode && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => addEcdPosition(resultIndex, sampleIndex)}
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faPlus} className="me-1" /> 
                          {t('tests.after.results.addPosition', 'Ajouter Position')}
                        </Button>
                      )}
                    </div>
                  </Card.Header>
                  <Card.Body>
                    {(() => {
                      // S'assurer qu'il y a toujours au moins une position
                      const ecdPositions = sample.ecdPositions?.length > 0 
                        ? sample.ecdPositions 
                        : [{ position: '', distance: '', unit: 'mm' }];
                      
                      // Si le sample n'a pas de positions, les initialiser
                      if (!sample.ecdPositions || sample.ecdPositions.length === 0) {
                        ensureMinimumEcdPositions(resultIndex, sampleIndex);
                      }

                      return (
                        <Table responsive bordered hover className="mb-0">
                          <thead className="table-secondary">
                            <tr>
                              <th style={{ width: '60%' }}>
                                {t('tests.after.results.position')}
                              </th>
                              <th style={{ width: '25%' }}>
                                {t('tests.after.results.distance', 'Distance')} (mm)
                              </th>
                              <th style={{ width: '15%' }} className="text-center">
                                {t('common.actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ecdPositions.map((position, ecdIndex) => (
                              <tr key={ecdIndex}>
                                <td>
                                  <Form.Control
                                    type="text"
                                    value={position.position || ''}
                                    onChange={(e) => handleEcdPositionChange(resultIndex, sampleIndex, ecdIndex, 'position', e.target.value)}
                                    placeholder={t('tests.after.results.enterPosition')}
                                    disabled={loading || viewMode}
                                    readOnly={viewMode}
                                    style={viewMode ? readOnlyFieldStyle : {}}
                                    size="sm"
                                  />
                                </td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    value={position.distance || ''}
                                    onChange={(e) => handleEcdPositionChange(resultIndex, sampleIndex, ecdIndex, 'distance', e.target.value)}
                                    placeholder={t('tests.after.results.enterDistance', 'Entrer distance')}
                                    disabled={loading || viewMode}
                                    readOnly={viewMode}
                                    style={viewMode ? readOnlyFieldStyle : {}}
                                    size="sm"
                                  />
                                </td>
                                <td className="text-center">
                                  {!viewMode && ecdPositions.length > 1 && (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => removeEcdPosition(resultIndex, sampleIndex, ecdIndex)}
                                      disabled={loading}
                                      title={t('common.delete')}
                                    >
                                      <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      );
                    })()}
                  </Card.Body>
                </Card>

                {/* Section Courbes de dureté */}
                <CollapsibleSection
                  title={t('tests.after.results.curves.title', 'Courbes de dureté')}
                  isExpandedByDefault={true}
                  sectionId={`curves-result-${resultIndex}-sample-${sampleIndex}`}
                  rememberState={true}
                  level={1}
                >
                  <ResultCurveSection
                    testNodeId={test?.id}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    formData={formData}
                    handleChange={handleChange}
                    viewMode={viewMode}
                    readOnlyFieldStyle={readOnlyFieldStyle}
                    unit="HV"
                  />
                </CollapsibleSection>

                {/* Section Micrographies */}
                <CollapsibleSection
                  title={t('tests.after.results.micrographs.title', 'Micrographies')}
                  isExpandedByDefault={false}
                  sectionId={`micrographs-result-${resultIndex}-sample-${sampleIndex}`}
                  rememberState={true}
                  level={1}
                >
                  <MicrographsSection
                    testNodeId={test?.id}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    onFileAssociationNeeded={handleFileAssociationNeeded}
                    viewMode={viewMode}
                  />
                </CollapsibleSection>

                {/* Section Localisation de contrôle */}
                <CollapsibleSection
                  title={t('tests.after.results.controlLocation.title', 'Localisation de contrôle')}
                  isExpandedByDefault={false}
                  sectionId={`control-location-result-${resultIndex}-sample-${sampleIndex}`}
                  rememberState={true}
                  level={1}
                >
                  <ControlLocationSection
                    testNodeId={test?.id}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    onFileAssociationNeeded={handleFileAssociationNeeded}
                    viewMode={viewMode}
                  />
                </CollapsibleSection>

                {/* Placeholder pour les fonctionnalités futures */}
                <div className="mt-4">
                  <div className="alert alert-info">
                    <h6>{t('common.comingSoon', 'Prochainement')}</h6>
                    <ul className="mb-0">
                      <li>{t('tests.after.results.import.button', 'Import Excel')}</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleSection>
            ))}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
});

ResultsDataSection.displayName = 'ResultsDataSection';

export default ResultsDataSection;
