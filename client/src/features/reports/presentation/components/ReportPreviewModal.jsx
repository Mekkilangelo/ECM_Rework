/**
 * PRESENTATION: Modal de prévisualisation du rapport PDF
 * Affiche l'aperçu du PDF généré avec React-PDF
 */

import React from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ReportPreviewModal = ({ 
  show, 
  handleClose, 
  previewData,
  onDownload
}) => {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      size="xl" 
      fullscreen
      centered
    >
      <Modal.Header closeButton className="bg-light">
        <Modal.Title>
          <FontAwesomeIcon icon={faDownload} className="me-2 text-danger" />
          {t('report.preview.title', 'Aperçu du rapport')}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0 bg-secondary">
        {!previewData ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <div className="text-center">
              <Spinner animation="border" variant="danger" size="lg" />
              <p className="mt-3 text-white">
                {t('report.preview.loading', 'Génération de l\'aperçu en cours...')}
              </p>
            </div>
          </div>
        ) : previewData.url ? (
          <iframe
            src={previewData.url}
            style={{ 
              width: '100%', 
              height: '80vh',
              border: 'none'
            }}
            title={t('report.preview.iframe.title', 'Aperçu du rapport PDF')}
          />
        ) : (
          <Alert variant="warning" className="m-3">
            <FontAwesomeIcon icon={faTimes} className="me-2" />
            {t('report.preview.error', 'Impossible de charger l\'aperçu')}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <div className="d-flex justify-content-between w-100 align-items-center">
          <div className="text-muted small">
            {previewData?.size && (
              <span>
                {t('report.preview.size', 'Taille')}: {(previewData.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </div>
          <div>
            <Button 
              variant="secondary" 
              onClick={handleClose}
              className="me-2"
            >
              <FontAwesomeIcon icon={faTimes} className="me-1" />
              {t('common.close', 'Fermer')}
            </Button>
            {previewData?.url && onDownload && (
              <Button 
                variant="success" 
                onClick={onDownload}
              >
                <FontAwesomeIcon icon={faDownload} className="me-1" />
                {t('report.actions.download', 'Télécharger PDF')}
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(ReportPreviewModal);
