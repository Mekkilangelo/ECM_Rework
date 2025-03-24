import React, { useState } from 'react';
import { Form, Button, Tabs, Tab, Spinner } from 'react-bootstrap';
import useTestForm from './hooks/useTestForm';

// Sections importées
import BasicInfoSection from './sections/BasicInfoSection';
import BeforeTabContent from './sections/before/BeforeTabContent';
import AfterTabContent from './sections/after/AfterTabContent';

const TestForm = ({ test, onClose, onTestCreated, onTestUpdated }) => {
  const {
    formData,
    errors,
    loading,
    fetchingTest,
    message,
    ...formHandlers
  } = useTestForm(test, onClose, onTestCreated, onTestUpdated);

  // État pour gérer l'onglet actif
  const [activeTab, setActiveTab] = useState('before');

  // Fonction pour gérer le changement d'onglet
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Détermine si nous sommes en mode édition
  const isEditMode = Boolean(test);

  if (fetchingTest) {
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
      
      <Form onSubmit={formHandlers.handleSubmit}>
        {/* Section BasicInfo toujours visible */}
        <BasicInfoSection
          formData={formData}
          errors={errors}
          handleChange={formHandlers.handleChange}
          handleSelectChange={formHandlers.handleSelectChange}
          getSelectedOption={formHandlers.getSelectedOption}
          locationOptions={formHandlers.locationOptions}
          statusOptions={formHandlers.statusOptions}
          loading={loading}
          selectStyles={formHandlers.selectStyles}
        />
        
        {/* Affichage conditionnel des onglets en fonction du mode */}
        {isEditMode ? (
          <Tabs
            activeKey={activeTab}
            onSelect={handleTabChange}
            className="mb-4 mt-4"
            id="test-form-tabs"
          >
            <Tab eventKey="before" title="Before">
              <BeforeTabContent 
                formData={formData}
                errors={errors}
                loading={loading}
                formHandlers={formHandlers}
              />
            </Tab>
            <Tab eventKey="after" title="After">
              <AfterTabContent 
                formData={formData}
                errors={errors}
                loading={loading}
                formHandlers={formHandlers}
              />
            </Tab>
            <Tab eventKey="report" title="Report">
              <ReportTabContent />
            </Tab>
          </Tabs>
        ) : (
          // En mode création, on affiche directement le contenu de l'onglet "Before"
          <div className="mt-4">
            <BeforeTabContent 
              formData={formData}
              errors={errors}
              loading={loading}
              formHandlers={formHandlers}
            />
          </div>
        )}

        {/* Boutons de soumission */}
        <div className="d-flex justify-content-end mt-4">
          <Button variant="secondary" onClick={onClose} className="me-2">
            Annuler
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (isEditMode ? 'Modification en cours...' : 'Création en cours...') : (isEditMode ? 'Modifier' : 'Créer')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

// Composant pour l'onglet "Report" (à implémenter selon vos besoins)
const ReportTabContent = () => (
  <div className="p-3 text-muted">
    {/* Remplacez ce contenu placeholder par vos sections d'onglet Report */}
    <h4>Rapport de Test</h4>
    <p>Contenu de l'onglet Report à implémenter</p>
  </div>
);

export default TestForm;