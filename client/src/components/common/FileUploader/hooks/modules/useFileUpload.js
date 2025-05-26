import { useState } from 'react';
import fileService from '../../../../../services/fileService';

/**
 * Hook gérant le processus d'upload de fichiers
 */
const useFileUpload = (files, setFiles, setInternalUploadedFiles, onFilesUploaded) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleUpload = async (nodeId, category, subcategory) => {
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
    
    try {      const response = await fileService.uploadFiles(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      // Accès aux données selon la nouvelle structure de réponse API uniformisée
      if (!response.data || response.data.success === false) {
        throw new Error(response.data?.message || 'Échec de l\'upload des fichiers');
      }
      
      const newFiles = response.data.data.files;
      const tempId = response.data.data.tempId;
      
      console.log("Upload response:", response.data);
      console.log("New files:", newFiles);
      console.log("Temp ID from server:", tempId);
      
      setInternalUploadedFiles(prev => [...prev, ...newFiles]);
      setFiles([]);
      setUploadProgress(0);
      
      // Appeler le callback avec les fichiers uploadés ET le tempId
      if (onFilesUploaded) {
        onFilesUploaded(newFiles, tempId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload des fichiers');
      console.error('Erreur d\'upload:', err);
    } finally {
      setUploading(false);
    }
  };

  return {
    handleUpload,
    uploading,
    uploadProgress,
    error,
    setError
  };
};

export default useFileUpload;
