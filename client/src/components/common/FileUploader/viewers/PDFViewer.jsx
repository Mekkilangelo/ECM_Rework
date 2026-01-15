import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faSearchPlus,
  faSearchMinus,
  faRotateRight,
  faDownload,
  faExpand,
  faCompress,
  faThList
} from '@fortawesome/free-solid-svg-icons';
import { Button, ButtonGroup, Spinner } from 'react-bootstrap';
import './PDFViewer.css';

// Configuration du worker PDF.js en local (pas de connexion Internet requise)
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.mjs`;

const PDFViewer = ({ fileUrl, fileName }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isFullWidth, setIsFullWidth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('scroll'); // 'scroll' ou 'single'

  const isDarkTheme = document.documentElement.classList.contains('dark-theme');

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Erreur de chargement du PDF:', error);
    setError('Impossible de charger le PDF');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.5, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const rotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const toggleFullWidth = () => {
    setIsFullWidth((prev) => !prev);
  };

  const toggleViewMode = () => {
    setViewMode((prev) => prev === 'scroll' ? 'single' : 'scroll');
  };

  const getScalePercentage = () => {
    return Math.round(scale * 100);
  };

  if (error) {
    return (
      <div className="pdf-viewer-error">
        <div className="alert alert-danger">
          <p>{error}</p>
          <a href={fileUrl} className="btn btn-primary mt-2" download={fileName}>
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Télécharger le PDF
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer-container ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="pdf-controls">
        <div className="pdf-controls-left">
          <ButtonGroup size="sm">
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || viewMode === 'scroll'}
              title="Page précédente"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              disabled
              className="page-indicator"
            >
              {loading ? '...' : viewMode === 'scroll' ? `${numPages} pages` : `${pageNumber} / ${numPages}`}
            </Button>
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || viewMode === 'scroll'}
              title="Page suivante"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          </ButtonGroup>
        </div>

        <div className="pdf-controls-center">
          <ButtonGroup size="sm">
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={zoomOut}
              disabled={scale <= 0.5}
              title="Zoom arrière"
            >
              <FontAwesomeIcon icon={faSearchMinus} />
            </Button>
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              disabled
              className="zoom-indicator"
            >
              {getScalePercentage()}%
            </Button>
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={zoomIn}
              disabled={scale >= 2.5}
              title="Zoom avant"
            >
              <FontAwesomeIcon icon={faSearchPlus} />
            </Button>
          </ButtonGroup>
        </div>

        <div className="pdf-controls-right">
          <ButtonGroup size="sm">
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={toggleViewMode}
              title={viewMode === 'scroll' ? 'Mode page unique' : 'Mode défilement'}
            >
              <FontAwesomeIcon icon={faThList} />
            </Button>
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={rotateRight}
              title="Rotation 90°"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </Button>
            <Button
              variant={isDarkTheme ? 'outline-light' : 'outline-secondary'}
              onClick={toggleFullWidth}
              title={isFullWidth ? 'Taille normale' : 'Pleine largeur'}
            >
              <FontAwesomeIcon icon={isFullWidth ? faCompress : faExpand} />
            </Button>
            <Button
              variant="primary"
              as="a"
              href={fileUrl}
              download={fileName}
              title="Télécharger"
            >
              <FontAwesomeIcon icon={faDownload} />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="pdf-canvas-wrapper">
        {loading && (
          <div className="pdf-loading">
            <Spinner animation="border" variant={isDarkTheme ? 'light' : 'primary'} />
            <p className="mt-2">Chargement du PDF...</p>
          </div>
        )}
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={<></>}
          className="pdf-document"
        >
          {viewMode === 'scroll' ? (
            // Mode défilement : afficher toutes les pages
            Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                rotate={rotation}
                width={isFullWidth ? undefined : null}
                className="pdf-page"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))
          ) : (
            // Mode page unique : afficher seulement la page courante
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              width={isFullWidth ? undefined : null}
              className="pdf-page"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          )}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
