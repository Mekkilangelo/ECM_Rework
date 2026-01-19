import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Row, Col, Form, Button, Table, Alert, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faMagic, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import predictionService from '../../../../../../../../../../services/predictionService';
import trialService from '../../../../../../../../../../services/trialService';

const ChemicalCycleSection = ({
  formData,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  handleChemicalCycleAdd,
  handleChemicalCycleRemove,
  calculateProgramDuration,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {},
  trial = null // Données complètes du trial pour accéder à la pièce parente
}) => {
  const { t } = useTranslation();

  // State pour gérer la prédiction
  const [predicting, setPredicting] = useState(false);
  const [predictionError, setPredictionError] = useState(null);
  const [predictionSuccess, setPredictionSuccess] = useState(null);

  /**
   * Handler pour prédire la recette via l'API ML
   */
  const handlePredictRecipe = async () => {
    setPredicting(true);
    setPredictionError(null);
    setPredictionSuccess(null);

    try {
      // DEBUG: Logger ce qui est disponible
      console.log('Trial prop:', trial);
      console.log('Trial keys:', trial ? Object.keys(trial) : 'trial is null/undefined');
      console.log('formData:', formData);

      // 1. Récupérer l'ID du trial depuis formData ou trial
      // Priorité: formData.id > trial.id > trial.node_id
      const trialId = formData?.id || trial?.id || trial?.node_id;

      if (!trialId) {
        console.error('Trial object:', trial);
        console.error('FormData object:', formData);
        throw new Error('Impossible de prédire la recette : l\'essai doit d\'abord être sauvegardé. Veuillez enregistrer l\'essai avant d\'utiliser la prédiction.');
      }

      // 2. Récupérer les données de la pièce parente via l'API
      // Le backend va charger toutes les relations nécessaires
      console.log('Fetching trial with ID:', trialId);
      const fullTrial = await trialService.getTrial(trialId);
      console.log('Full trial received:', fullTrial);

      // Vérifier que nous avons le node parent
      if (!fullTrial || !fullTrial.node || !fullTrial.node.parent) {
        throw new Error('Impossible de récupérer les données de la pièce parente. Assurez-vous que l\'essai est bien lié à une pièce.');
      }

      const parentPart = fullTrial.node.parent;

      if (parentPart.type !== 'part') {
        throw new Error('Le parent de l\'essai n\'est pas une pièce');
      }

      // 3. Valider et préparer les paramètres
      const validation = predictionService.validateAndPrepareParams(formData, parentPart);

      if (!validation.valid) {
        setPredictionError({
          message: 'Données manquantes pour effectuer la prédiction',
          missing: validation.missing
        });
        return;
      }

      // 4. Appeler l'API de prédiction
      console.log('Calling prediction API with params:', validation.params);
      const predictionResult = await predictionService.predictRecipe(validation.params);
      console.log('Prediction result received:', predictionResult);
      console.log('Reconstructed recipe:', predictionResult.reconstructed_recipe);

      // 5. Mapper la recette prédite vers le format de l'app
      // Chaque step de simulation devient 2 steps (carb + diff)
      // Le dernier step ajoute un 3ème step pour le temps final
      const predictedCycles = predictionService.mapToChemicalCycles(
        predictionResult.reconstructed_recipe
      );
      console.log('Predicted cycles (mapped):', predictedCycles);
      console.log('Total steps generated:', predictedCycles.length);

      // 6. Calculer le cycle thermique selon la logique HEAT CYCLE
      // Utiliser la température de la recette (actuellement 950°C, sera variable plus tard)
      const recipeTemperature = validation.params.recipe_temperature || 950;

      const thermalCycleData = predictionService.calculateThermalCycle(
        predictionResult.reconstructed_recipe,
        {
          rampUpTime: 60,        // 60 min de montée par défaut
          treatmentTemp: recipeTemperature,    // Température de la recette
          quenchTemp: null,      // Pas de refroidissement par défaut
          coolingTime: 20        // 20 min si refroidissement activé
        }
      );
      console.log('Thermal cycle calculated:', thermalCycleData);

      // 7. Ajuster le dernier step de diffusion finale avec le temps calculé
      if (thermalCycleData && predictedCycles.length > 0) {
        const lastStep = predictedCycles[predictedCycles.length - 1];
        lastStep.time = thermalCycleData.machineReadyFinalDiffSeconds;
        console.log('Adjusted last step time:', lastStep.time, 'seconds');
      }

      // 8. Mettre à jour le formulaire avec les cycles prédits
      handleChange({
        target: {
          name: 'recipeData.chemicalCycle',
          value: predictedCycles
        }
      });

      // 9. Mettre à jour le cycle thermique
      if (thermalCycleData) {
        // Mapper le cycle thermique au format de l'application
        const thermalSteps = thermalCycleData.thermalCycle.map((step, index) => ({
          step: index + 1,
          setpoint: step.temperature,    // Setpoint (température cible)
          temperature: step.temperature, // Température (même valeur que setpoint)
          duration: step.duration,
          tempUnit: '°C',
          durationUnit: 'min'
        }));

        handleChange({
          target: {
            name: 'recipeData.thermalCycle',
            value: thermalSteps
          }
        });

        console.log('Thermal cycle steps set:', thermalSteps);
      }

      // 10. Pré-sélectionner les gaz si pas déjà fait
      if (!formData.recipeData.selectedGas1) {
        handleChange({
          target: {
            name: 'recipeData.selectedGas1',
            value: 'C2H2' // Gaz de cémentation
          }
        });
      }

      if (!formData.recipeData.selectedGas2) {
        handleChange({
          target: {
            name: 'recipeData.selectedGas2',
            value: 'N2' // Gaz de diffusion
          }
        });
      }

      // 11. Afficher un message de succès
      const successMessage =
        `Recette prédite avec succès :\n` +
        `• Cycle chimique : ${predictedCycles.length} step(s) généré(s)\n` +
        `• Cycle thermique : ${thermalCycleData ? thermalCycleData.totalTimeMinutes + ' minutes de traitement' : 'non calculé'}\n` +
        `• Gaz pré-sélectionnés : C2H2 (carburation), N2 (diffusion)\n\n` +
        `N'oubliez pas de définir les débits de gaz et la pression pour chaque étape.`;

      setPredictionSuccess(successMessage);

    } catch (error) {
      console.error('Erreur lors de la prédiction:', error);

      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de la prédiction';
      const errorDetails = error.response?.data?.details;

      setPredictionError({
        message: errorMessage,
        details: errorDetails
      });
    } finally {
      setPredicting(false);
    }
  };

  // Fonction pour calculer la durée totale du cycle chimique en minutes (incluant waitTime)
  const calculateChemicalCycleDurationMinutes = () => {
    if (!formData.recipeData?.chemicalCycle) return 0;
    
    // Somme des temps du cycle chimique en secondes
    const totalSeconds = formData.recipeData.chemicalCycle.reduce((total, step) => {
      return total + (parseInt(step.time) || 0);
    }, 0);
    
    // Convertir en minutes
    let totalMinutes = totalSeconds / 60;
    
    // Ajouter le waitTime s'il existe
    const waitTime = parseInt(formData.recipeData?.waitTime) || 0;
    totalMinutes += waitTime;
    
    return Math.round(totalMinutes); // Arrondi à la minute la plus proche (valeur entière)
  };

  // Fonction pour calculer la durée totale des steps en secondes (SANS wait time)
  const calculateStepsTotalSeconds = () => {
    if (!formData.recipeData?.chemicalCycle) return 0;
    
    return formData.recipeData.chemicalCycle.reduce((total, step) => {
      return total + (parseInt(step.time) || 0);
    }, 0);
  };

  // Fonction pour convertir des secondes en format "Xm Ys"
  const formatSecondsToMinSec = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    } else if (remainingSeconds === 0) {
      return `${minutes}m`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };

  // Fonction pour calculer le total d'une colonne de gaz en minutes/secondes
  const calculateGasTotalTime = (gasNumber) => {
    if (!formData.recipeData?.chemicalCycle) return { seconds: 0, formatted: '0s' };
    
    let totalSeconds = 0;
    
    formData.recipeData.chemicalCycle.forEach(step => {
      const flowRate = parseFloat(step[`debit${gasNumber}`]) || 0;
      const stepTime = parseInt(step.time) || 0;
      
      // Si le débit n'est pas 0, on compte le temps de cette étape
      if (flowRate > 0) {
        totalSeconds += stepTime;
      }
    });
    
    return {
      seconds: totalSeconds,
      formatted: formatSecondsToMinSec(totalSeconds)
    };
  };
  
  const gasOptions = [
    { value: 'N2', label: 'N2' },
    { value: 'NH3', label: 'NH3' },
    { value: 'C2H2', label: 'C2H2' },
    { value: 'N2O', label: 'N2O' },
    { value: 'CO2', label: 'CO2' }
  ];

  // Fonction pour gérer la touche Entrée
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Vérifier si on est sur la dernière ligne
      const isLastRow = index === (formData.recipeData?.chemicalCycle?.length || 1) - 1;
      if (isLastRow) {
        // Ajouter une nouvelle étape
        handleChemicalCycleAdd();
        // Focus sur le premier champ de la nouvelle ligne (optionnel)
        setTimeout(() => {
          const newRowIndex = formData.recipeData?.chemicalCycle?.length || 0;
          const targetInput = document.querySelector(`input[data-chemical-row="${newRowIndex}"][data-chemical-field="time"]`);
          if (targetInput) {
            targetInput.focus();
          }
        }, 100);
      } else {
        // Passer à la ligne suivante, même champ
        const fieldName = e.target.getAttribute('data-chemical-field');
        const nextRowInput = document.querySelector(`input[data-chemical-row="${index + 1}"][data-chemical-field="${fieldName}"]`);
        if (nextRowInput) {
          nextRowInput.focus();
        }
      }
    }
  };
  
  const handleChemicalCycleChange = (index, field, value) => {
    const updatedChemicalCycle = [...formData.recipeData.chemicalCycle];
    updatedChemicalCycle[index] = { ...updatedChemicalCycle[index], [field]: value };
    handleChange({
      target: {
        name: 'recipeData.chemicalCycle',
        value: updatedChemicalCycle
      }
    });
  };
  
  const handleTurbineChange = (index, checked) => {
    const updatedChemicalCycle = [...formData.recipeData.chemicalCycle];
    updatedChemicalCycle[index] = { ...updatedChemicalCycle[index], turbine: checked };
    handleChange({
      target: {
        name: 'recipeData.chemicalCycle',
        value: updatedChemicalCycle
      }
    });
  };
  
  const handleGlobalGasChange = (option, gasNumber) => {
    handleChange({
      target: {
        name: `recipeData.selectedGas${gasNumber}`,
        value: option ? option.value : ''
      }
    });
  };
  
  return (
    <>
      {/* Bouton de prédiction et alertes */}
      {!viewMode && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="mb-0">{t('trials.before.recipeData.chemicalCycle.title')}</h6>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePredictRecipe}
              disabled={predicting || loading}
            >
              {predicting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {t('trials.before.recipeData.chemicalCycle.predicting', 'Prédiction en cours...')}
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faMagic} className="me-2" />
                  {t('trials.before.recipeData.chemicalCycle.predictRecipe', 'Prédire la recette')}
                </>
              )}
            </Button>
          </div>

          {/* Alerte d'erreur */}
          {predictionError && (
            <Alert variant="danger" dismissible onClose={() => setPredictionError(null)}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <strong>{t('common.error', 'Erreur')} :</strong> {predictionError.message}
              {predictionError.details && (
                <div className="mt-2 small">
                  <strong>Détails :</strong> {predictionError.details}
                </div>
              )}
              {predictionError.missing && predictionError.missing.length > 0 && (
                <ul className="mb-0 mt-2">
                  {predictionError.missing.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}

          {/* Alerte de succès */}
          {predictionSuccess && (
            <Alert variant="success" dismissible onClose={() => setPredictionSuccess(null)}>
              <strong>{t('common.success', 'Succès')} :</strong> {predictionSuccess}
            </Alert>
          )}
        </div>
      )}

      {/* Global gas selection section */}
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('trials.before.recipeData.chemicalCycle.gas')} 1</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas1)}
              onChange={(option) => handleGlobalGasChange(option, 1)}
              options={gasOptions}
              styles={viewMode ? {
                ...selectStyles,
                control: (provided) => ({
                  ...provided,
                  ...readOnlyFieldStyle,
                  cursor: 'default'
                }),
                dropdownIndicator: () => ({ display: 'none' }),
                indicatorSeparator: () => ({ display: 'none' })
              } : selectStyles}
              isDisabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.chemicalCycle.selectGas')}
              isClearable={!viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('trials.before.recipeData.chemicalCycle.gas')} 2</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas2)}
              onChange={(option) => handleGlobalGasChange(option, 2)}
              options={gasOptions}
              styles={viewMode ? {
                ...selectStyles,
                control: (provided) => ({
                  ...provided,
                  ...readOnlyFieldStyle,
                  cursor: 'default'
                }),
                dropdownIndicator: () => ({ display: 'none' }),
                indicatorSeparator: () => ({ display: 'none' })
              } : selectStyles}
              isDisabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.chemicalCycle.selectGas')}
              isClearable={!viewMode}
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>{t('trials.before.recipeData.chemicalCycle.gas')} 3</Form.Label>
            <Select
              value={getSelectedOption(gasOptions, formData.recipeData.selectedGas3)}
              onChange={(option) => handleGlobalGasChange(option, 3)}
              options={gasOptions}
              styles={viewMode ? {
                ...selectStyles,
                control: (provided) => ({
                  ...provided,
                  ...readOnlyFieldStyle,
                  cursor: 'default'
                }),
                dropdownIndicator: () => ({ display: 'none' }),
                indicatorSeparator: () => ({ display: 'none' })
              } : selectStyles}
              isDisabled={loading || viewMode}
              placeholder={t('trials.before.recipeData.chemicalCycle.selectGas')}
              isClearable={!viewMode}
            />
          </Form.Group>
        </Col>
      </Row>
      <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
        <thead className="bg-light">
          <tr>
            <th style={{ width: '60px' }}>{t('trials.before.recipeData.chemicalCycle.step')}</th>
            <th>{t('trials.before.recipeData.chemicalCycle.time')} (s)</th>
            {formData.recipeData.selectedGas1 && (
              <th className="text-center">
                {t('trials.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas1} (Nl/h)
              </th>
            )}
            {formData.recipeData.selectedGas2 && (
              <th className="text-center">
                {t('trials.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas2} (Nl/h)
              </th>
            )}
            {formData.recipeData.selectedGas3 && (
              <th className="text-center">
                {t('trials.before.recipeData.chemicalCycle.flowRate')} {formData.recipeData.selectedGas3} (Nl/h)
              </th>
            )}
            <th>{t('trials.before.recipeData.chemicalCycle.pressure')} (mb)</th>
            <th className="text-center">{t('trials.before.recipeData.chemicalCycle.turbine')}</th>
            {!viewMode && (
              <th style={{ width: '80px' }}>{t('common.actions')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {formData.recipeData?.chemicalCycle?.slice().sort((a, b) => a.step - b.step).map((cycle, index) => (
            <tr key={`chemical-cycle-${index}`}>
              <td className="text-center align-middle">{cycle.step}</td>
              <td>
                <Form.Control
                  type="number"
                  value={cycle.time || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'time', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                  data-chemical-row={index}
                  data-chemical-field="time"
                />
              </td>
              {/* Débit pour Gaz 1 */}
              {formData.recipeData.selectedGas1 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('trials.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit1 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit1', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    step="0.1"
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    data-chemical-row={index}
                    data-chemical-field="debit1"
                  />
                </td>
              )}
              {/* Débit pour Gaz 2 */}
              {formData.recipeData.selectedGas2 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('trials.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit2 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit2', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    step="0.1"
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    data-chemical-row={index}
                    data-chemical-field="debit2"
                  />
                </td>
              )}
              {/* Débit pour Gaz 3 */}
              {formData.recipeData.selectedGas3 && (
                <td>
                  <Form.Control
                    type="number"
                    placeholder={t('trials.before.recipeData.chemicalCycle.flowRate')}
                    value={cycle.debit3 || ''}
                    onChange={(e) => handleChemicalCycleChange(index, 'debit3', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    step="0.1"
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                    data-chemical-row={index}
                    data-chemical-field="debit3"
                  />
                </td>
              )}
              <td>
                <Form.Control
                  type="number"
                  value={cycle.pressure || ''}
                  onChange={(e) => handleChemicalCycleChange(index, 'pressure', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  step="0.1"
                  disabled={loading || viewMode}
                  readOnly={viewMode}
                  style={viewMode ? readOnlyFieldStyle : {}}
                  data-chemical-row={index}
                  data-chemical-field="pressure"
                />
              </td>
              {/* Colonne Turbine avec case à cocher */}
              <td className="text-center align-middle">
                <div className="form-group mb-0">
                  <div className="custom-control custom-switch custom-control-lg mx-auto" style={{ width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id={`turbine-custom-switch-${index}`}
                      checked={cycle.turbine || false}
                      onChange={(e) => handleTurbineChange(index, e.target.checked)}
                      disabled={loading || viewMode}
                      readOnly={viewMode}
                    />
                    <label className="custom-control-label" htmlFor={`turbine-custom-switch-${index}`}></label>
                  </div>
                </div>
              </td>
              {!viewMode && (
                <td className="text-center">
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleChemicalCycleRemove(index)}
                    disabled={formData.recipeData?.chemicalCycle?.length <= 1 || loading}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
      {!viewMode && (
        <div className="text-end mb-3">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleChemicalCycleAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('trials.before.recipeData.chemicalCycle.addStep')}
          </Button>
        </div>
      )}
      
      {/* Section des totaux de durée */}
      <div className="row mb-3">
        <div className="col-12">
          <h6 className="text-muted mb-3">{t('trials.before.recipeData.chemicalCycle.durationTotals')}</h6>
        </div>
        
        {/* Total des steps en secondes et en format min/sec */}
        <div className="col-md-6">
          <div className="row">
            <div className="col-6">
              <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalStepsSeconds')}</label>
              <input
                type="text"
                className="form-control"
                value={`${calculateStepsTotalSeconds()}s`}
                readOnly
                style={{
                  ...readOnlyFieldStyle,
                  backgroundColor: '#e9ecef',
                  borderColor: '#ced4da'
                }}
              />
            </div>
            <div className="col-6">
              <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalStepsFormatted')}</label>
              <input
                type="text"
                className="form-control"
                value={formatSecondsToMinSec(calculateStepsTotalSeconds())}
                readOnly
                style={{
                  ...readOnlyFieldStyle,
                  backgroundColor: '#e9ecef',
                  borderColor: '#ced4da'
                }}
              />
            </div>
          </div>
        </div>

        {/* Totaux des gaz */}
        <div className="col-md-6">
          <div className="row">
            {formData.recipeData.selectedGas1 && (
              <div className="col-4">
                <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalGas')} {formData.recipeData.selectedGas1}</label>
                <input
                  type="text"
                  className="form-control"
                  value={calculateGasTotalTime(1).formatted}
                  readOnly
                  style={{
                    ...readOnlyFieldStyle,
                    backgroundColor: '#d1ecf1',
                    borderColor: '#bee5eb'
                  }}
                />
              </div>
            )}
            {formData.recipeData.selectedGas2 && (
              <div className="col-4">
                <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalGas')} {formData.recipeData.selectedGas2}</label>
                <input
                  type="text"
                  className="form-control"
                  value={calculateGasTotalTime(2).formatted}
                  readOnly
                  style={{
                    ...readOnlyFieldStyle,
                    backgroundColor: '#d4edda',
                    borderColor: '#c3e6cb'
                  }}
                />
              </div>
            )}
            {formData.recipeData.selectedGas3 && (
              <div className="col-4">
                <label className="form-label">{t('trials.before.recipeData.chemicalCycle.totalGas')} {formData.recipeData.selectedGas3}</label>
                <input
                  type="text"
                  className="form-control"
                  value={calculateGasTotalTime(3).formatted}
                  readOnly
                  style={{
                    ...readOnlyFieldStyle,
                    backgroundColor: '#fff3cd',
                    borderColor: '#ffeaa7'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Champ calculé pour la durée totale du cycle chimique */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">{t('trials.before.chemicalCycle.totalCycleDuration')}</label>
          <input
            type="text"
            className="form-control"
            value={calculateChemicalCycleDurationMinutes()}
            readOnly
            style={{
              ...readOnlyFieldStyle,
              backgroundColor: calculateProgramDuration && Math.abs(calculateProgramDuration() - calculateChemicalCycleDurationMinutes()) < 0.1 
                ? '#d4edda' // Vert si égal (avec tolérance de 0.1)
                : '#f8d7da', // Rouge si différent
              borderColor: calculateProgramDuration && Math.abs(calculateProgramDuration() - calculateChemicalCycleDurationMinutes()) < 0.1 
                ? '#c3e6cb' 
                : '#f5c6cb'
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ChemicalCycleSection;
