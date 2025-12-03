import React, { forwardRef, useImperativeHandle } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useTrialRequestForm from '../hooks/useTrialRequestForm';
import CloseConfirmationModal from '../../../common/CloseConfirmation/CloseConfirmationModal';
import ContactsSection from './sections/contacts/ContactsSection'
import DocumentsSection from './sections/documents/DocumentsSection'
import GeneralInfoSection from './sections/general_infos/GeneralInfoSection'
import CollapsibleSection from '../../../common/CollapsibleSection/CollapsibleSection';

const TrialRequestForm = forwardRef(({ order, clientId, onClose, onOrderCreated, onOrderUpdated, viewMode = false }, ref) => {
  const { t } = useTranslation();

  const {
    formData,
    errors,
    loading,
    fetchingOrder,
    message,
    handleChange,
    handleContactChange,
    addContact,
    removeContact,
    handleSubmit,
    showConfirmModal,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose,
    handleFileAssociationNeeded,
    // Copy/Paste functionality
    handleCopy,
    handlePaste
  } = useTrialRequestForm(order, onClose, onOrderCreated, onOrderUpdated, viewMode, clientId);

  // Exposer handleCloseRequest et les fonctions Copy/Paste à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest,
    handleCopy,
    handlePaste
  }));

  if (fetchingOrder) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  // Style pour les champs en mode lecture seule
  const readOnlyFieldStyle = viewMode ? {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    cursor: 'default'
  } : {};

  return (
    <div>
      {message && (
        <div className={`alert alert-${message.type} mb-3`}>
          {message.text}
        </div>
      )}
      {errors.parent && (
        <div className="alert alert-danger mb-3">
          {errors.parent}
        </div>
      )}
      
      {/* Légende pour les champs obligatoires - masquée en mode lecture seule */}
      {!viewMode && (
        <div className="text-muted small mb-3">
          <span className="text-danger fw-bold">*</span> {t('form.requiredFields')}
        </div>
      )}
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        <CollapsibleSection
          title={t('orders.sections.basicInfo')}
          isExpandedByDefault={true}
          sectionId="order-general-info"
          rememberState={true}
        >
          <GeneralInfoSection
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            viewMode={viewMode}
            readOnlyFieldStyle={readOnlyFieldStyle}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('orders.sections.contacts')}
          isExpandedByDefault={true}
          sectionId="order-contacts"
          rememberState={true}
        >
          <ContactsSection
            formData={formData}
            handleContactChange={handleContactChange}
            addContact={addContact}
            removeContact={removeContact}
            viewMode={viewMode}
            readOnlyFieldStyle={readOnlyFieldStyle}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title={t('orders.sections.documents')}
          isExpandedByDefault={true}
          sectionId="order-documents"
          rememberState={true}
        >
          <DocumentsSection
            orderNodeId={order ? order.id : null}
            onFileAssociationNeeded={handleFileAssociationNeeded}
            viewMode={viewMode}
          />
        </CollapsibleSection>

        <div className="d-flex justify-content-end mt-3">
          {viewMode ? (
            <Button variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleCloseRequest} className="mr-2">
                {t('common.cancel')}
              </Button>
              <Button variant="warning" type="submit" disabled={loading}>
                {loading 
                  ? (order ? t('common.modifying') : t('common.creating')) 
                  : (order ? t('common.edit') : t('common.create'))}
              </Button>
            </>
          )}
        </div>
      </Form>

      {/* Modal de confirmation pour la fermeture - non affiché en mode lecture seule */}
      {!viewMode && (
        <CloseConfirmationModal
          show={showConfirmModal}
          onHide={cancelClose}
          onCancel={cancelClose}
          onContinue={confirmClose}
          onSave={saveAndClose}
          title={t('closeModal.title')}
          message={t('closeModal.unsavedChanges')}
        />
      )}
    </div>
  );
});

export default TrialRequestForm;
