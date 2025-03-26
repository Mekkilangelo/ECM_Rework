// src/components/common/FileUploader/FileUploader.jsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, ProgressBar, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faImage, faFile, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../services/fileService';
import './FileUploader.css';

const FileUploader = ({
  category,
  subcategory,
  nodeId,
  onFilesUploaded,
  maxFiles = 5,
  acceptedFileTypes = '*',
  title = 'Importer des fichiers',
  showPreview = true,
  height = '150px',
  width = '100%',
  fileIcon = faFile
}) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const onDrop = useCallback((acceptedFiles) => {
    // Ajouter les fichiers à la liste
    setFiles(prev => [...prev, ...acceptedFiles].slice(0, maxFiles));
    setError(null);
  }, [maxFiles]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: maxFiles
  });
  
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    if (nodeId) formData.append('nodeId', nodeId);
    if (category) formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    
    try {
      const response = await fileService.uploadFiles(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      setUploadedFiles(response.data.files);
      setFiles([]);
      setUploadProgress(0);
      
      // Appeler le callback avec les fichiers uploadés
      if (onFilesUploaded) {
        onFilesUploaded(response.data.files, response.data.tempId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload des fichiers');
      console.error('Erreur d\'upload:', err);
    } finally {
      setUploading(false);
    }
  };
  
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeUploadedFile = async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      setError('Erreur lors de la suppression du fichier');
      console.error('Erreur de suppression:', err);
    }
  };
  
  const previewFile = (fileId) => {
    window.open(`/files/download/${fileId}`, '_blank');
  };
  
  const renderFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return faImage;
    }
    return fileIcon;
  };
  
  return (
    <div className="file-uploader mb-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      {/* Zone de glisser-déposer */}
      <div 
        {...getRootProps()} 
        className={`upload-dropzone ${isDragActive ? 'active' : ''}`}
        style={{ height, width }}
      >
        <input {...getInputProps()} />
        <FontAwesomeIcon icon={fileIcon} size="3x" className="mb-3 text-secondary" />
        <span className="fw-bold">{title}</span>
        <div className="mt-2 text-muted small">
          <FontAwesomeIcon icon={faUpload} className="me-1" />
          {isDragActive ? 'Déposez les fichiers ici' : 'Cliquez ou glissez-déposez vos fichiers'}
        </div>
      </div>
      
      {/* Liste des fichiers sélectionnés */}
      {files.length > 0 && (
        <div className="selected-files mt-3">
          <h6>Fichiers sélectionnés ({files.length})</h6>
          <ul className="list-group">
            {files.map((file, index) => (
              <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={renderFileIcon(file.type)} className="me-2" />
                  {file.name} <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
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
            onClick={handleUpload} 
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
                <div>
                  <FontAwesomeIcon icon={renderFileIcon(file.type)} className="me-2" />
                  {file.name} <small className="text-muted">({(file.size / 1024).toFixed(1)} KB)</small>
                </div>
                <div>
                  <Button variant="outline-info" size="sm" className="me-2" onClick={() => previewFile(file.id)}>
                    <FontAwesomeIcon icon={faEye} />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => removeUploadedFile(file.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
