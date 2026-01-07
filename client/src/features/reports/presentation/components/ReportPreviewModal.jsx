/**
 * PRESENTATION: Modal de prévisualisation du rapport PDF
 * Affiche l'aperçu du PDF généré avec React-PDF
 */

import React from 'react';
import { Modal, Button, Alert, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const ReportPreviewModal = ({ 
  show, 
  handleClose, 
  previewData,
  loading = false,
  progress = null,
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
        {loading || !previewData ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
            <div className="text-center" style={{ width: '500px', padding: '40px' }}>
              <div className="mb-4">
                <FontAwesomeIcon icon={faFilePdf} className="text-danger" style={{ fontSize: '4rem' }} />
              </div>
              <h5 className="text-white font-weight-bold mb-2">
                {progress?.message || t('report.preview.loading', 'Génération de l\'aperçu en cours...')}
              </h5>
              <p className="text-white-50 small mb-4">
                {t('report.preview.loadingHint', 'Cela peut prendre quelques instants selon le nombre d\'images et la complexité du rapport.')}
              </p>
              {progress?.progress !== undefined ? (
                <>
                  <ProgressBar 
                    now={progress.progress} 
                    variant="danger"
                    style={{ height: '12px' }}
                    className="mb-2"
                  />
                  <small className="text-white-50">{Math.round(progress.progress)}%</small>
                </>
              ) : (
                <ProgressBar 
                  animated 
                  striped 
                  variant="danger" 
                  now={100} 
                  style={{ height: '8px' }}
                />
              )}
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
