import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Hook gérant la sélection de fichiers et le glisser-déposer
 */
const useFileSelection = (files, setFiles, maxFiles, acceptedFileTypes, setError, onFilesUploaded, standbyMode) => {
  // Gérer le drop de fichiers
  const onDrop = useCallback((acceptedFiles) => {
    // Ajouter les fichiers à la liste avec prévisualisations
    const filesWithPreviews = acceptedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return Object.assign(file, {
          preview: URL.createObjectURL(file)
        });
      }
      return file;
    });
      setFiles(prev => {
      const newFiles = [...prev, ...filesWithPreviews].slice(0, maxFiles);
      console.log("📁 [useFileSelection] Fichiers ajoutés:", {
        acceptedFilesCount: acceptedFiles.length,
        acceptedFilesNames: acceptedFiles.map(f => f.name),
        totalFilesAfter: newFiles.length,
        allFilesNames: newFiles.map(f => f.name),
        standbyMode
      });
      
      // En mode standby, notifier immédiatement le parent
      if (standbyMode && onFilesUploaded && newFiles.length > 0) {
        console.log("📤 [useFileSelection] Notifying parent in standby mode");
        setTimeout(() => {
          onFilesUploaded(newFiles, null, 'standby');
        }, 0);
      }
      
      return newFiles;
    });
    setError(null);
  }, [maxFiles, setFiles, setError, onFilesUploaded, standbyMode]);

  // Configuration de react-dropzone
  const dropzoneConfig = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxFiles: maxFiles
  });

  // Nettoyer les URL de prévisualisation créées
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // Supprimer un fichier de la file d'attente
  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return {
    ...dropzoneConfig,
    removeFile
  };
};

export default useFileSelection;
