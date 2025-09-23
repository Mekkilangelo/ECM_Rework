import { useState, useEffect } from 'react';
import useFileSelection from './modules/useFileSelection';
import useFileUpload from './modules/useFileUpload';
import useFilePreview from './modules/useFilePreview';
import useFileManagement from './modules/useFileManagement';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Hook principal gérant l'ensemble du processus d'upload de fichiers
 */
const useFileUploader = ({
  maxFiles = 50, // Augmenté de 5 à 50 fichiers
  acceptedFileTypes = {},
  fileIcon = faFile,
  existingFiles = [],
  onFilesUploaded,
  enableStandbyMode = false
}) => {  // États
  const [files, setFiles] = useState([]);
  const [internalUploadedFiles, setInternalUploadedFiles] = useState([]);
  const [standbyMode] = useState(enableStandbyMode);
  
  // Mise à jour de l'état interne lorsque existingFiles change
  useEffect(() => {
    setInternalUploadedFiles([...existingFiles]);
  }, [existingFiles]);
  // Utilisation des hooks spécialisés
  const fileUpload = useFileUpload(files, setFiles, setInternalUploadedFiles, onFilesUploaded, standbyMode);
  const filePreview = useFilePreview(fileIcon);
    const fileSelection = useFileSelection(
    files, 
    setFiles, 
    maxFiles, 
    acceptedFileTypes, 
    fileUpload.setError,
    onFilesUploaded,
    standbyMode
  );
  
  const fileManagement = useFileManagement(
    internalUploadedFiles, 
    setInternalUploadedFiles, 
    onFilesUploaded, 
    fileUpload.setError
  );
  // Hook API unifiée
  return {
    // État des fichiers
    files,
    uploadedFiles: internalUploadedFiles,
      // Mode standby
    standbyMode,
    getPendingFiles: () => {
      console.log("📋 [useFileUploader] getPendingFiles called, files:", files.map(f => f.name));
      return files;
    },
    uploadPendingFiles: fileUpload.uploadPendingFiles,
    
    // Sélection des fichiers
    dropzoneProps: {
      getRootProps: fileSelection.getRootProps,
      getInputProps: fileSelection.getInputProps,
      isDragActive: fileSelection.isDragActive
    },
    removeFile: fileSelection.removeFile,
    
    // Upload
    handleUpload: fileUpload.handleUpload,
    uploading: fileUpload.uploading,
    uploadProgress: fileUpload.uploadProgress,
    error: fileUpload.error,
    
    // Gestion des fichiers existants
    removeUploadedFile: fileManagement.removeUploadedFile,
    downloadFile: fileManagement.downloadFile,
    
    // Prévisualisation
    previewState: {
      showPreviewModal: filePreview.showPreviewModal,
      previewFile: filePreview.previewFile
    },
    openPreviewModal: filePreview.openPreviewModal,
    closePreviewModal: filePreview.closePreviewModal,
    isImage: filePreview.isImage,
    getFileType: filePreview.getFileType,
    getFileUrl: filePreview.getFileUrl,
    getFileIcon: filePreview.getFileIcon,
    renderThumbnail: filePreview.renderThumbnail,
    renderPreviewContent: filePreview.renderPreviewContent
  };
};

export default useFileUploader;