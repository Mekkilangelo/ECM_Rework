import { useState } from 'react';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * Hook gérant la prévisualisation des fichiers
 */
const useFilePreview = (fileIcon) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Ouvrir la modal de prévisualisation
  const openPreviewModal = (file) => {
    setPreviewFile(file);
    setShowPreviewModal(true);
  };
  
  // Fermer la modal de prévisualisation
  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewFile(null);
  };
  
  // Vérifier si le fichier est une image
  const isImage = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
  };
  
  // Obtenir l'URL de l'image pour la prévisualisation
  const getImageUrl = (fileId) => {
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/files/download/${fileId}?preview=true`;
  };
  
  const renderFileIcon = (fileType) => {
    if (fileType && fileType.startsWith('image/')) {
      return faImage;
    }
    return fileIcon;
  };
  
  // Rendu des vignettes pour les images
  const renderThumbnail = (file, onClick) => {
    if (isImage(file.type || file.mimeType)) {
      return (
        <div 
          className="thumbnail-container"
          onClick={onClick || (() => openPreviewModal({...file, previewUrl: file.preview || getImageUrl(file.id)}))}
        >
          <img
            src={file.preview || getImageUrl(file.id)}
            alt={file.name}
            className="file-thumbnail"
          />
        </div>
      );
    } else {
      return (
        <div 
          className="thumbnail-container non-image"
          onClick={onClick}
        >
          <div className="thumbnail-fallback">
            <FontAwesomeIcon icon={fileIcon} size="lg" />
          </div>
        </div>
      );
    }
  };

  return {
    showPreviewModal,
    previewFile,
    openPreviewModal,
    closePreviewModal,
    isImage,
    getImageUrl,
    renderFileIcon,
    renderThumbnail
  };
};

export default useFilePreview;
