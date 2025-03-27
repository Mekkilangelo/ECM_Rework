import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

/**
 * Hook gérant la sélection de fichiers et le glisser-déposer
 */
const useFileSelection = (files, setFiles, maxFiles, acceptedFileTypes, setError) => {
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
    
    setFiles(prev => [...prev, ...filesWithPreviews].slice(0, maxFiles));
    setError(null);
  }, [maxFiles, setFiles, setError]);

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
