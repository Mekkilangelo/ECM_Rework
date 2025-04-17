import React from 'react';
import { Button, ProgressBar, Alert, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faEye, faDownload, faFile } from '@fortawesome/free-solid-svg-icons';
import useFileUploader from './hooks/useFileUploader';
import './FileUploader.css';

const FileUploader = ({
  category,
  subcategory,
  nodeId,
  onFilesUploaded,
  maxFiles = 5,
  acceptedFileTypes = {},
  title = 'Importer des fichiers',
  showPreview = true,
  height = '150px',
  width = '100%',
  fileIcon = faFile,
  existingFiles = []
}) => {
  // Utiliser le hook personnalisé
  const fileUploader = useFileUploader({
    maxFiles,
    acceptedFileTypes,
    fileIcon,
    existingFiles,
    onFilesUploaded
  });
  
  const { 
    files, 
    uploadedFiles, 
    dropzoneProps, 
    handleUpload, 
    uploading, 
    uploadProgress, 
    error,
    removeFile,
    removeUploadedFile,
    downloadFile,
    previewState,
    openPreviewModal,
    closePreviewModal,
    isImage,
    getFileType,
    renderThumbnail,
    renderPreviewContent
  } = fileUploader;

  return (
    <div className="file-uploader mb-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Zone de glisser-déposer */}
      <div
        {...dropzoneProps.getRootProps()}
        className={`upload-dropzone ${dropzoneProps.isDragActive ? 'active' : ''}`}
        style={{ height, width }}
      >
        <input {...dropzoneProps.getInputProps()} />
        <FontAwesomeIcon icon={fileIcon} size="3x" className="mb-3 text-secondary" />
        <span className="fw-bold">{title}</span>
        <div className="mt-2 text-muted small">
          <FontAwesomeIcon icon={faUpload} className="me-1" />
          {dropzoneProps.isDragActive ? 'Déposez les fichiers ici' : 'Cliquez ou glissez-déposez vos fichiers'}
        </div>
      </div>
      
      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="selected-files mt-3">
          <h6>Fichiers sélectionnés ({files.length})</h6>
          <ul className="list-group">
            {files.map((file, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="thumbnail-wrapper">
                    {renderThumbnail(file, () => openPreviewModal({...file, previewUrl: file.preview}))}
                  </div>
                  <div>
                    <div>{file.name}</div>
                    <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
                  </div>
                </div>
                <Button variant="outline-danger" size="sm" onClick={() => removeFile(index)}>
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            className="mt-2"
            onClick={() => handleUpload(nodeId, category, subcategory)}
            disabled={uploading}
          >
            {uploading ? 'Téléchargement en cours...' : 'Télécharger les fichiers'}
          </Button>
          {uploading && (
            <ProgressBar
              now={uploadProgress}
              label={`${uploadProgress}%`}
              className="mt-2"
            />
          )}
        </div>
      )}
      
      {/* Affichage des fichiers déjà téléchargés */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className="uploaded-files mt-4">
          <h6>Fichiers téléchargés ({uploadedFiles.length})</h6>
          <ul className="list-group">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="thumbnail-wrapper">
                    {renderThumbnail(file)}
                  </div>
                  <div>
                    <div>{file.name}</div>
                    <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
                  </div>
                </div>
                <div>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-2"
                    onClick={() => openPreviewModal(file)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2"
                    onClick={() => downloadFile(file.id)}
                  >
                    <FontAwesomeIcon icon={faDownload} />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeUploadedFile(file.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Modal pour prévisualiser les fichiers */}
      <Modal
        show={previewState.showPreviewModal}
        onHide={closePreviewModal}
        size="lg"
        centered
        className="file-preview-modal"
        dialogClassName="modal-90w"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {previewState.previewFile?.name}
            {previewState.previewFile?.mimeType && (
              <small className="text-muted ms-2">
                ({previewState.previewFile?.mimeType})
              </small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0 preview-modal-body">
          {previewState.previewFile && renderPreviewContent(previewState.previewFile)}
        </Modal.Body>
        <Modal.Footer>
          {previewState.previewFile && (
            <>
              <div className="me-auto text-muted small">
                {previewState.previewFile.size && `Taille: ${(previewState.previewFile.size / 1024).toFixed(1)} KB`}
              </div>
              <Button
                variant="secondary"
                onClick={closePreviewModal}
              >
                Fermer
              </Button>
              {previewState.previewFile.id && (
                <Button
                  variant="primary"
                  onClick={() => downloadFile(previewState.previewFile.id)}
                >
                  <FontAwesomeIcon icon={faDownload} className="me-2" />
                  Télécharger
                </Button>
              )}
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FileUploader;
