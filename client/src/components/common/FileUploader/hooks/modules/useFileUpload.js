import { useState } from 'react';
import fileService from '../../../../../services/fileService';

/**
 * Hook gérant le processus d'upload de fichiers
 */
const useFileUpload = (files, setFiles, setInternalUploadedFiles, onFilesUploaded, standbyMode = false) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleUpload = async (nodeId, category, subcategory) => {
    // En mode standby, ne pas faire d'upload immédiat
    if (standbyMode) {
      // Juste notifier le parent qu'il y a des fichiers en attente
      if (onFilesUploaded) {
        onFilesUploaded(files, null, 'standby');
      }
      return;
    }

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
      console.error('Erreur d\'upload:', err);    } finally {
      setUploading(false);
    }
  };  // Fonction pour uploader les fichiers en attente après création du node
  const uploadPendingFiles = async (nodeId, category, subcategory, pendingFiles = files) => {
    console.log("🚀 [useFileUpload] uploadPendingFiles called:", {
      nodeId,
      category,
      subcategory,
      pendingFilesCount: pendingFiles.length,
      filesStateCount: files.length,
      pendingFiles: pendingFiles.map(f => f.name),
      filesState: files.map(f => f.name)
    });
    
    if (pendingFiles.length === 0) {
      console.log("⚠️ [useFileUpload] No pending files to upload");
      return { success: true, files: [] };
    }
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    pendingFiles.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('nodeId', nodeId);
    if (category) formData.append('category', category);
    if (subcategory) formData.append('subcategory', subcategory);
    
    try {
      const response = await fileService.uploadFiles(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      if (!response.data || response.data.success === false) {
        throw new Error(response.data?.message || 'Échec de l\'upload des fichiers');
      }
      
      const newFiles = response.data.data.files;
      
      // Vider les fichiers en attente
      setFiles([]);
      setUploadProgress(0);
      
      return { success: true, files: newFiles };
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'upload des fichiers');
      console.error('Erreur d\'upload:', err);
      return { success: false, error: err.message };
    } finally {
      setUploading(false);
    }
  };

  return {
    handleUpload,
    uploadPendingFiles,
    uploading,
    uploadProgress,
    error,
    setError
  };
};

export default useFileUpload;
