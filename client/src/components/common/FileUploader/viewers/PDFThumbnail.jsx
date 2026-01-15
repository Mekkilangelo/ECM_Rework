/**
 * PDFThumbnail Component
 * Displays a thumbnail of the first page of a PDF using react-pdf
 */

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faSpinner } from '@fortawesome/free-solid-svg-icons';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

const PDFThumbnail = ({ 
  fileUrl, 
  fileName, 
  width = 150, 
  height = 150,
  onClick,
  className = '',
  showError = true
}) => {
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    if (mountedRef.current) {
      setNumPages(numPages);
      setLoading(false);
      setError(null);
    }
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    if (mountedRef.current) {
      setError(error);
      setLoading(false);
    }
  };

  return (
    <div 
      className={`pdf-thumbnail-container ${className}`}
      onClick={onClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#f8f9fa',
        borderRadius: '4px',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {loading && !error && (
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="lg" className="text-secondary" />
        </div>
      )}
      
      {error ? (
        <div className="text-center p-2">
          <FontAwesomeIcon icon={faFilePdf} size="2x" className="text-danger mb-1" />
          <div className="small text-muted">PDF</div>
        </div>
      ) : (
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          error=""
          options={{
            cMapUrl: '/cmaps/',
            cMapPacked: true,
            standardFontDataUrl: '/standard_fonts/',
            disableWorker: false,
            isEvalSupported: false,
            useSystemFonts: true
          }}
        >
          {!loading && numPages && (
            <Page 
              pageNumber={1}
              width={width}
              height={height}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading=""
              error=""
            />
          )}
        </Document>
      )}

      {/* Indicateur PDF dans le coin */}
      {!error && (
        <div 
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '4px',
            background: 'rgba(220, 53, 69, 0.9)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: 'bold',
            pointerEvents: 'none'
          }}
        >
          PDF
        </div>
      )}
    </div>
  );
};

export default PDFThumbnail;
