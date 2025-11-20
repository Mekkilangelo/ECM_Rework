/**
 * INFRASTRUCTURE: Helpers pour la gestion des photos dans les PDF
 * Fonctions utilitaires pour normaliser et optimiser l'affichage des photos
 */

/**
 * Obtient l'URL complète d'une photo pour l'affichage
 * Gère les différents formats de photos (URL, file_path, ID)
 */
export const getPhotoUrl = (photo) => {
  if (!photo) return '';
  
  // URL directe
  if (photo.url) return photo.url;
  
  // Chemin viewPath (prioritaire pour l'aperçu)
  if (photo.viewPath) return photo.viewPath;
  
  // Chemin de fichier à convertir
  if (photo.file_path) {
    // Normaliser le chemin (remplacer \ par /)
    const normalizedPath = photo.file_path.replace(/\\/g, '/');
    // S'assurer que le chemin commence par /
    const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `http://localhost:5001${path}`;
  }
  
  // ID de photo à utiliser pour l'API preview
  if (photo.id || photo.node_id) {
    return `http://localhost:5001/api/files/${photo.id || photo.node_id}/preview`;
  }
  

  return '';
};

/**
 * Calcule la mise en page optimale des photos selon le nombre
 * Retourne cols, photoWidth, photoHeight optimaux
 */
export const calculatePhotoLayout = (photoCount, layoutType = 'default') => {
  if (photoCount === 0) return { cols: 0, photoWidth: 0, photoHeight: 0 };
  
  // Layouts spécialisés par type de section
  switch (layoutType) {
    case 'identification':
      if (photoCount === 1) return { cols: 1, photoWidth: 200, photoHeight: 150 };
      if (photoCount === 2) return { cols: 2, photoWidth: 150, photoHeight: 110 };
      if (photoCount <= 4) return { cols: 2, photoWidth: 120, photoHeight: 90 };
      if (photoCount <= 6) return { cols: 3, photoWidth: 100, photoHeight: 75 };
      if (photoCount <= 9) return { cols: 3, photoWidth: 80, photoHeight: 60 };
      return { cols: 4, photoWidth: 70, photoHeight: 50 };
    
    case 'micrography':
      if (photoCount === 1) return { cols: 1, photoWidth: 180, photoHeight: 135 };
      if (photoCount === 2) return { cols: 2, photoWidth: 140, photoHeight: 105 };
      if (photoCount <= 4) return { cols: 2, photoWidth: 120, photoHeight: 90 };
      if (photoCount <= 6) return { cols: 3, photoWidth: 100, photoHeight: 75 };
      return { cols: 3, photoWidth: 80, photoHeight: 60 };
    
    case 'curves':
      if (photoCount === 1) return { cols: 1, photoWidth: 220, photoHeight: 165 };
      if (photoCount === 2) return { cols: 2, photoWidth: 160, photoHeight: 120 };
      if (photoCount <= 4) return { cols: 2, photoWidth: 140, photoHeight: 105 };
      return { cols: 3, photoWidth: 120, photoHeight: 90 };
    
    case 'load':
      if (photoCount === 1) return { cols: 1, photoWidth: 240, photoHeight: 180 };
      if (photoCount === 2) return { cols: 2, photoWidth: 180, photoHeight: 135 };
      if (photoCount <= 4) return { cols: 2, photoWidth: 150, photoHeight: 112 };
      if (photoCount <= 6) return { cols: 3, photoWidth: 120, photoHeight: 90 };
      return { cols: 3, photoWidth: 100, photoHeight: 75 };
    
    default:
      // Layout par défaut
      if (photoCount === 1) return { cols: 1, photoWidth: 200, photoHeight: 150 };
      if (photoCount === 2) return { cols: 2, photoWidth: 150, photoHeight: 110 };
      if (photoCount <= 4) return { cols: 2, photoWidth: 120, photoHeight: 90 };
      if (photoCount <= 6) return { cols: 3, photoWidth: 100, photoHeight: 75 };
      return { cols: 3, photoWidth: 80, photoHeight: 60 };
  }
};

/**
 * Divise un tableau de photos en pages selon la limite
 */
export const paginatePhotos = (photos, photosPerPage = 12) => {
  const pages = [];
  
  if (!Array.isArray(photos) || photos.length === 0) {
    return pages;
  }
  
  for (let i = 0; i < photos.length; i += photosPerPage) {
    pages.push(photos.slice(i, i + photosPerPage));
  }
  
  return pages;
};

/**
 * Normalise le nom d'une photo pour l'affichage
 */
export const normalizePhotoName = (photo) => {
  if (!photo) return 'Photo sans nom';
  
  return photo.original_name || photo.name || `Photo ${photo.id || 'inconnue'}`;
};

/**
 * Génère un label de photo avec numérotation
 */
export const generatePhotoLabel = (photo, index, prefix = '') => {
  const baseName = normalizePhotoName(photo);
  const photoNumber = index + 1;
  
  if (prefix) {
    return `${prefix}-${photoNumber}: ${baseName}`;
  }
  
  return `Photo ${photoNumber}: ${baseName}`;
};

/**
 * Valide qu'une photo a les données minimales requises
 */
export const isValidPhoto = (photo) => {
  if (!photo || typeof photo !== 'object') return false;
  
  // Au minimum, une photo doit avoir un ID ou un nom ou une URL
  return !!(photo.id || photo.node_id || photo.name || photo.original_name || photo.url || photo.viewPath || photo.file_path);
};

/**
 * Filtre et valide un tableau de photos
 */
export const validatePhotos = (photos) => {
  if (!Array.isArray(photos)) return [];
  
  return photos.filter(isValidPhoto);
};

/**
 * Debug helper - affiche les informations d'une photo
 */
