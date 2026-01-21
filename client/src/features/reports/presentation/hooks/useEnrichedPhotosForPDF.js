/**
 * Hook pour enrichir les photos en convertissant les PDFs en images
 * Utilisé avant de générer un rapport PDF avec @react-pdf/renderer
 *
 * OPTIMISATIONS:
 * - Cache des conversions PDF pour éviter les reconversions inutiles
 * - Conversion incrémentale (seulement les nouveaux PDFs)
 * - Memoization des options pour éviter les boucles infinies
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { enrichPhotosWithPDFImages } from '../../infrastructure/pdf/helpers/pdfToImageHelper';

/**
 * Hook pour préparer les photos pour le rapport PDF
 * Convertit automatiquement les PDFs en images de leur première page
 *
 * @param {Object} selectedPhotos - Photos sélectionnées par section { section: { subcategory: [photos] } }
 * @param {Object} options - Options de conversion (doit être mémorisé avec useMemo!)
 * @returns {Object} { enrichedPhotos, isConverting, conversionError }
 */
export const useEnrichedPhotosForPDF = (selectedPhotos, options = {}) => {
  const [enrichedPhotos, setEnrichedPhotos] = useState(selectedPhotos);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState(null);

  // Cache des conversions PDF (photo.id -> imageDataUrl)
  const conversionCacheRef = useRef(new Map());

  // Mémoriser la stringification complète de selectedPhotos pour détecter les vrais changements
  // On doit inclure les IDs des photos, pas juste les clés de l'objet
  const selectedPhotosKey = useMemo(() => {
    const photoIds = [];
    if (selectedPhotos && typeof selectedPhotos === 'object') {
      Object.values(selectedPhotos).forEach(value => {
        if (Array.isArray(value)) {
          value.forEach(photo => photo?.id && photoIds.push(photo.id));
        } else if (typeof value === 'object' && value !== null) {
          Object.values(value).forEach(subValue => {
            if (Array.isArray(subValue)) {
              subValue.forEach(photo => photo?.id && photoIds.push(photo.id));
            }
          });
        }
      });
    }
    return JSON.stringify(photoIds.sort());
  }, [selectedPhotos]);

  useEffect(() => {
    const convertPDFs = async () => {
      if (!selectedPhotos || Object.keys(selectedPhotos).length === 0) {
        setEnrichedPhotos({});
        return;
      }

      setIsConverting(true);
      setConversionError(null);

      try {
        const enriched = {};
        const cache = conversionCacheRef.current;

        // Pour chaque section
        for (const [sectionKey, sectionPhotos] of Object.entries(selectedPhotos)) {
          if (!sectionPhotos || typeof sectionPhotos !== 'object') {
            enriched[sectionKey] = sectionPhotos;
            continue;
          }

          // Si c'est un tableau direct de photos
          if (Array.isArray(sectionPhotos)) {
            // Utiliser le cache pour éviter les reconversions
            enriched[sectionKey] = await enrichPhotosWithCache(sectionPhotos, options, cache);
          } else {
            // Si c'est un objet avec des subcategories { subcategory: [photos] }
            enriched[sectionKey] = {};
            for (const [subcatKey, photos] of Object.entries(sectionPhotos)) {
              if (Array.isArray(photos)) {
                enriched[sectionKey][subcatKey] = await enrichPhotosWithCache(photos, options, cache);
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
  }, [selectedPhotosKey, options]);

  return {
    enrichedPhotos,
    isConverting,
    conversionError
  };
};

/**
 * Enrichit les photos en utilisant un cache pour éviter les reconversions
 * @param {Array} photos - Photos à enrichir
 * @param {Object} options - Options de conversion
 * @param {Map} cache - Cache des conversions (photo.id -> imageDataUrl)
 * @returns {Promise<Array>} Photos enrichies
 */
const enrichPhotosWithCache = async (photos, options, cache) => {
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

  // Séparer les PDFs déjà convertis des nouveaux
  const newPdfPhotos = pdfPhotos.filter(photo => !cache.has(photo.id));
  const cachedCount = pdfPhotos.length - newPdfPhotos.length;

  if (newPdfPhotos.length > 0) {
    console.log(`🔄 Conversion de ${newPdfPhotos.length} nouveau(x) PDF(s) (${cachedCount} en cache)...`);

    // Convertir seulement les nouveaux PDFs
    const newEnriched = await enrichPhotosWithPDFImages(newPdfPhotos, options);

    // Mettre en cache les nouvelles conversions
    newEnriched.forEach(photo => {
      if (photo._convertedFromPDF) {
        cache.set(photo.id, photo.url);
      }
    });
  } else {
    console.log(`✅ Tous les PDFs (${cachedCount}) sont déjà en cache`);
  }

  // Enrichir toutes les photos en utilisant le cache
  return photos.map(photo => {
    const cachedUrl = cache.get(photo.id);
    if (cachedUrl) {
      return {
        ...photo,
        url: cachedUrl,
        viewPath: cachedUrl,
        _convertedFromPDF: true,
        _fromCache: true
      };
    }
    return photo;
  });
};
