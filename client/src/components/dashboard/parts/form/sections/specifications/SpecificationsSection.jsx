import React from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import CreatableSelect from 'react-select/creatable';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../../common/CollapsibleSection/CollapsibleSection';
import { isValidNewOption, customFilterOption, sortOptionsByRelevance } from '../../../../../../utils/selectHelpers';

const SpecificationsSection = ({
  formData,
  handleCreateOption,
  getSelectedOption,
  hardnessUnitOptions,
  depthUnitOptions,
  loading,
  selectStyles,
  viewMode = false,
  readOnlyFieldStyle = {},
  // Nouveaux handlers dédiés
  addHardnessSpec,
  removeHardnessSpec,
  updateHardnessSpec,
  addEcdSpec,
  removeEcdSpec,
  updateEcdSpec
}) => {
  const { t } = useTranslation();

  // Styles compact pour les selects d'unités
  const unitSelectStyles = {
    ...selectStyles,
    container: (provided) => ({
      ...provided,
      width: '100%',
    }),
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      height: '38px',
      fontSize: '0.9rem',
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '38px',
      padding: '0 6px',
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    singleValue: (provided) => ({
      ...provided,
      fontSize: '0.9rem',
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '38px',
    }),
  };

  // Styles modifiés pour le mode lecture seule
  const customSelectStyles = viewMode ? {
    ...unitSelectStyles,
    control: (provided) => ({
      ...provided,
      ...readOnlyFieldStyle,
      cursor: 'default'
    }),
    dropdownIndicator: () => ({ display: 'none' }),
    indicatorSeparator: () => ({ display: 'none' })
  } : unitSelectStyles;

  // Initialiser les spécifications si elles n'existent pas
  const hardnessSpecs = formData.hardnessSpecs || [];
  const ecdSpecs = formData.ecdSpecs || [];
  // Fonction pour créer de nouvelles unités
  const handleCreateHardnessUnit = (inputValue, specIndex, specType) => {
    return handleCreateOption(inputValue, `${specType}Unit_${specIndex}`, 'units', 'hardness_units');
  };

  const handleCreateDepthUnit = (inputValue, specIndex) => {
    return handleCreateOption(inputValue, `depthUnit_${specIndex}`, 'units', 'depth_units');
  };
  return (
    <>
      {/* Section Spécifications de Dureté */}
      <CollapsibleSection
        title={t('parts.specifications.hardnessSpecs')}
        isExpandedByDefault={false}
        sectionId="hardness-specifications"
        rememberState={true}
        level={1}
      >
        <div className="d-flex justify-content-end mb-3">
          {!viewMode && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={addHardnessSpec}
              className="d-flex align-items-center gap-1"
            >
              <FontAwesomeIcon icon={faPlus} />
              {t('common.add')}
            </Button>
          )}
        </div>
        
        {hardnessSpecs.length === 0 ? (
          <p className="text-muted mb-0 text-center py-2">
            {t('parts.specifications.noHardnessSpecs')}
          </p>        ) : (
          hardnessSpecs.map((spec, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-4">
                  <Form.Group>
                    <Form.Label className="small">{t('common.name')}</Form.Label>
                    <Form.Control
                      type="text"
                      value={spec.name || ''}
                      onChange={(e) => updateHardnessSpec(index, 'name', e.target.value)}
                      placeholder={t('parts.specifications.hardnessName')}
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>                <div className="col">
                  <Form.Group>
                    <Form.Label className="small">{t('common.min')}</Form.Label>
                    <Form.Control
                      type="number"
                      value={spec.min || ''}
                      onChange={(e) => updateHardnessSpec(index, 'min', e.target.value)}
                      step="0.01"
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>
                <div className="col">                  <Form.Group>
                    <Form.Label className="small">{t('common.max')}</Form.Label>
                    <Form.Control
                      type="number"
                      value={spec.max || ''}
                      onChange={(e) => updateHardnessSpec(index, 'max', e.target.value)}
                      step="0.01"
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>
                <div className="col-auto" style={{ minWidth: '150px' }}>
                  <Form.Group>
                    <Form.Label className="small">{t('common.unit')}</Form.Label>
                    <CreatableSelect
                      value={spec.unit
                        ? getSelectedOption(hardnessUnitOptions, spec.unit)
                        : null}
                      onChange={(option) => updateHardnessSpec(index, 'unit', option?.value || '')}
                      options={sortOptionsByRelevance(hardnessUnitOptions || [], spec.unit || '')}
                      isClearable={!viewMode}
                      styles={customSelectStyles}
                      placeholder={t('common.selectUnit')}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isLoading={loading && (!hardnessUnitOptions || !hardnessUnitOptions.length)}
                      formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
                      onCreateOption={(inputValue) => handleCreateHardnessUnit(inputValue, index, 'hardness')}
                      isDisabled={viewMode}
                      isValidNewOption={isValidNewOption}
                      filterOption={customFilterOption}
                    />
                  </Form.Group>
                </div>
                {!viewMode && (
                  <div className="col-auto">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeHardnessSpec(index)}
                      className="d-flex align-items-center"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CollapsibleSection>      {/* Section Spécifications ECD */}
      <CollapsibleSection
        title={t('parts.specifications.ecdSpecs')}
        isExpandedByDefault={false}
        sectionId="ecd-specifications"
        rememberState={true}
        level={1}
      >
        <div className="d-flex justify-content-end mb-3">
          {!viewMode && (
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={addEcdSpec}
              className="d-flex align-items-center gap-1"
            >
              <FontAwesomeIcon icon={faPlus} />
              {t('common.add')}
            </Button>
          )}
        </div>
        
        {ecdSpecs.length === 0 ? (
          <p className="text-muted mb-0 text-center py-2">
            {t('parts.specifications.noEcdSpecs')}
          </p>
        ) : (          ecdSpecs.map((spec, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row g-2 mb-2">
                <div className="col-md-12">
                  <Form.Group>
                    <Form.Label className="small">{t('common.name')}</Form.Label>                    <Form.Control
                      type="text"
                      value={spec.name || ''}
                      onChange={(e) => updateEcdSpec(index, 'name', e.target.value)}
                      placeholder={t('parts.specifications.ecdName')}
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>
              </div>
              
              {/* Ligne pour la profondeur */}
              <div className="row g-2 mb-2">
                <div className="col">
                  <Form.Group>
                    <Form.Label className="small">{t('parts.specifications.depthMin')}</Form.Label>                    <Form.Control
                      type="number"
                      value={spec.depthMin || ''}
                      onChange={(e) => updateEcdSpec(index, 'depthMin', e.target.value)}
                      step="0.01"
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>
                <div className="col">
                  <Form.Group>
                    <Form.Label className="small">{t('parts.specifications.depthMax')}</Form.Label>                    <Form.Control
                      type="number"
                      value={spec.depthMax || ''}
                      onChange={(e) => updateEcdSpec(index, 'depthMax', e.target.value)}
                      step="0.01"
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>
                <div className="col-auto" style={{ minWidth: '150px' }}>
                  <Form.Group>
                    <Form.Label className="small">{t('parts.specifications.depthUnit')}</Form.Label>
                    <CreatableSelect
                      value={spec.depthUnit
                        ? getSelectedOption(depthUnitOptions, spec.depthUnit)
                        : null}
                      onChange={(option) => updateEcdSpec(index, 'depthUnit', option?.value || '')}
                      options={sortOptionsByRelevance(depthUnitOptions || [], spec.depthUnit || '')}
                      isClearable={!viewMode}
                      styles={customSelectStyles}
                      placeholder={t('common.selectUnit')}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isLoading={loading && (!depthUnitOptions || !depthUnitOptions.length)}
                      formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
                      onCreateOption={(inputValue) => handleCreateDepthUnit(inputValue, index)}
                      isDisabled={viewMode}
                      isValidNewOption={isValidNewOption}
                      filterOption={customFilterOption}
                    />
                  </Form.Group>
                </div>
              </div>
              
              {/* Ligne pour la dureté */}
              <div className="row g-2 align-items-end">
                <div className="col">
                  <Form.Group>
                    <Form.Label className="small">{t('parts.specifications.ecdHardness')}</Form.Label>                    <Form.Control
                      type="number"
                      value={spec.hardness || ''}
                      onChange={(e) => updateEcdSpec(index, 'hardness', e.target.value)}
                      step="0.01"
                      size="sm"
                      disabled={viewMode}
                      readOnly={viewMode}
                      style={viewMode ? readOnlyFieldStyle : {}}
                    />
                  </Form.Group>
                </div>
                <div className="col-auto" style={{ minWidth: '150px' }}>
                  <Form.Group>
                    <Form.Label className="small">{t('parts.specifications.hardnessUnit')}</Form.Label>
                    <CreatableSelect
                      value={spec.hardnessUnit
                        ? getSelectedOption(hardnessUnitOptions, spec.hardnessUnit)
                        : null}
                      onChange={(option) => updateEcdSpec(index, 'hardnessUnit', option?.value || '')}
                      options={sortOptionsByRelevance(hardnessUnitOptions || [], spec.hardnessUnit || '')}
                      isClearable={!viewMode}
                      styles={customSelectStyles}
                      placeholder={t('common.selectUnit')}
                      className="react-select-container"
                      classNamePrefix="react-select"
                      isLoading={loading && (!hardnessUnitOptions || !hardnessUnitOptions.length)}
                      formatCreateLabel={(inputValue) => `${t('common.addOption')} "${inputValue}"`}
                      onCreateOption={(inputValue) => handleCreateHardnessUnit(inputValue, index, 'ecd')}
                      isDisabled={viewMode}
                      isValidNewOption={isValidNewOption}
                      filterOption={customFilterOption}
                    />
                  </Form.Group>
                </div>
                {!viewMode && (
                  <div className="col-auto">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => removeEcdSpec(index)}
                      className="d-flex align-items-center"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CollapsibleSection>
    </>
  );
};

export default SpecificationsSection;
