import React, { forwardRef, useImperativeHandle, useCallback, useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useOrderForm from './hooks/useOrderForm';
import CloseConfirmationModal from '../../common/CloseConfirmation/CloseConfirmationModal';
import ContactsSection from './sections/ContactsSection'
import DocumentsSection from './sections/DocumentsSection'
import GeneralInfoSection from './sections/GeneralInfoSection'
import CollapsibleSection from '../../common/CollapsibleSection/CollapsibleSection';

const OrderForm = forwardRef(({ order, onClose, onOrderCreated, onOrderUpdated }, ref) => {
  const { t } = useTranslation();
  const [fileAssociationMethod, setFileAssociationMethod] = useState(null);

  const handleFileAssociationNeeded = useCallback((associateFilesFunc) => {
    setFileAssociationMethod(() => associateFilesFunc);
  }, []);

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
    setFileAssociationCallback
  } = useOrderForm(order, onClose, onOrderCreated, onOrderUpdated);

  // Mettre à jour le callback d'association de fichiers dans le hook quand il change
  React.useEffect(() => {
    if (setFileAssociationCallback && fileAssociationMethod) {
      console.log("Setting file association callback in OrderForm");
      setFileAssociationCallback(() => fileAssociationMethod);
    }
  }, [fileAssociationMethod, setFileAssociationCallback]);  

  // Exposer handleCloseRequest à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest
  }));

  if (fetchingOrder) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

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
      
      {/* Légende pour les champs obligatoires */}
      <div className="text-muted small mb-3">
        <span className="text-danger fw-bold">*</span> {t('form.requiredFields')}
      </div>
      
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
          />
        </CollapsibleSection>

        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={handleCloseRequest} className="mr-2">
            {t('common.cancel')}
          </Button>
          <Button variant="warning" type="submit" disabled={loading}>
            {loading 
              ? (order ? t('common.modifying') : t('common.creating')) 
              : (order ? t('common.edit') : t('common.create'))}
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

export default OrderForm;
