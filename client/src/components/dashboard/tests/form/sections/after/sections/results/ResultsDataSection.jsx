import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Row, Col, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faFileImport } from '@fortawesome/free-solid-svg-icons';
import MicrographsSection from './modules/MicrographsSection';
import ResultCurveSection from './modules/ResultCurveSection';
import ControlLocationSection from './modules/ControlLocationSection';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';

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
  handleHardnessResultAdd,
  handleHardnessResultRemove,
  handleEcdPositionAdd,
  handleEcdPositionRemove,
  handleEcdPositionChange,
  loading,
  selectStyles,
  test,
  handleFileAssociationNeeded,
  viewMode = false,
  readOnlyFieldStyle = {},
  excelImportHandlers = {},
  // Ajout : ref pour la soumission globale (optionnel)
  onFlushAllCurves = null
}, ref) => {
  const { t } = useTranslation();
  // Créer un tableau de refs pour toutes les sections courbe (résultat/échantillon)
  const curveSectionRefs = useRef([]);
  
  // Define a default file input ref if not provided
  const defaultFileInputRef = useRef(null);

  // Utiliser les fonctions d'import Excel passées en props ou créer des valeurs par défaut
  const {
    fileInputRef = defaultFileInputRef,
    handleExcelImport = () => {},
    processExcelData = () => {},
    handleEcdChange = () => {},
    handleHardnessChange = () => {}
  } = excelImportHandlers;

  // Fonctions de gestion des résultats internes au composant
  const handleResultChange = (resultIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    updatedResults[resultIndex] = { ...updatedResults[resultIndex], [field]: value };
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  const handleSampleChange = (resultIndex, sampleIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
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
  // S'assurer que le tableau de résultats existe
  const results = formData.resultsData?.results || [];

  // Helper pour fournir la ref à chaque ResultCurveSection
  const getCurveSectionRef = (resultIndex, sampleIndex) => (el) => {
    if (!curveSectionRefs.current) curveSectionRefs.current = [];
    curveSectionRefs.current[`${resultIndex}-${sampleIndex}`] = el;
  };

  // Ajout d'une méthode pour flusher toutes les courbes (à utiliser avant la soumission)
  const flushAllCurves = () => {
    if (curveSectionRefs.current) {
      Object.values(curveSectionRefs.current).forEach(ref => {
        if (ref && ref.flushCurveDataToParent) ref.flushCurveDataToParent();
      });
    }
    if (onFlushAllCurves) onFlushAllCurves();
  };

  // Expose flushAllCurves via ref
  useImperativeHandle(ref, () => ({
    flushAllCurves
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
            />
          </Form.Group>

          {/* Section des échantillons */}
          <div className="mb-3">      <h6 className="mb-3 d-flex justify-content-between align-items-center">
        <span>{t('tests.after.results.samples')}</span>
        <div className="d-flex gap-2">
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
        </div>
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
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">                  <Form.Label className="d-flex justify-content-between align-items-center">
                    <span>{t('tests.after.results.hardness')}</span>
                    <div className="d-flex gap-2">
                      {!viewMode && (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={faFileImport} className="me-1" /> {t('tests.after.results.import.button')}
                          </Button>
                        </>
                      )}
                    </div>
                  </Form.Label>

                  {/* Input file caché pour l'import Excel */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleExcelImport(e, resultIndex, sampleIndex)}
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                  />
                  <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '40%' }}>{t('tests.after.results.position')}</th>
                        <th style={{ width: '25%' }}>{t('tests.after.results.value')}</th>
                        <th style={{ width: '25%' }}>{t('common.unit')}</th>
                        <th style={{ width: '10%' }}>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.hardnessPoints?.map((point, hardnessIndex) => (
                        <tr key={`hardness-${resultIndex}-${sampleIndex}-${hardnessIndex}`}>
                          <td>
                            <Form.Control
                              type="text"
                              value={point.location || ''}
                              onChange={(e) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'location', e.target.value)}
                              placeholder={t('tests.after.results.enterPosition')}
                              disabled={loading || viewMode}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
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
                            />
                          </td>
                          <td>
                            <Select
                              value={getSelectedOption(hardnessUnitOptions, point.unit || formData.resultsData?.hardnessResultUnit)}
                              onChange={(option) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'unit', option)}
                              options={hardnessUnitOptions}
                              placeholder={t('common.selectUnit')}
                              isDisabled={loading || viewMode}
                              menuPortalTarget={document.body}
                              styles={{
                                ...selectStyles,
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                ...(viewMode ? {
                                  control: (provided) => ({
                                    ...provided,
                                    ...readOnlyFieldStyle,
                                    cursor: 'default'
                                  }),
                                  dropdownIndicator: () => ({ display: 'none' }),
                                  indicatorSeparator: () => ({ display: 'none' })
                                } : {})
                              }}
                              isClearable={!viewMode}
                            />
                          </td>
                          <td className="text-center">
                            {!viewMode && sample.hardnessPoints.length > 1 ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleHardnessResultRemove(resultIndex, sampleIndex, hardnessIndex)}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-end mt-2">
                    {!viewMode && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleHardnessResultAdd(resultIndex, sampleIndex)}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addPoint')}
                      </Button>
                    )}
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>{t('tests.after.results.ecd')}</Form.Label>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>{t('tests.after.results.hardness')}</Form.Label>
                        <Form.Control
                          type="number"
                          value={sample.ecd?.hardnessValue || ''}
                          onChange={(e) => handleEcdChange(resultIndex, sampleIndex, 'hardnessValue', e.target.value)}
                          placeholder={t('tests.after.results.hardnessValue')}
                          disabled={loading}
                          readOnly={viewMode}
                          style={viewMode ? readOnlyFieldStyle : {}}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>{t('common.unit')}</Form.Label>
                        <Select
                          value={getSelectedOption(hardnessUnitOptions, sample.ecd?.hardnessUnit)}
                          onChange={(option) => handleEcdChange(resultIndex, sampleIndex, 'hardnessUnit', option)}
                          options={hardnessUnitOptions}
                          placeholder={t('tests.after.results.hardnessUnit')}
                          isDisabled={loading || viewMode}
                          styles={{
                            ...selectStyles,
                            ...(viewMode ? {
                              control: (provided) => ({
                                ...provided,
                                ...readOnlyFieldStyle,
                                cursor: 'default'
                              }),
                              dropdownIndicator: () => ({ display: 'none' }),
                              indicatorSeparator: () => ({ display: 'none' })
                            } : {})
                          }}
                          isClearable={!viewMode}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '35%' }}>{t('tests.after.results.position')}</th>
                        <th style={{ width: '25%' }}>{t('tests.after.results.distance')}</th>
                        <th style={{ width: '25%' }}>{t('common.unit')}</th>
                        <th style={{ width: '15%' }}>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.ecd?.ecdPoints?.map((point, positionIndex) => (
                        <tr key={`ecd-position-${resultIndex}-${sampleIndex}-${positionIndex}`}>
                          <td>
                            <Form.Control
                              type="text"
                              value={point.name || ''}
                              onChange={(e) => handleEcdPositionChange(resultIndex, sampleIndex, positionIndex, 'name', e.target.value)}
                              placeholder={t('tests.after.results.enterPosition')}
                              disabled={loading || viewMode}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              value={point.distance || ''}
                              onChange={(e) => handleEcdPositionChange(resultIndex, sampleIndex, positionIndex, 'distance', e.target.value)}
                              placeholder={t('tests.after.results.enterDistance')}
                              disabled={loading}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
                            />
                          </td>
                          <td>
                            <Select
                              value={point.unit 
                                ? getSelectedOption(lengthUnitOptions, point.unit) 
                                : lengthUnitOptions[0] || null}
                              onChange={(option) => handleEcdPositionChange(resultIndex, sampleIndex, positionIndex, 'unit', option)}
                              options={lengthUnitOptions}
                              placeholder={t('common.selectUnit')}
                              isDisabled={loading || viewMode}
                              menuPortalTarget={document.body}
                              styles={{
                                ...selectStyles,
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                ...(viewMode ? {
                                  control: (provided) => ({
                                    ...provided,
                                    ...readOnlyFieldStyle,
                                    cursor: 'default'
                                  }),
                                  dropdownIndicator: () => ({ display: 'none' }),
                                  indicatorSeparator: () => ({ display: 'none' })
                                } : {})
                              }}
                              isClearable={!viewMode}
                            />
                          </td>
                          <td className="text-center">
                            {!viewMode && sample.ecd?.ecdPoints?.length > 1 ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEcdPositionRemove(resultIndex, sampleIndex, positionIndex)}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-end mt-2">
                    {!viewMode && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEcdPositionAdd(resultIndex, sampleIndex)}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addPoint')}
                      </Button>
                    )}
                  </div>
                </Form.Group>

                <CollapsibleSection
                  title={t('tests.after.results.resultCurve.title')}
                  isExpandedByDefault={false}
                  sectionId={`test-hardness-curve-${resultIndex}-${sampleIndex}`}
                  rememberState={true}
                  level={2}
                  className="mb-3"
                >
                  <ResultCurveSection
                    ref={getCurveSectionRef(resultIndex, sampleIndex)}
                    result={sample}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    handleChange={handleChange}
                    handleSelectChange={handleSelectChange}
                    getSelectedOption={getSelectedOption}
                    hardnessUnitOptions={hardnessUnitOptions}
                    loading={loading}
                    selectStyles={selectStyles}
                    test={test}
                    parentId={parentId}
                    viewMode={viewMode}
                    readOnlyFieldStyle={readOnlyFieldStyle}
                  />
                </CollapsibleSection>
                
                <CollapsibleSection
                  title={t('tests.after.results.controlLocation.title')}
                  isExpandedByDefault={false}
                  sectionId={`test-control-location-${resultIndex}-${sampleIndex}`}
                  rememberState={true}
                  level={2}
                  className="mb-3"
                >
                  <ControlLocationSection
                    testNodeId={test ? test.id : null}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    onFileAssociationNeeded={handleFileAssociationNeeded}
                    viewMode={viewMode}
                  />
                </CollapsibleSection>
                
                <CollapsibleSection
                  title={t('tests.after.results.micrographs.title')}
                  isExpandedByDefault={false}
                  sectionId={`test-micrographs-${resultIndex}-${sampleIndex}`}
                  rememberState={true}
                  level={2}
                >  
                  <MicrographsSection
                    testNodeId={test ? test.id : null}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    onFileAssociationNeeded={handleFileAssociationNeeded}
                    viewMode={viewMode}
                  />
                </CollapsibleSection>
              </CollapsibleSection>
            ))}
          </div>
        </CollapsibleSection>
      ))}
      {/* Exposer la méthode flushAllCurves pour le parent (ex: bouton de soumission) */}
      <input type="hidden" data-flush-all-curves-trigger onClick={flushAllCurves} />
    </div>
  );
});

export default ResultsDataSection;
