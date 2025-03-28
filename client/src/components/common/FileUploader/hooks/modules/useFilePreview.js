import { useState, useEffect } from 'react';
import { 
  faImage, 
  faFileExcel, 
  faFilePdf, 
  faFileWord, 
  faFileAlt,
  faFileCsv,
  faFileCode,
  faFileArchive,
  faFileAudio,
  faFileVideo
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PDF from 'react-pdf-js';
import * as XLSX from 'xlsx';
import axios from 'axios';

const useFilePreview = (defaultFileIcon = faFileAlt) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [sheetData, setSheetData] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sheetNames, setSheetNames] = useState([]);
  const [viewerError, setViewerError] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  
  // Réinitialiser les états quand le fichier prévisualisé change
  useEffect(() => {
    if (previewFile) {
      resetPreviewStates();
      
      const fileType = getFileType(previewFile.type || previewFile.mimeType, previewFile.name);
      
      if (['spreadsheet', 'pdf'].includes(fileType) && previewFile.id) {
        fetchFileData(previewFile.id, fileType);
      }
    }
  }, [previewFile]);
  
  // Réinitialiser tous les états de prévisualisation
  const resetPreviewStates = () => {
    setPageNumber(1);
    setNumPages(null);
    setSheetData(null);
    setFileData(null);
    setActiveSheet(0);
    setSheetNames([]);
    setViewerError(null);
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
    try {
      const response = await axios.get(getFileUrl(fileId), {
        responseType: 'arraybuffer'
      });
      
      const fileData = new Uint8Array(response.data);
      setFileData(fileData);
      
      // Traiter les fichiers Excel
      if (fileType === 'spreadsheet') {
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
      }
    } catch (error) {
      console.error("Erreur lors du chargement du fichier", error);
      setViewerError("Impossible de charger le fichier");
    }
  };
  
  // Gestion des pages PDF
  const onDocumentComplete = (pages) => {
    setNumPages(pages);
  };

  const handlePageChange = (page) => {
    setPageNumber(page);
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
      if (mimeType.startsWith('video/')) return 'video';
      if (mimeType.startsWith('audio/')) return 'audio';
      if (mimeType === 'application/zip' || 
          mimeType === 'application/x-rar-compressed' ||
          mimeType === 'application/x-7z-compressed') return 'archive';
      if (mimeType === 'text/plain' ||
          mimeType === 'application/json' ||
          mimeType === 'text/html' ||
          mimeType === 'text/css' ||
          mimeType === 'application/javascript') return 'code';
    }
    
    if (fileName) {
      const ext = fileName.split('.').pop().toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'].includes(ext)) return 'image';
      if (ext === 'pdf') return 'pdf';
      if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'spreadsheet';
      if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) return 'document';
      if (['mp4', 'webm', 'mov', 'avi', 'wmv', 'flv', 'mkv'].includes(ext)) return 'video';
      if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext)) return 'audio';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
      if (['txt', 'js', 'html', 'css', 'json', 'xml', 'md', 'py', 'java', 'c', 'cpp', 'h', 'php'].includes(ext)) return 'code';
    }
    
    return 'other';
  };
  
  // Obtenir l'URL du fichier
  const getFileUrl = (fileId) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/files/download/${fileId}`;
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
      case 'video': return faFileVideo;
      case 'audio': return faFileAudio;
      case 'archive': return faFileArchive;
      case 'code': return faFileCode;
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
            src={file.preview || getFileUrl(file.id) + '?preview=true'}
            alt={file.name}
            className="file-thumbnail"
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
    const fileExtension = file.name?.split('.')?.pop()?.toLowerCase() || '';
    
    switch (fileType) {
      case 'image':
        return (
          <div className="preview-image-container">
            <img src={fileUrl} alt={file.name} className="preview-image" />
          </div>
        );
      
      case 'pdf':
        return (
          <div className="pdf-preview-container">
            <PDF
              file={fileUrl}
              page={pageNumber}
              onDocumentComplete={onDocumentComplete}
              scale={1.5}
              className="pdf-viewer"
            />
            {numPages && (
              <div className="pdf-controls mt-3 d-flex justify-content-center align-items-center">
                <button 
                  className="btn btn-outline-primary me-2" 
                  onClick={() => handlePageChange(pageNumber - 1)}
                  disabled={pageNumber <= 1}
                >
                  Précédent
                </button>
                
                <span className="mx-3">
                  Page {pageNumber} / {numPages}
                </span>
                
                <button 
                  className="btn btn-outline-primary ms-2" 
                  onClick={() => handlePageChange(pageNumber + 1)}
                  disabled={pageNumber >= numPages}
                >
                  Suivant
                </button>
                
                <a 
                  href={fileUrl} 
                  className="btn btn-primary ms-3" 
                  download={file.name}
                >
                  Télécharger
                </a>
              </div>
            )}
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
                target="_blank" 
                rel="noopener noreferrer"
              >
                Télécharger le fichier
              </a>
            </div>
          );
        }
        // Fallback: utiliser le viewer Office
        return (
          <div className="preview-spreadsheet-container">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              title={file.name}
              width="100%"
              height="500px"
              className="spreadsheet-viewer"
              frameBorder="0"
            />
          </div>
        );
      
      case 'document':
        // Fallback pour tous les documents: utiliser le viewer Office
        return (
          <div className="preview-document-container">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              title={file.name}
              width="100%"
              height="500px"
              className="document-viewer"
              frameBorder="0"
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="preview-video-container">
            <video 
              controls 
              width="100%" 
              height="auto"
              className="video-player"
            >
              <source src={fileUrl} type={file.type || `video/${fileExtension}`} />
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
          </div>
        );
        
      case 'audio':
        return (
          <div className="preview-audio-container text-center">
            <FontAwesomeIcon icon={faFileAudio} size="5x" className="mb-3 text-primary" />
            <audio 
              controls 
              className="audio-player w-100 mt-3"
            >
              <source src={fileUrl} type={file.type || `audio/${fileExtension}`} />
              Votre navigateur ne prend pas en charge la lecture audio.
            </audio>
          </div>
        );
        
      case 'code':
        return (
          <div className="preview-code-container">
            <div className="code-header d-flex justify-content-between align-items-center bg-light p-2 border">
              <span className="file-name">{file.name}</span>
              <a 
                href={fileUrl} 
                className="btn btn-sm btn-primary" 
                download={file.name}
                target="_blank" 
                rel="noopener noreferrer"
              >
                Télécharger
              </a>
            </div>
            <div className="code-content p-3 border bg-dark text-light">
              <pre>
                <iframe 
                  src={fileUrl} 
                  title={file.name} 
                  width="100%" 
                  height="400px"
                  className="code-frame"
                ></iframe>
              </pre>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="preview-unsupported text-center p-5">
            <FontAwesomeIcon icon={getFileIcon(file)} size="5x" className="mb-4 text-secondary" />
            <p className="lead mb-4">L'aperçu n'est pas disponible pour ce type de fichier</p>
            <a 
              href={fileUrl} 
              className="btn btn-lg btn-primary"
              download={file.name}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FontAwesomeIcon icon="download" className="me-2" />
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
        <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
        {message || "Une erreur s'est produite lors de la prévisualisation du fichier"}
      </div>
      {previewFile?.id && (
        <a 
          href={getFileUrl(previewFile.id)} 
          className="btn btn-primary mt-3" 
          download={previewFile.name}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon="download" className="me-2" />
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
    pageNumber,
    numPages,
    viewerError,
    changeSheet
  };
};

export default useFilePreview;