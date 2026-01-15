/**
 * Helper pour convertir la première page d'un PDF en image
 * Utilisé pour contourner la limitation de @react-pdf/renderer qui ne peut pas afficher de PDFs
 */

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Convertit la première page d'un PDF en image base64
 * @param {string} pdfUrl - URL du PDF à convertir
 * @param {Object} options - Options de rendu
 * @param {number} options.scale - Échelle de rendu (défaut: 2 pour bonne qualité)
 * @param {number} options.maxWidth - Largeur maximale de l'image (défaut: 1200px)
 * @returns {Promise<string>} - URL data:image/png;base64,... de l'image
 */
export const convertPDFFirstPageToImage = async (pdfUrl, options = {}) => {
  const { scale = 2, maxWidth = 1200 } = options;
  
  try {
    // Charger le PDF
    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      disableWorker: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    
    // Obtenir la première page
    const page = await pdf.getPage(1);
    
    // Obtenir les dimensions de la page
    const viewport = page.getViewport({ scale });
    
    // Ajuster l'échelle si la largeur dépasse maxWidth
    let finalScale = scale;
    if (viewport.width > maxWidth) {
      finalScale = (maxWidth / viewport.width) * scale;
    }
    
    const finalViewport = page.getViewport({ scale: finalScale });
    
    // Créer un canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = finalViewport.width;
    canvas.height = finalViewport.height;
    
    // Rendre la page sur le canvas
    const renderContext = {
      canvasContext: context,
      viewport: finalViewport,
      renderTextLayer: false,
      renderAnnotationLayer: false
    };
    
    await page.render(renderContext).promise;
    
    // Convertir le canvas en image base64
    const imageDataUrl = canvas.toDataURL('image/png', 0.95);
    
    // Nettoyer
    page.cleanup();
    pdf.cleanup();
    
    return imageDataUrl;
    
  } catch (error) {
    console.error('Erreur lors de la conversion PDF vers image:', error);
    throw error;
  }
};

/**
 * Convertit plusieurs PDFs en images en parallèle
 * @param {Array} pdfPhotos - Tableau de photos PDF avec url
 * @param {Object} options - Options de rendu
 * @returns {Promise<Map>} - Map avec photo.id -> imageDataUrl
 */
export const convertMultiplePDFsToImages = async (pdfPhotos, options = {}) => {
  const imageMap = new Map();
  
  const promises = pdfPhotos.map(async (photo) => {
    try {
      const url = photo.url || photo.viewPath;
      if (!url) {
        console.warn('PDF sans URL:', photo);
        return null;
      }
      
      const imageDataUrl = await convertPDFFirstPageToImage(url, options);
      imageMap.set(photo.id, imageDataUrl);
      
      return { photoId: photo.id, imageDataUrl };
    } catch (error) {
      console.error(`Erreur conversion PDF ${photo.id}:`, error);
      return null;
    }
  });
  
  await Promise.all(promises);
  
  return imageMap;
};

/**
 * Enrichit les photos en convertissant les PDFs en images
 * @param {Array} photos - Tableau de photos (images + PDFs)
 * @param {Object} options - Options de conversion
 * @returns {Promise<Array>} - Tableau de photos avec PDFs convertis en images
 */
export const enrichPhotosWithPDFImages = async (photos, options = {}) => {
  if (!Array.isArray(photos) || photos.length === 0) {
    return photos;
  }
  
  // Identifier les PDFs
  const pdfPhotos = photos.filter(photo => {
    const mimeType = photo.mimeType || '';
    const fileName = photo.name || photo.original_name || '';
    return mimeType.toLowerCase().includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  });
  
  if (pdfPhotos.length === 0) {
    return photos;
  }
  
  console.log(`🔄 Conversion de ${pdfPhotos.length} PDF(s) en images pour le rapport...`);
  
  // Convertir les PDFs en images
  const imageMap = await convertMultiplePDFsToImages(pdfPhotos, options);
  
  // Enrichir les photos avec les images converties
  const enrichedPhotos = photos.map(photo => {
    const imageDataUrl = imageMap.get(photo.id);
    if (imageDataUrl) {
      return {
        ...photo,
        // Remplacer l'URL par l'image convertie
        url: imageDataUrl,
        viewPath: imageDataUrl,
        // Marquer comme converti
        _convertedFromPDF: true,
        _originalPDFUrl: photo.url || photo.viewPath
      };
    }
    return photo;
  });
  
  console.log(`✅ ${imageMap.size} PDF(s) converti(s) avec succès`);
  
  return enrichedPhotos;
};
