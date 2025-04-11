import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Row, Col, Button, Card, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import MicrographsSection from './MicrographsSection';
import ResultCurveSection from './ResultCurveSection';
import CollapsibleSection from '../../../../common/CollapsibleSection/CollapsibleSection';

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
  loading,
  selectStyles,
  test,
  handleFileAssociationNeeded
}) => {
  const { t } = useTranslation();
  
  // Options pour les select pickers
  const hardnessLocationOptions = [
    { value: 'surface', label: t('tests.after.results.locations.surface') },
    { value: 'pdd', label: t('tests.after.results.locations.pdd') },
    { value: 'coeur', label: t('tests.after.results.locations.core') }
  ];

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
    if (field === 'location' || field === 'unit') {
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

  const handleEcdChange = (resultIndex, location, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    if (!updatedResults[resultIndex].ecd) {
      updatedResults[resultIndex].ecd = {
        hardnessValue: '',
        hardnessUnit: '',
        toothFlank: { distance: '', unit: '' },
        toothRoot: { distance: '', unit: '' }
      };
    }
    if (field === 'unit' || field === 'hardnessUnit') {
      // Pour les champs select
      updatedResults[resultIndex].ecd[field === 'hardnessUnit' ? field : location[field]] = value ? value.value : '';
    } else if (field === 'hardnessValue') {
      // Pour le champ de dureté global
      updatedResults[resultIndex].ecd[field] = value;
    } else {
      // Pour les champs directs
      updatedResults[resultIndex].ecd[location][field] = value;
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
        <Card key={resultIndex} className={`mb-3`}>
          <Card.Header className="d-flex justify-content-between align-items-center bg-light">
            <h6 className="mb-0">{t('tests.after.results.resultNumber', { number: result.step })}</h6>
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
          </Card.Header>
          <Card.Body>
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
                        <Select
                          value={getSelectedOption(hardnessLocationOptions, point.location)}
                          onChange={(option) => handleHardnessChange(resultIndex, hardnessIndex, 'location', option)}
                          options={hardnessLocationOptions}
                          placeholder={t('tests.after.results.selectPosition')}
                          isDisabled={loading}
                          menuPortalTarget={document.body}
                          styles={{
                            ...selectStyles,
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                          }}
                          isClearable
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
              {/* Nouveaux champs Dureté et Unité pour l'ECD */}
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>{t('tests.after.results.hardness')}</Form.Label>
                    <Form.Control
                      type="number"
                      value={result.ecd?.hardnessValue || ''}
                      onChange={(e) => handleEcdChange(resultIndex, null, 'hardnessValue', e.target.value)}
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
                      onChange={(option) => handleEcdChange(resultIndex, null, 'hardnessUnit', option)}
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
                    <th style={{ width: '40%' }}>{t('tests.after.results.position')}</th>
                    <th style={{ width: '30%' }}>{t('tests.after.results.distance')}</th>
                    <th style={{ width: '30%' }}>{t('common.unit')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{t('tests.after.results.toothFlank')}</td>
                    <td>
                      <Form.Control
                        type="number"
                        value={result.ecd?.toothFlank?.distance || ''}
                        onChange={(e) => handleEcdChange(resultIndex, 'toothFlank', 'distance', e.target.value)}
                        placeholder={t('tests.after.results.enterDistance')}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Select
                        value={getSelectedOption(lengthUnitOptions, result.ecd?.toothFlank?.unit)}
                        onChange={(option) => handleEcdChange(resultIndex, 'toothFlank', 'unit', option)}
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
                  </tr>
                  <tr>
                    <td>{t('tests.after.results.toothRoot')}</td>
                    <td>
                      <Form.Control
                        type="number"
                        value={result.ecd?.toothRoot?.distance || ''}
                        onChange={(e) => handleEcdChange(resultIndex, 'toothRoot', 'distance', e.target.value)}
                        placeholder={t('tests.after.results.enterDistance')}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <Select
                        value={getSelectedOption(lengthUnitOptions, result.ecd?.toothRoot?.unit)}
                        onChange={(option) => handleEcdChange(resultIndex, 'toothRoot', 'unit', option)}
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
                  </tr>
                </tbody>
              </Table>
            </Form.Group>
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
              title={t('tests.after.results.micrographs.title')}
              isExpandedByDefault={false}
              sectionId="test-micrographs"
              rememberState={true}
              level={1}
            >  
              <MicrographsSection
                testNodeId={test ? test.id : null}
                resultIndex={resultIndex}
                onFileAssociationNeeded={handleFileAssociationNeeded}
              />
            </CollapsibleSection>
            <CollapsibleSection
              title={t('tests.after.results.resultCurve.title')}
              isExpandedByDefault={false}
              sectionId={`test-hardness-curve-${resultIndex}`}
              rememberState={true}
              level={1}
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
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default ResultsDataSection;
