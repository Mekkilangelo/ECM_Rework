import { useEffect } from 'react';
import fileService from '../../../../../services/fileService';

/**
 * Hook gérant les fichiers déjà téléchargés
 */
const useFileManagement = (existingFiles, internalUploadedFiles, setInternalUploadedFiles, onFilesUploaded, setError) => {
  // Synchroniser les fichiers externes avec l'état interne
  useEffect(() => {
    // Comparaison simple des IDs pour savoir s'il faut mettre à jour
    const currentIds = new Set(internalUploadedFiles.map(f => f.id));
    const newIds = new Set(existingFiles.map(f => f.id));
    
    // Vérifier si les ensembles sont différents
    if (currentIds.size !== newIds.size || 
        existingFiles.some(f => !currentIds.has(f.id))) {
      setInternalUploadedFiles([...existingFiles]);
    }
  }, [existingFiles, internalUploadedFiles, setInternalUploadedFiles]);

  // Supprimer un fichier déjà téléchargé
  const removeUploadedFile = async (fileId) => {
    try {
      await fileService.deleteFile(fileId);
      setInternalUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      
      // Informer le parent de la suppression
      if (onFilesUploaded) {
        onFilesUploaded(internalUploadedFiles.filter(f => f.id !== fileId), null);
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
