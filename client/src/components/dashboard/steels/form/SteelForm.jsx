import React, { useImperativeHandle, forwardRef } from 'react';
import { Form, Button, Row, Col, Spinner, Table } from 'react-bootstrap';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import useSteelForm from '../hooks/useSteelForm';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../context/ThemeContext';
import CloseConfirmationModal from '../../../common/CloseConfirmation/CloseConfirmationModal';
import { isValidNewOption, customFilterOption } from '../../../../utils/selectHelpers';

const SteelForm = forwardRef(({ steel, onClose, onSteelCreated, onSteelUpdated, viewMode = false }, ref) => {
  const { t } = useTranslation();
  const { isDarkTheme } = useTheme();
  
  const {
    formData,
    errors,
    loading,
    fetchingSteel,
    message,
    steelFamilyOptions,
    steelStandardOptions,
    steelGradeOptions,
    elementOptions,
    selectStyles,
    getSelectedOption,
    handleChange,
    handleSelectChange,
    handleSubmit,
    handleAddEquivalent,
    handleRemoveEquivalent,
    handleAddChemicalElement,
    handleRemoveChemicalElement,
    handleChemicalElementChange,
    handleRateTypeChange,
    handleEquivalentChange,
    // Fonctions pour CreatableSelect
    handleCreateFamily,
    handleCreateStandard,
    handleCreateElement,
    handleCreateGrade,
    // Gestion de la confirmation de fermeture
    showConfirmModal,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    // Copy/Paste functionality
    handleCopy,
    handlePaste
  } = useSteelForm(steel, onClose, onSteelCreated, onSteelUpdated, viewMode);
  
  // Exposer handleCloseRequest et copy/paste à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest,
    handleCopy,
    handlePaste
  }));
  
  if (fetchingSteel) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  // Style pour les champs en mode lecture seule - adapté au thème
  const readOnlyFieldStyle = viewMode ? {
    backgroundColor: isDarkTheme ? 'var(--dark-input-bg)' : '#f8f9fa',
    border: isDarkTheme ? '1px solid var(--dark-input-border)' : '1px solid #dee2e6',
    color: isDarkTheme ? 'var(--dark-text-primary)' : '#212529',
    cursor: 'default'
  } : {};

  // Style pour tous les champs en mode sombre (même en édition)
  const inputFieldStyle = isDarkTheme ? {
    backgroundColor: 'var(--dark-input-bg)',
    border: '1px solid var(--dark-input-border)',
    color: 'var(--dark-text-primary)'
  } : (viewMode ? readOnlyFieldStyle : {});

  // Style pour les en-têtes de tableau en mode sombre
  const tableHeaderStyle = isDarkTheme ? {
    backgroundColor: 'var(--dark-bg-secondary)',
    color: 'var(--dark-text-primary)',
    borderColor: 'var(--dark-input-border)'
  } : {};

  // Styles pour les composants Select - adaptés au thème sombre même en édition
  const getSelectStylesForViewMode = () => {
    return {
      ...selectStyles,
      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      control: (base) => ({ 
        ...base, 
        marginBottom: '5px',
        backgroundColor: isDarkTheme ? 'var(--dark-input-bg)' : (viewMode ? '#f8f9fa' : base.backgroundColor),
        borderColor: isDarkTheme ? 'var(--dark-input-border)' : (viewMode ? '#dee2e6' : base.borderColor),
        cursor: viewMode ? 'default' : base.cursor,
        '&:hover': {
          borderColor: isDarkTheme ? 'var(--dark-input-border)' : (viewMode ? '#dee2e6' : base['&:hover']?.borderColor)
        }
      }),
      valueContainer: (base) => ({
        ...base,
        cursor: viewMode ? 'default' : base.cursor
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkTheme ? 'var(--dark-text-primary)' : (viewMode ? '#212529' : base.color)
      })
    };
  };
  
  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      {/* Légende pour les champs obligatoires - masquée en mode lecture seule */}
      {!viewMode && (
        <div className="text-muted small mb-3">
          <span className="text-danger fw-bold">*</span> {t('form.requiredFields')}
        </div>
      )}
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        <h5>{t('steels.steelInformation')}</h5>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>{t('steels.grade')} {!viewMode && <span className="text-danger fw-bold">*</span>}</Form.Label>
              <Form.Control
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                isInvalid={!viewMode && !!errors.grade}
                autoComplete="off"
                disabled={viewMode || loading}
                readOnly={viewMode}
                style={inputFieldStyle}
              />
              {!viewMode && errors.grade && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  {t(errors.grade)}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          </Col>          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>{t('steels.family')}</Form.Label>
              <CreatableSelect
                styles={getSelectStylesForViewMode()}
                menuPortalTarget={document.body}
                options={steelFamilyOptions}
                value={getSelectedOption(steelFamilyOptions, formData.family)}
                onChange={(option) => handleSelectChange(option, 'family')}
                onCreateOption={viewMode ? undefined : handleCreateFamily}
                formatCreateLabel={(inputValue) => `${t('common.create')}: "${inputValue}"`}
                isClearable={!viewMode}
                placeholder={t('steels.selectFamily')}
                isLoading={loading && steelFamilyOptions.length === 0}
                noOptionsMessage={() => t('steels.noFamilyAvailable')}
                isDisabled={viewMode || loading}
                isValidNewOption={isValidNewOption}
                filterOption={customFilterOption}
              />
              {!viewMode && errors.family && (
                <div className="invalid-feedback" style={{ display: 'block' }}>
                  {t(errors.family)}
                </div>
              )}
            </Form.Group>
          </Col>          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>{t('steels.standard')}</Form.Label>
              <CreatableSelect
                styles={getSelectStylesForViewMode()}
                menuPortalTarget={document.body}
                options={steelStandardOptions}
                value={getSelectedOption(steelStandardOptions, formData.standard)}
                onChange={(option) => handleSelectChange(option, 'standard')}
                onCreateOption={viewMode ? undefined : handleCreateStandard}
                formatCreateLabel={(inputValue) => `${t('common.create')}: "${inputValue}"`}
                isClearable={!viewMode}
                placeholder={t('steels.selectStandard')}
                isLoading={loading && steelStandardOptions.length === 0}
                noOptionsMessage={() => t('steels.noStandardAvailable')}
                isDisabled={viewMode || loading}
                isValidNewOption={isValidNewOption}
                filterOption={customFilterOption}
              />
              {!viewMode && errors.standard && (
                <div className="invalid-feedback" style={{ display: 'block' }}>
                  {t(errors.standard)}
                </div>
              )}
            </Form.Group>
          </Col>
        </Row>
        
        <h5 className="mt-4">{t('steels.equivalents')}</h5>
        <Row>
          <Col md={12}>
            {formData.equivalents.map((equivalent, index) => (              <div key={index} className="d-flex mb-2 align-items-center">
                <div className="flex-grow-1" style={{ paddingRight: '10px' }}>
                  <CreatableSelect
                    styles={getSelectStylesForViewMode()}
                    menuPortalTarget={document.body}
                    options={steelGradeOptions}
                    value={getSelectedOption(steelGradeOptions, equivalent.steel_id)}
                    onChange={(option) => handleEquivalentChange(index, 'steel_id', option?.value)}
                    onCreateOption={handleCreateGrade}
                    formatCreateLabel={(inputValue) => `${t('common.create')}: "${inputValue}"`}
                    isCreatable={!viewMode}
                    placeholder={t('steels.selectEquivalentSteel')}
                    isLoading={loading && steelGradeOptions.length === 0}
                    noOptionsMessage={() => t('steels.noSteelAvailable')}
                    isDisabled={viewMode || loading}
                    isValidNewOption={isValidNewOption}
                    filterOption={customFilterOption}
                  />
                </div>
                {!viewMode && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    className="ms-2"
                    onClick={() => handleRemoveEquivalent(index)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                )}
              </div>
            ))}
            {!viewMode && (
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleAddEquivalent}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('steels.addEquivalent')}
              </Button>
            )}
          </Col>
        </Row>
        
        <h5 className="mt-4">{t('steels.chemicalComposition')}</h5>
        <Row>
          <Col md={12}>
            <Table striped bordered hover responsive style={{ overflow: 'visible' }}>
              <thead>
                <tr>
                  <th style={{ width: '5%', ...tableHeaderStyle }}>#</th>
                  <th style={{ width: '30%', ...tableHeaderStyle }}>{t('steels.element')}</th>
                  <th style={{ width: '20%', ...tableHeaderStyle }}>{t('steels.rate')}</th>
                  <th style={{ width: '35%', ...tableHeaderStyle }}>{t('steels.value')} (%)</th>
                  {!viewMode && (
                    <th style={{ width: '10%', ...tableHeaderStyle }}>{t('common.actions')}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {formData.chemical_elements.map((element, index) => (
                  <tr key={`chemical-element-${index}`}>
                    <td className="text-center align-middle">{index + 1}</td>
                    <td style={{ paddingRight: '10px' }}>
                      <CreatableSelect
                        styles={getSelectStylesForViewMode()}
                        menuPortalTarget={document.body}
                        options={elementOptions}
                        value={getSelectedOption(elementOptions, element.element)}
                        onChange={(option) => handleChemicalElementChange(index, 'element', option?.value)}
                        onCreateOption={async (inputValue) => {
                          if (inputValue && !viewMode) {
                            const createdValue = await handleCreateElement(inputValue);
                            if (createdValue) {
                              handleChemicalElementChange(index, 'element', createdValue);
                            }
                          }
                        }}
                        formatCreateLabel={(inputValue) => `${t('common.create')}: "${inputValue}"`}
                        placeholder={t('steels.element')}
                        isLoading={loading && elementOptions.length === 0}
                        noOptionsMessage={() => t('steels.noElementAvailable')}
                        isDisabled={viewMode || loading}
                        isValidNewOption={isValidNewOption}
                        filterOption={customFilterOption}
                      />
                    </td>
                    <td style={{ paddingRight: '10px' }}>
                      <Select
                        styles={getSelectStylesForViewMode()}
                        menuPortalTarget={document.body}
                        options={[
                          { value: 'exact', label: '=' },
                          { value: 'range', label: 'min - max' },
                        ]}
                        value={getSelectedOption(
                          [
                            { value: 'exact', label: '=' },
                            { value: 'range', label: 'min - max' },
                          ],
                          element.rate_type
                        )}
                        onChange={(option) => handleRateTypeChange(index, option?.value)}
                        placeholder={t('steels.type')}
                        isDisabled={viewMode || loading}
                      />
                    </td>
                    <td>
                      {element.rate_type === 'exact' ? (
                        <Form.Control
                          type="number"
                          step="0.01"
                          value={element.value || ''}
                          onChange={(e) => handleChemicalElementChange(index, 'value', e.target.value)}
                          placeholder={t('steels.value')}
                          disabled={viewMode || loading}
                          readOnly={viewMode}
                          style={inputFieldStyle}
                        />
                      ) : (
                        <div className="d-flex">
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={element.min_value || ''}
                            onChange={(e) => handleChemicalElementChange(index, 'min_value', e.target.value)}
                            placeholder={t('steels.min')}
                            className="me-1"
                            disabled={viewMode || loading}
                            readOnly={viewMode}
                            style={inputFieldStyle}
                          />
                          <Form.Control
                            type="number"
                            step="0.01"
                            value={element.max_value || ''}
                            onChange={(e) => handleChemicalElementChange(index, 'max_value', e.target.value)}
                            placeholder={t('steels.max')}
                            disabled={viewMode || loading}
                            readOnly={viewMode}
                            style={inputFieldStyle}
                          />
                        </div>
                      )}
                    </td>
                    {!viewMode && (
                      <td className="text-center">
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleRemoveChemicalElement(index)}
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
              <Button 
                variant="outline-primary" 
                size="sm" 
                onClick={handleAddChemicalElement}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('steels.addElement')}
              </Button>
            )}
          </Col>
        </Row>
          <div className="d-flex justify-content-end mt-4">
          {viewMode ? (
            <Button variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCloseRequest} className="me-2">
                {t('common.cancel')}
              </Button>
              <Button variant="danger" type="submit" disabled={loading}>
                {loading 
                  ? (steel ? t('steels.modifying') : t('steels.creating')) 
                  : (steel ? t('common.edit') : t('common.create'))}
              </Button>
            </>
          )}        </div>
      </Form>

      {/* Modal de confirmation pour la fermeture - non affiché en mode lecture seule */}
      {!viewMode && (
        <CloseConfirmationModal
          show={showConfirmModal}
          onHide={cancelClose}
          onCancel={cancelClose}
          onContinue={confirmClose}
          onSave={saveAndClose}          title={t('closeModal.title')}
          message={t('closeModal.unsavedChanges')}
        />
      )}
    </div>
  );
});

SteelForm.displayName = 'SteelForm';

export default SteelForm;
