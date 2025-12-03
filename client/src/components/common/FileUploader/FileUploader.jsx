import React, { useState } from 'react';
import { Button, ProgressBar, Alert, Modal, Form, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faEye, faDownload, faFile, faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import useFileUploader from './hooks/useFileUploader';
import fileService from '../../../services/fileService';
import './FileUploader.css';

const FileUploader = ({
  category,
  subcategory,
  nodeId,
  onFilesUploaded,
  maxFiles = 50, // Augmenté de 5 à 50 fichiers
  acceptedFileTypes = {},
  title = 'Importer des fichiers',
  showPreview = true,
  height = '150px',
  width = '100%',
  fileIcon = faFile,
  existingFiles = [],
  enableStandbyMode = false, // Nouveau prop pour activer le mode standby
  onUploaderReady = null, // Callback pour exposer les fonctions d'upload
  readOnly = false // Nouveau prop pour désactiver l'édition
}) => {
  // État pour les descriptions personnalisées de chaque fichier
  const [fileDescriptions, setFileDescriptions] = useState({});
  // État pour l'édition des descriptions de fichiers existants
  const [editingDescriptions, setEditingDescriptions] = useState({});
  const [savingDescription, setSavingDescription] = useState({});

  // Utiliser le hook personnalisé
  const fileUploader = useFileUploader({
    maxFiles,
    acceptedFileTypes,
    fileIcon,
    existingFiles,
    onFilesUploaded,
    enableStandbyMode: enableStandbyMode || !nodeId // Mode standby si explicitement activé ou si pas de nodeId
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
    renderPreviewContent,
    standbyMode,
    getPendingFiles,    uploadPendingFiles
  } = fileUploader;  // Exposer les fonctions d'upload via le callback
  React.useEffect(() => {
    if (onUploaderReady && standbyMode) {
      onUploaderReady(uploadPendingFiles, getPendingFiles);
    }
  }, [onUploaderReady, standbyMode, uploadPendingFiles, getPendingFiles]);

  // Fonction pour sauvegarder la description d'un fichier
  const saveDescription = async (fileId) => {
    try {
      setSavingDescription(prev => ({ ...prev, [fileId]: true }));
      const newDescription = editingDescriptions[fileId];
      
      const response = await fileService.updateFile(fileId, { description: newDescription });
      
      // Vérifier le succès
      if (response.data && response.data.success) {
        // Mettre à jour l'état local immédiatement pour éviter les doublons
        const updatedFile = uploadedFiles.find(f => f.id === fileId);
        if (updatedFile) {
          updatedFile.description = newDescription;
        }
        
        // Forcer un re-render en créant un nouveau tableau
        const newUploadedFiles = [...uploadedFiles];
        
        // Notifier le parent pour qu'il puisse recharger si nécessaire
        if (onFilesUploaded) {
          onFilesUploaded(newUploadedFiles, null, 'update', fileId);
        }
      }
      
      // Sortir du mode édition
      setEditingDescriptions(prev => {
        const newState = { ...prev };
        delete newState[fileId];
        return newState;
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la description:', error);
    } finally {
      setSavingDescription(prev => ({ ...prev, [fileId]: false }));
    }
  };

  // Fonction pour annuler l'édition
  const cancelEdit = (fileId) => {
    setEditingDescriptions(prev => {
      const newState = { ...prev };
      delete newState[fileId];
      return newState;
    });
  };

  // Fonction pour démarrer l'édition
  const startEdit = (fileId, currentDescription) => {
    setEditingDescriptions(prev => ({
      ...prev,
      [fileId]: currentDescription || ''
    }));
  };

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
              <li key={index} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center mb-2">
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
                </div>
                <Form.Group className="mb-0">
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="Description / Titre (optionnel)"
                    value={fileDescriptions[index] || ''}
                    onChange={(e) => setFileDescriptions(prev => ({...prev, [index]: e.target.value}))}
                  />
                </Form.Group>
              </li>
            ))}          </ul>
          {!standbyMode && (
            <Button
              variant="primary"
              className="mt-2"
              onClick={() => handleUpload(nodeId, category, subcategory, fileDescriptions)}
              disabled={uploading}
            >
              {uploading ? 'Téléchargement en cours...' : 'Télécharger les fichiers'}
            </Button>
          )}
          {standbyMode && (
            <div className="mt-2 text-info">
              <small>
                <FontAwesomeIcon icon={faFile} className="me-1" />
                Fichiers en attente - seront uploadés lors de la sauvegarde
              </small>
            </div>
          )}
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
              <li key={`file-${file.id}-${file.name}`} className="list-group-item">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center flex-grow-1">
                    <div className="thumbnail-wrapper">
                      {renderThumbnail(file)}
                    </div>
                    <div className="flex-grow-1 ms-2">
                      {editingDescriptions[file.id] !== undefined ? (
                        <Form.Group className="mb-0">
                          <Form.Control
                            type="text"
                            size="sm"
                            value={editingDescriptions[file.id]}
                            onChange={(e) => setEditingDescriptions(prev => ({
                              ...prev,
                              [file.id]: e.target.value
                            }))}
                            placeholder="Description / Titre"
                            disabled={savingDescription[file.id]}
                          />
                        </Form.Group>
                      ) : (
                        <>
                          <div>{file.description || file.name}</div>
                          <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="d-flex gap-1">
                    {editingDescriptions[file.id] !== undefined ? (
                      <>
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => saveDescription(file.id)}
                          disabled={savingDescription[file.id]}
                        >
                          {savingDescription[file.id] ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <FontAwesomeIcon icon={faSave} />
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => cancelEdit(file.id)}
                          disabled={savingDescription[file.id]}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </Button>
                      </>
                    ) : (
                      <>
                        {!readOnly && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => startEdit(file.id, file.description)}
                            title="Éditer la description"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Button>
                        )}
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => openPreviewModal(file)}
                          title="Prévisualiser"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => downloadFile(file.id)}
                          title="Télécharger"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </Button>
                        {!readOnly && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeUploadedFile(file.id)}
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
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
            {previewState.previewFile?.description || previewState.previewFile?.name}
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
                {previewState.previewFile.original_name && previewState.previewFile.description && (
                  <div>Fichier original : {previewState.previewFile.original_name}</div>
                )}
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
