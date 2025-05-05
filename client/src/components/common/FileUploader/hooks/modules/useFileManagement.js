import fileService from '../../../../../services/fileService';

/**
 * Hook gérant les fichiers déjà téléchargés
 */
const useFileManagement = (
  internalUploadedFiles, 
  setInternalUploadedFiles, 
  onFilesUploaded, 
  setError
) => {
  // Supprimer un fichier déjà téléchargé
  const removeUploadedFile = async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      
      // Important: Create the updated files array
      const updatedFiles = internalUploadedFiles.filter(f => f.id !== fileId);
      
      // Update the internal state
      setInternalUploadedFiles(updatedFiles);
      
      // Pass the updated files to the callback with a 'delete' operation flag
      if (onFilesUploaded) {
        onFilesUploaded(updatedFiles, null, 'delete', fileId);
      }
    } catch (err) {
      setError('Erreur lors de la suppression du fichier');
      console.error('Erreur de suppression:', err);
    }
  };

  // Télécharger un fichier existant
  const downloadFile = (fileId) => {
    fileService.downloadFile(fileId);
  };

  return {
    removeUploadedFile,
    downloadFile
  };
};

export default useFileManagement;