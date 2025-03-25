// src/components/dashboard/orders/OrderForm.jsx
import React, { forwardRef, useImperativeHandle } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import useOrderForm from './hooks/useOrderForm';
import fileService from '../../../services/fileService';
import CloseConfirmationModal from '../../common/CloseConfirmation/CloseConfirmationModal';
import CollapsibleSection from '../../common/CollapsibleSection/CollapsibleSection';

// Import des sections
import GeneralInfoSection from './sections/GeneralInfoSection';
import ContactsSection from './sections/ContactsSection';
import DocumentsSection from './sections/DocumentsSection';

const OrderForm = forwardRef(({ order, onClose, onOrderCreated, onOrderUpdated }, ref) => {
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
    tempFileId,
    setTempFileId,
    // Propriétés pour la confirmation de fermeture
    showConfirmModal,
    pendingClose,
    handleCloseRequest,
    confirmClose,
    cancelClose,
    saveAndClose
  } = useOrderForm(order, onClose, onOrderCreated, onOrderUpdated);

  // Exposer handleCloseRequest à travers la référence
  useImperativeHandle(ref, () => ({
    handleCloseRequest
  }));

  // Fonction qui sera appelée après la création d'un order pour associer les fichiers
  const associateFilesToNewOrder = async (orderId) => {
    if (tempFileId) {
      try {
        await fileService.associateFiles(orderId, tempFileId);
        // Mettre à jour l'état ou afficher un message de succès
      } catch (error) {
        console.error('Erreur lors de l\'association des fichiers:', error);
        // Gérer l'erreur
      }
    }
  };
  
  if (fetchingOrder) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  // Déterminer si nous avons un ID d'ordre pour le FileUploader
  const orderId = order?.id || null;
  const isEditing = !!orderId;

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
      
      <Form onSubmit={handleSubmit} autoComplete="off">
        {/* Section Informations générales */}
        <CollapsibleSection 
          title="Informations générales" 
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
        
        {/* Section Contacts */}
        <CollapsibleSection 
          title="Contacts" 
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

        {/* Section Documents */}
        <CollapsibleSection 
          title="Documents" 
          isExpandedByDefault={true}
          sectionId="order-documents"
          rememberState={true}
        >
          <DocumentsSection 
            orderId={orderId}
            setTempFileId={setTempFileId}
          />
        </CollapsibleSection>

        {/* Boutons d'action */}
        <div className="d-flex justify-content-end mt-3">
          <Button variant="secondary" onClick={handleCloseRequest} className="me-2">
            Annuler
          </Button>
          <Button variant="danger" type="submit" disabled={loading}>
            {loading ? (order ? 'Modification en cours...' : 'Création en cours...') : (order ? 'Modifier' : 'Créer')}
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
        title="Confirmer la fermeture"
        message="Vous avez des modifications non enregistrées."
      />
    </div>
  );
});

export default OrderForm;
