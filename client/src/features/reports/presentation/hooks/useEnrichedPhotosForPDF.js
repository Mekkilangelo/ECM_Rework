/**
 * Hook pour enrichir les photos en convertissant les PDFs en images
 * Utilisé avant de générer un rapport PDF avec @react-pdf/renderer
 */

import { useState, useEffect } from 'react';
import { enrichPhotosWithPDFImages } from '../../infrastructure/pdf/helpers/pdfToImageHelper';

/**
 * Hook pour préparer les photos pour le rapport PDF
 * Convertit automatiquement les PDFs en images de leur première page
 * 
 * @param {Object} selectedPhotos - Photos sélectionnées par section { section: { subcategory: [photos] } }
 * @param {Object} options - Options de conversion
 * @returns {Object} { enrichedPhotos, isConverting, conversionError }
 */
export const useEnrichedPhotosForPDF = (selectedPhotos, options = {}) => {
  const [enrichedPhotos, setEnrichedPhotos] = useState(selectedPhotos);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState(null);

  useEffect(() => {
    const convertPDFs = async () => {
      if (!selectedPhotos || Object.keys(selectedPhotos).length === 0) {
        setEnrichedPhotos(selectedPhotos);
        return;
      }

      setIsConverting(true);
      setConversionError(null);

      try {
        const enriched = {};

        // Pour chaque section
        for (const [sectionKey, sectionPhotos] of Object.entries(selectedPhotos)) {
          if (!sectionPhotos || typeof sectionPhotos !== 'object') {
            enriched[sectionKey] = sectionPhotos;
            continue;
          }

          // Si c'est un tableau direct de photos
          if (Array.isArray(sectionPhotos)) {
            enriched[sectionKey] = await enrichPhotosWithPDFImages(sectionPhotos, options);
          } else {
            // Si c'est un objet avec des subcategories { subcategory: [photos] }
            enriched[sectionKey] = {};
            for (const [subcatKey, photos] of Object.entries(sectionPhotos)) {
              if (Array.isArray(photos)) {
                enriched[sectionKey][subcatKey] = await enrichPhotosWithPDFImages(photos, options);
              } else {
                enriched[sectionKey][subcatKey] = photos;
              }
            }
          }
        }

        setEnrichedPhotos(enriched);
      } catch (error) {
        console.error('Erreur lors de la conversion des PDFs:', error);
        setConversionError(error);
        // En cas d'erreur, utiliser les photos originales
        setEnrichedPhotos(selectedPhotos);
      } finally {
        setIsConverting(false);
      }
    };

    convertPDFs();
  }, [selectedPhotos, options]);

  return {
    enrichedPhotos,
    isConverting,
    conversionError
  };
};
