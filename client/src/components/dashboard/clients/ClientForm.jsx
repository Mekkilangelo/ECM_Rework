import React, { forwardRef, useImperativeHandle } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import Select from 'react-select';
import { useTranslation } from 'react-i18next';
import useClientForm from './hooks/useClientForm';
import CloseConfirmationModal from '../../common/CloseConfirmation/CloseConfirmationModal';

const ClientForm = forwardRef(({ client, onClose, onClientCreated, onClientUpdated }, ref) => {
  const { t } = useTranslation();
  const {
    formData,
    errors,
    loading,
    fetchingClient,
    message,
    countryOptions,
    selectStyles,
    getSelectedOption,
    handleChange,
    handleSelectChange,
    handleSubmit,
    showConfirmModal,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
  } = useClientForm(client, onClose, onClientCreated, onClientUpdated);

  // Exposer handleCloseRequest à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest
  }));

  if (fetchingClient) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      
      {/* Légende pour les champs obligatoires */}
      <div className="text-muted small mb-3">
        <span className="text-danger fw-bold">*</span> {t('form.requiredFields')}
      </div>
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>{t('clients.name')} <span className="text-danger fw-bold">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                isInvalid={!!errors.name}
                autoComplete="off"
              />
              <Form.Control.Feedback type="invalid">
                {errors.name && t(errors.name)}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>{t('clients.country')} <span className="text-danger fw-bold">*</span></Form.Label>
              <Select
                styles={selectStyles}
                options={countryOptions}
                value={getSelectedOption(countryOptions, formData.country)}
                onChange={(option) => handleSelectChange(option, 'country')}
                isClearable
                placeholder={t('clients.selectCountry')}
                isLoading={loading && countryOptions.length === 0}
                noOptionsMessage={() => t('clients.noCountryOptions')}
                isInvalid={!!errors.country}
              />
              {errors.country && (
                <div className="text-danger mt-1 small">
                  {t(errors.country)}
                </div>
              )}
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>{t('clients.city')}</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                autoComplete="off"
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>{t('clients.group')}</Form.Label>
              <Form.Control
                type="text"
                name="client_group"
                value={formData.client_group}
                onChange={handleChange}
                autoComplete="off"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>{t('clients.address')}</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                autoComplete="off"
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>{t('clients.description')}</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                autoComplete="off"
              />
            </Form.Group>
          </Col>
        </Row>
        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={handleCloseRequest} className="mr-2">
            {t('common.cancel')}
          </Button>
          <Button variant="warning" type="submit" disabled={loading}>
            {loading 
              ? (client ? t('clients.modifying') : t('clients.creating')) 
              : (client ? t('common.edit') : t('common.create'))
            }
          </Button>
        </div>
      </Form>
      {/* Modal de confirmation pour la fermeture */}
      <CloseConfirmationModal
        show={showConfirmModal}
        onHide={cancelClose}
        onCancel={cancelClose}
        onContinue={confirmClose}
        onSave={saveAndClose}
        title={t('closeModal.title')}
        message={t('closeModal.unsavedChanges')}
      />
    </div>
  );
});

export default ClientForm;
