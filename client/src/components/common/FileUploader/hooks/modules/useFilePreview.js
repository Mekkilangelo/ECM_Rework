import { useState, useEffect } from 'react';
import {
  faImage,
  faFileExcel,
  faFilePdf,
  faFileWord,
  faFileAlt,
  faFileCsv,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { renderAsync } from 'docx-preview';
import fileService from '../../../../../services/fileService';

const useFilePreview = (defaultFileIcon = faFileAlt) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sheetNames, setSheetNames] = useState([]);
  const [viewerError, setViewerError] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser les états quand le fichier prévisualisé change
  useEffect(() => {
    if (previewFile) {
      resetPreviewStates();

      const fileType = getFileType(previewFile.type || previewFile.mimeType, previewFile.name);

      if (['spreadsheet', 'pdf', 'document'].includes(fileType) && previewFile.id) {
        fetchFileData(previewFile.id, fileType);
      }
    }
  }, [previewFile]);

  // Réinitialiser tous les états de prévisualisation
  const resetPreviewStates = () => {
    setFileData(null);
    setSheetData(null);
    setActiveSheet(0);
    setSheetNames([]);
    setViewerError(null);
    setIsLoading(false);
  };

  const changeSheet = (sheetIndex) => {
    if (workbook && sheetNames[sheetIndex]) {
      try {
        const sheetName = sheetNames[sheetIndex];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        setSheetData(jsonData);
        setActiveSheet(sheetIndex);
      } catch (error) {
        console.error("Erreur lors du changement de feuille", error);
        setViewerError("Impossible de charger la feuille sélectionnée");
      }
    }
  };

  // Fetch le contenu du fichier
  const fetchFileData = async (fileId, fileType) => {
    setIsLoading(true);
    try {
      const response = await axios.get(getFileUrl(fileId), {
        responseType: 'arraybuffer'
      });

      const fileData = new Uint8Array(response.data);
      setFileData(fileData);

      // Traiter selon le type de fichier
      if (fileType === 'spreadsheet') {
        processSpreadsheetData(fileData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Erreur lors du chargement du fichier", error);
      setViewerError("Impossible de charger le fichier");
      setIsLoading(false);
    }
  };

  // Traitement des fichiers Excel/CSV
  const processSpreadsheetData = (fileData) => {
    try {
      const parsedWorkbook = XLSX.read(fileData, { type: 'array' });
      setWorkbook(parsedWorkbook);
      setSheetNames(parsedWorkbook.SheetNames);

      if (parsedWorkbook.SheetNames.length > 0) {
        const firstSheetName = parsedWorkbook.SheetNames[0];
        const worksheet = parsedWorkbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setSheetData(jsonData);
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse du fichier tableur", error);
      setViewerError("Impossible d'analyser ce fichier tableur");
    }
  };

  // Rendu DOCX avec docx-preview
  const renderDocx = async (container, docxData) => {
    if (!container || !docxData) return;
    
    try {
      // Nettoyer le conteneur
      container.innerHTML = '';
      
      // Utiliser docx-preview pour rendre le document
      await renderAsync(docxData, container, null, {
        inWrapper: true,
        ignoreWidth: true,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        ignoreLastRenderedPageBreak: true,
        useBase64URL: false,
        useMathMLPolyfill: false
      });
    } catch (error) {
      console.error('Erreur lors du rendu du document Word', error);
      setViewerError("Erreur lors de l'affichage du document Word");
    }
  };

  // Obtenir le type de fichier
  const getFileType = (mimeType, fileName) => {
    if (!mimeType && !fileName) return 'unknown';

    if (mimeType) {
      if (mimeType.startsWith('image/')) return 'image';
      if (mimeType === 'application/pdf') return 'pdf';
      if (mimeType === 'application/vnd.ms-excel' ||
          mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          mimeType === 'text/csv') return 'spreadsheet';
      if (mimeType === 'application/msword' ||
          mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'document';
    }

    if (fileName) {
      const ext = fileName.split('.').pop().toLowerCase();

      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'].includes(ext)) return 'image';
      if (ext === 'pdf') return 'pdf';
      if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'spreadsheet';
      if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'document';
    }

    return 'other';
  };

  // Obtenir l'URL du fichier
  const getFileUrl = (fileId, preview = false) => {
    // Utiliser directement les services corrects pour éviter les erreurs de construction d'URL
    return preview ? fileService.getFilePreviewUrl(fileId) : fileService.getFileById(fileId);
  };

  // Obtenir l'icône du fichier
  const getFileIcon = (file) => {
    if (!file) return defaultFileIcon;

    const fileType = getFileType(file.type || file.mimeType, file.name);
    const ext = file.name?.split('.')?.pop()?.toLowerCase() || '';

    switch (fileType) {
      case 'image': return faImage;
      case 'pdf': return faFilePdf;
      case 'spreadsheet':
        if (ext === 'csv') return faFileCsv;
        return faFileExcel;
      case 'document': return faFileWord;
      default: return defaultFileIcon;
    }
  };

  // Rendu des vignettes
  const renderThumbnail = (file, onClick) => {
    if (!file) return null;

    const fileType = getFileType(file.type || file.mimeType, file.name);
    const handleClick = onClick || (() => openPreviewModal({
      ...file,
      previewUrl: file.preview || getFileUrl(file.id),
      fileType
    }));

    if (fileType === 'image') {
      return (
        <div className="thumbnail-container" onClick={handleClick}>
          <img
            src={file.preview || getFileUrl(file.id, true)}
            alt={file.name}
            className="file-thumbnail"
            onError={(e) => {
              console.error(`Erreur de chargement d'image: ${e.target.src}`);
              // Tentative avec une URL alternative sans preview
              const alternateUrl = getFileUrl(file.id, false);
              if (e.target.src !== alternateUrl) {
                e.target.src = alternateUrl;
              }
            }}
          />
        </div>
      );
    } else {
      return (
        <div className="thumbnail-container non-image" onClick={handleClick}>
          <div className="thumbnail-fallback">
            <FontAwesomeIcon icon={getFileIcon(file)} size="lg" />
            <div className="file-extension">{file.name?.split('.')?.pop()?.toUpperCase() || ''}</div>
          </div>
        </div>
      );
    }
  };

  // Rendu du contenu de la prévisualisation
  const renderPreviewContent = (file) => {
    if (!file) return null;
    if (viewerError) return renderViewerError(viewerError);

    const fileType = file.fileType || getFileType(file.type || file.mimeType, file.name);
    const fileUrl = file.previewUrl || getFileUrl(file.id);

    switch (fileType) {
      case 'image':
        return (
          <div className="preview-image-container">
            <img 
              src={fileUrl} 
              alt={file.name} 
              className="preview-image"
              onError={(e) => {
                console.error(`Erreur de chargement de la prévisualisation: ${e.target.src}`);
                // Tentative avec une URL alternative sans paramètre preview
                if (fileUrl.includes('?preview=true')) {
                  const alternateUrl = fileUrl.replace('?preview=true', '');
                  e.target.src = alternateUrl;
                }
              }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="pdf-preview-container">

            
            <div className="mt-3 text-center">
              <a
                href={fileUrl}
                className="btn btn-primary"
                download={file.name}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Télécharger le PDF
              </a>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="preview-document-container">
            {isLoading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="sr-only">Chargement...</span>
                </div>
                <p className="mt-2">Chargement du document...</p>
              </div>
            ) : (
              <div 
                id="docx-container" 
                className="docx-container"
                ref={container => {
                  if (container && fileData) {
                    renderDocx(container, fileData);
                  }
                }}
              ></div>
            )}
            
            <div className="mt-3 text-center">
              <a
                href={fileUrl}
                className="btn btn-primary"
                download={file.name}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Télécharger le document
              </a>
            </div>
          </div>
        );

      case 'spreadsheet':
        if (sheetData) {
          return (
            <div className="preview-spreadsheet-container">
              {sheetNames.length > 1 && (
                <div className="sheet-tabs mb-2">
                  <div className="btn-group">
                    {sheetNames.map((name, index) => (
                      <button
                        key={index}
                        className={`btn btn-sm ${index === activeSheet ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => changeSheet(index)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-hover">
                  <tbody>
                    {sheetData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.isArray(row) ? (
                          row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell !== null && cell !== undefined ? cell.toString() : ''}</td>
                          ))
                        ) : (
                          Object.values(row).map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell !== null && cell !== undefined ? cell.toString() : ''}</td>
                          ))
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <a
                href={fileUrl}
                className="btn btn-primary mt-2"
                download={file.name}
              >
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Télécharger le fichier
              </a>
            </div>
          );
        }

      default:
        return (
          <div className="preview-unsupported text-center p-5">
            <FontAwesomeIcon icon={getFileIcon(file)} size="5x" className="mb-4 text-secondary" />
            <p className="lead mb-4">L'aperçu n'est pas disponible pour ce type de fichier</p>
            <a
              href={fileUrl}
              className="btn btn-lg btn-primary"
              download={file.name}
            >
              <FontAwesomeIcon icon={faDownload} className="me-2" />
              Télécharger le fichier
            </a>
          </div>
        );
    }
  };

  // Afficher un message d'erreur du viewer
  const renderViewerError = (message) => (
    <div className="viewer-error text-center p-5">
      <div className="alert alert-warning">
        <FontAwesomeIcon icon={faDownload} className="me-2" />
        {message || "Une erreur s'est produite lors de la prévisualisation du fichier"}
      </div>
      {previewFile?.id && (
        <a
          href={getFileUrl(previewFile.id)}
          className="btn btn-primary mt-3"
          download={previewFile.name}
        >
          <FontAwesomeIcon icon={faDownload} className="me-2" />
          Télécharger le fichier
        </a>
      )}
    </div>
  );

  // Méthodes de gestion de la modal
  const openPreviewModal = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewFile(null);
  };

  return {
    showPreviewModal,
    previewFile,
    openPreviewModal,
    closePreviewModal,
    getFileType,
    getFileUrl,
    getFileIcon,
    renderThumbnail,
    renderPreviewContent,
    viewerError,
    changeSheet,
    isLoading
  };
};

export default useFilePreview;