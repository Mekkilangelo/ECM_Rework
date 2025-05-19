import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Row, Col, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import MicrographsSection from './modules/MicrographsSection';
import ResultCurveSection from './modules/ResultCurveSection';
import ControlLocationSection from './modules/ControlLocationSection';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';

const ResultsDataSection = ({
  formData,
  parentId,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  lengthUnitOptions,
  hardnessUnitOptions,
  handleResultBlocAdd,
  handleResultBlocRemove,
  handleHardnessResultAdd,
  handleHardnessResultRemove,
  handleEcdPositionAdd,
  handleEcdPositionRemove,
  handleEcdPositionChange,
  loading,
  selectStyles,
  test,
  handleFileAssociationNeeded
}) => {
  const { t } = useTranslation();
  
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

  const handleHardnessChange = (resultIndex, hardnessIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    const updatedHardnessPoints = [...updatedResults[resultIndex].hardnessPoints];
    if (field === 'unit') {
      // Pour les champs select
      updatedHardnessPoints[hardnessIndex] = {
        ...updatedHardnessPoints[hardnessIndex],
        [field]: value ? value.value : ''
      };
    } else {
      // Pour les champs directs
      updatedHardnessPoints[hardnessIndex] = {
        ...updatedHardnessPoints[hardnessIndex],
        [field]: value
      };
    }
    updatedResults[resultIndex].hardnessPoints = updatedHardnessPoints;
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  const handleEcdChange = (resultIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    
    // S'assurer que l'objet ecd existe avec toutes ses propriétés
    if (!updatedResults[resultIndex].ecd) {
      updatedResults[resultIndex].ecd = {
        hardnessValue: '',
        hardnessUnit: '',
        ecdPoints: [{ name: '', distance: '', unit: '' }]
      };
    }
    
    if (field === 'hardnessUnit') {
      updatedResults[resultIndex].ecd[field] = value ? value.value : '';
    } else if (field === 'hardnessValue') {
      updatedResults[resultIndex].ecd[field] = value;
    }
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // S'assurer que le tableau de résultats existe
  const results = formData.resultsData?.results || [];

  return (
    <div>
      <h6 className="mb-3 d-flex justify-content-between align-items-center">
        <span>{t('tests.after.results.resultsLabel')}</span>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleResultBlocAdd}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addResult')}
        </Button>
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
            {results.length > 1 && (
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
              disabled={loading}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="d-flex justify-content-between align-items-center">
              <span>{t('tests.after.results.hardness')}</span>
            </Form.Label>
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
                {result.hardnessPoints.map((point, hardnessIndex) => (
                  <tr key={`hardness-${resultIndex}-${hardnessIndex}`}>
                    <td>
                      <Form.Control
                        type="text"
                        value={point.location || ''}
                        onChange={(e) => handleHardnessChange(resultIndex, hardnessIndex, 'location', e.target.value)}
                        placeholder={t('tests.after.results.enterPosition')}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={point.value || ''}
                        onChange={(e) => handleHardnessChange(resultIndex, hardnessIndex, 'value', e.target.value)}
                        placeholder={t('tests.after.results.enterValue')}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Select
                        value={getSelectedOption(hardnessUnitOptions, point.unit || formData.resultsData?.hardnessResultUnit)}
                        onChange={(option) => handleHardnessChange(resultIndex, hardnessIndex, 'unit', option)}
                        options={hardnessUnitOptions}
                        placeholder={t('common.selectUnit')}
                        isDisabled={loading}
                        menuPortalTarget={document.body}
                        styles={{
                          ...selectStyles,
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                        isClearable
                      />
                    </td>
                    <td className="text-center">
                      {result.hardnessPoints.length > 1 ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleHardnessResultRemove(resultIndex, hardnessIndex)}
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
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleHardnessResultAdd(resultIndex)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addPoint')}
              </Button>
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
                    value={result.ecd?.hardnessValue || ''}
                    onChange={(e) => handleEcdChange(resultIndex, 'hardnessValue', e.target.value)}
                    placeholder={t('tests.after.results.hardnessValue')}
                    disabled={loading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>{t('common.unit')}</Form.Label>
                  <Select
                    value={getSelectedOption(hardnessUnitOptions, result.ecd?.hardnessUnit)}
                    onChange={(option) => handleEcdChange(resultIndex, 'hardnessUnit', option)}
                    options={hardnessUnitOptions}
                    placeholder={t('tests.after.results.hardnessUnit')}
                    isDisabled={loading}
                    styles={selectStyles}
                    isClearable
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
                {result.ecd?.ecdPoints?.map((point, positionIndex) => (
                  <tr key={`ecd-position-${resultIndex}-${positionIndex}`}>
                    <td>
                      <Form.Control
                        type="text"
                        value={point.name || ''}
                        onChange={(e) => handleEcdPositionChange(resultIndex, positionIndex, 'name', e.target.value)}
                        placeholder={t('tests.after.results.enterPosition')}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        value={point.distance || ''}
                        onChange={(e) => handleEcdPositionChange(resultIndex, positionIndex, 'distance', e.target.value)}
                        placeholder={t('tests.after.results.enterDistance')}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Select
                        value={point.unit 
                          ? getSelectedOption(lengthUnitOptions, point.unit) 
                          : lengthUnitOptions[0] || null}
                        onChange={(option) => handleEcdPositionChange(resultIndex, positionIndex, 'unit', option)}
                        options={lengthUnitOptions}
                        placeholder={t('common.selectUnit')}
                        isDisabled={loading}
                        menuPortalTarget={document.body}
                        styles={{
                          ...selectStyles,
                          menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                        isClearable
                      />
                    </td>
                    <td className="text-center">
                      {result.ecd?.ecdPoints?.length > 1 ? (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleEcdPositionRemove(resultIndex, positionIndex)}
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
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleEcdPositionAdd(resultIndex)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addPoint')}
              </Button>
            </div>
          </Form.Group>

          <CollapsibleSection
            title={t('tests.after.results.resultCurve.title')}
            isExpandedByDefault={false}
            sectionId={`test-hardness-curve-${resultIndex}`}
            rememberState={true}
            level={1}
            className="mb-3"
          >
            <ResultCurveSection
              result={result}
              resultIndex={resultIndex}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              getSelectedOption={getSelectedOption}
              hardnessUnitOptions={hardnessUnitOptions}
              loading={loading}
              selectStyles={selectStyles}
              test={test}
              formData={formData}
              parentId={parentId}
            />
          </CollapsibleSection>
          
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.after.results.comment')}</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={result.comment || ''}
              onChange={(e) => handleResultChange(resultIndex, 'comment', e.target.value)}
              disabled={loading}
            />
          </Form.Group>
          
          <CollapsibleSection
            title={t('tests.after.results.controlLocation.title')}
            isExpandedByDefault={false}
            sectionId={`test-control-location-${resultIndex}`}
            rememberState={true}
            level={1}
            className="mb-3"
          >
            <ControlLocationSection
              testNodeId={test ? test.id : null}
              resultIndex={resultIndex}
              onFileAssociationNeeded={handleFileAssociationNeeded}
            />
          </CollapsibleSection>
          
          <CollapsibleSection
            title={t('tests.after.results.micrographs.title')}
            isExpandedByDefault={false}
            sectionId={`test-micrographs-${resultIndex}`}
            rememberState={true}
            level={1}
          >  
            <MicrographsSection
              testNodeId={test ? test.id : null}
              resultIndex={resultIndex}
              onFileAssociationNeeded={handleFileAssociationNeeded}
            />
          </CollapsibleSection>
        </CollapsibleSection>
      ))}
    </div>
  );
};

export default ResultsDataSection;
