import { useState } from 'react';
import useFileSelection from './modules/useFileSelection';
import useFileUpload from './modules/useFileUpload';
import useFilePreview from './modules/useFilePreview';
import useFileManagement from './modules/useFileManagement';
import { faFile } from '@fortawesome/free-solid-svg-icons';

/**
 * Hook principal gérant l'ensemble du processus d'upload de fichiers
 */
const useFileUploader = ({
  maxFiles = 5,
  acceptedFileTypes = {},
  fileIcon = faFile,
  existingFiles = [],
  onFilesUploaded
}) => {
  // États
  const [files, setFiles] = useState([]);
  const [internalUploadedFiles, setInternalUploadedFiles] = useState([]);

  // Utilisation des hooks spécialisés
  const fileUpload = useFileUpload(files, setFiles, setInternalUploadedFiles, onFilesUploaded);
  const filePreview = useFilePreview(fileIcon);
  
  const fileSelection = useFileSelection(
    files, 
    setFiles, 
    maxFiles, 
    acceptedFileTypes, 
    fileUpload.setError
  );
  
  const fileManagement = useFileManagement(
    existingFiles, 
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
    getImageUrl: filePreview.getImageUrl,
    renderThumbnail: (file) => filePreview.renderThumbnail(file, filePreview.openPreviewModal)
  };
};

export default useFileUploader;
