import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faCheckCircle, faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import TrialForm from './TrialForm';
import FormHeader from '../../../common/FormHeader/FormHeader';
import './TrialFormWithSideNavigation.css';

const TrialFormWithSideNavigation = forwardRef(({ 
  show, 
  onHide, 
  trial, 
  onClose, 
  onTrialCreated, 
  onTrialUpdated, 
  viewMode = false,
  title,
  onCopy,
  onPaste,
  partId
}, ref) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('before');
  const [isMobile, setIsMobile] = useState(false);
  const trialFormRef = React.useRef();

  // Détecter la taille d'écran pour responsive
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Exposer les méthodes du TrialForm via le ref
  useImperativeHandle(ref, () => ({
    handleCloseRequest: () => {
      if (trialFormRef.current && trialFormRef.current.handleCloseRequest) {
        trialFormRef.current.handleCloseRequest();
      } else {
        onHide();
      }
    },
    handleCopy: () => {
      if (trialFormRef.current && trialFormRef.current.handleCopy) {
        trialFormRef.current.handleCopy();
      }
    },
    handlePaste: () => {
      if (trialFormRef.current && trialFormRef.current.handlePaste) {
        trialFormRef.current.handlePaste();
      }
    }
  }));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      onHide();
    }
  };

  // Détecter si c'est en mode édition (trial existe)
  const isEditMode = !!trial;

  // Si c'est mobile, utiliser Modal standard
  if (isMobile) {
    return (
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        backdrop={true}
        keyboard={true}
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={title}
            onCopy={onCopy}
            onPaste={onPaste}
            viewMode={viewMode}
          />
        </Modal.Header>
        <Modal.Body>
          <TrialForm
            ref={trialFormRef}
            trial={trial}
            partId={partId}
            onClose={handleClose}
            onTrialCreated={onTrialCreated}
            onTrialUpdated={onTrialUpdated}
            viewMode={viewMode}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            useExternalNavigation={false}
          />
        </Modal.Body>
      </Modal>
    );
  }

  // Version desktop avec navigation externe
  return (
    <>
      {/* Navigation verticale externe - seulement si en mode édition et desktop */}
      {show && isEditMode && (
        <div className="trial-external-navigation">
          {[
            { key: 'before', label: t('trials.tabs.before'), icon: faFlask },
            { key: 'after', label: t('trials.tabs.after'), icon: faCheckCircle },
            { key: 'report', label: t('trials.tabs.report'), icon: faFileAlt }
          ].map((item) => (
            <div key={item.key} className="trial-nav-item">
              <div
                className={`trial-nav-button ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => handleTabChange(item.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTabChange(item.key);
                  }
                }}
              >
                <FontAwesomeIcon icon={item.icon} className="trial-nav-icon" />
                <span className="trial-nav-text">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal principal */}
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        className={`trial-modal ${isEditMode && !isMobile ? 'with-external-nav' : ''}`}
        backdrop={true}
        keyboard={true}
      >
        <Modal.Header closeButton className="bg-light">
          <FormHeader 
            title={title}
            onCopy={onCopy}
            onPaste={onPaste}
            viewMode={viewMode}
          />
        </Modal.Header>
        <Modal.Body>
          <TrialForm
            ref={trialFormRef}
            trial={trial}
            partId={partId}
            onClose={handleClose}
            onTrialCreated={onTrialCreated}
            onTrialUpdated={onTrialUpdated}
            viewMode={viewMode}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            useExternalNavigation={isEditMode && !isMobile}
          />
        </Modal.Body>
      </Modal>
    </>
  );
});

TrialFormWithSideNavigation.displayName = 'TrialFormWithSideNavigation';

export default TrialFormWithSideNavigation;