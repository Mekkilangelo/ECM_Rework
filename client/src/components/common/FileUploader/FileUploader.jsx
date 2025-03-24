// client/src/components/common/FileUploader/FileUploader.jsx
import React, { useState, useCallback } from 'react';
import { Button, Alert, ProgressBar, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faFile, faImage, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import './FileUploader.css';
import fileService from '../../../services/fileService';

const FileUploader = ({ 
  nodeId,
  entityType,
  category = 'general',
  subcategory = null,
  maxFiles = 5,
  acceptedTypes = '.pdf,.jpg,.jpeg,.png,.docx,.xlsx,.txt',
  onUploadComplete = () => {},
  onError = () => {}
}) => {
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [tempId, setTempId] = useState(null);

  // Récupérer les fichiers existants au chargement
  React.useEffect(() => {
    if (nodeId) {
      fetchFiles();
    }
  }, [nodeId]);

  const fetchFiles = async () => {
    try {
      const response = await fileService.getFilesByNode(nodeId);
      setUploadedFiles(response.data);
    } catch (error) {
      setError('Erreur lors de la récupération des fichiers');
      onError(error);
    }
  };

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > maxFiles) {
      setError(`Vous ne pouvez pas télécharger plus de ${maxFiles} fichiers à la fois.`);
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
    setError(null);
  }, [files, maxFiles]);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length + files.length > maxFiles) {
      setError(`Vous ne pouvez pas télécharger plus de ${maxFiles} fichiers à la fois.`);
      return;
    }
    setFiles(prev => [...prev, ...droppedFiles]);
    setError(null);
  }, [files, maxFiles]);

  const removeFile = useCallback((index) => {
    setFiles(files.filter((_, i) => i !== index));
  }, [files]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setProgress(0);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      if (nodeId) formData.append('nodeId', nodeId);
      formData.append('entityType', entityType);
      formData.append('category', category);
      if (subcategory) formData.append('subcategory', subcategory);
      
      const response = await fileService.uploadFiles(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      
      // Si c'est un upload sans nodeId (création), sauvegarde du tempId
      if (response.data.tempId) {
        setTempId(response.data.tempId);
      }
      
      // Mise à jour des fichiers
      if (nodeId) {
        fetchFiles();
      } else {
        setUploadedFiles(prev => [...prev, ...response.data.files]);
      }
      
      setFiles([]);
      setIsUploading(false);
      onUploadComplete(response.data, tempId || response.data.tempId);
    } catch (error) {
      setError('Erreur lors du téléchargement des fichiers');
      setIsUploading(false);
      onError(error);
    }
  };

  const deleteFile = async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      setUploadedFiles(uploadedFiles.filter(file => file.id !== fileId));
    } catch (error) {
      setError('Erreur lors de la suppression du fichier');
      onError(error);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('image')) return faImage;
    if (mimeType.includes('pdf')) return faFilePdf;
    return faFile;
  };

  return (
    <div className="file-uploader-container">
      <h5>Documents {category !== 'general' ? `- ${category}` : ''}</h5>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div 
        className="drop-zone" 
        onDrop={handleFileDrop} 
        onDragOver={handleDragOver}
      >
        <FontAwesomeIcon icon={faUpload} size="2x" />
        <p>Glissez vos fichiers ici ou</p>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          id={`file-input-${category}`}
          style={{ display: 'none' }}
        />
        <Button 
          variant="outline-primary" 
          onClick={() => document.getElementById(`file-input-${category}`).click()}
        >
          Parcourir
        </Button>
        <p className="text-muted small">
          Max {maxFiles} fichiers ({acceptedTypes.replace(/\./g, '')})
        </p>
      </div>
      
      {files.length > 0 && (
        <div className="selected-files mt-3">
          <h6>Fichiers sélectionnés:</h6>
          <ListGroup>
            {files.map((file, index) => (
              <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={getFileIcon(file.type)} className="mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
                <Button variant="outline-danger" size="sm" onClick={() => removeFile(index)}>
                  <FontAwesomeIcon icon={faTrash} />
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
          
          <div className="mt-3">
            {isUploading ? (
              <ProgressBar animated now={progress} label={`${progress}%`} />
            ) : (
              <Button 
                variant="primary" 
                onClick={uploadFiles} 
                disabled={files.length === 0}
              >
                Télécharger {files.length} fichier(s)
              </Button>
            )}
          </div>
        </div>
      )}
      
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files mt-3">
          <h6>Fichiers téléchargés:</h6>
          <ListGroup>
            {uploadedFiles.map((file) => (
              <ListGroup.Item key={file.id} className="d-flex justify-content-between align-items-center">
                <div>
                  <FontAwesomeIcon icon={getFileIcon(file.type)} className="mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="mr-2"
                    onClick={() => fileService.downloadFile(file.id)}
                  >
                    Télécharger
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => deleteFile(file.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default FileUploader;