/**
 * DOMAIN SERVICE: DataTransformer
 * Transforme et normalise les données pour le rapport
 */

export class DataTransformer {
  /**
   * Parse un champ JSON de manière sécurisée
   */
  static parseJsonField(data, fieldName = 'unknown') {
    if (!data) return null;

    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.warn(`Failed to parse JSON field "${fieldName}":`, error);
        return null;
      }
    }

    return data;
  }

  /**
   * Normalise les données de trial
   */
  static normalizeTrialData(rawData) {
    if (!rawData) return {};

    return {
      trial_code: rawData.trial_code || rawData.testCode || '',
      load_number: rawData.load_number || rawData.loadNumber || '',
      trial_date: rawData.trial_date || rawData.testDate || null,
      status: rawData.status || '',
      location: rawData.location || '',
      recipe_data: this.parseJsonField(rawData.recipe_data, 'recipe_data'),
      quench_data: this.parseJsonField(rawData.quench_data, 'quench_data'),
      furnace_data: this.parseJsonField(rawData.furnace_data, 'furnace_data'),
      results_data: this.parseJsonField(rawData.results_data, 'results_data'),
      load_data: this.parseJsonField(rawData.load_data, 'load_data')
    };
  }

  /**
   * Normalise les données de pièce
   */
  static normalizePartData(rawData) {
    if (!rawData) return {};

    return {
      id: rawData.id,
      name: rawData.name,
      part_number: rawData.part_number,
      drawing_number: rawData.drawing_number,
      steel_id: rawData.steel_id,
      steel: rawData.steel,
      dimensions: this.parseJsonField(rawData.dimensions, 'dimensions'),
      specifications: this.parseJsonField(rawData.specifications, 'specifications')
    };
  }

  /**
   * Normalise les données client
   */
  static normalizeClientData(rawData) {
    if (!rawData) return {};

    return {
      id: rawData.id,
      name: rawData.name,
      country: rawData.country,
      address: rawData.address,
      contacts: this.parseJsonField(rawData.contacts, 'contacts')
    };
  }

  /**
   * Transforme les photos en structure uniforme
   */
  static normalizePhotos(rawPhotos) {
    if (!rawPhotos) return {};

    const normalized = {};

    Object.entries(rawPhotos).forEach(([sectionKey, photos]) => {
      // Si c'est déjà un tableau
      if (Array.isArray(photos)) {
        normalized[sectionKey] = photos.map(p => this.normalizePhoto(p));
      }
      // Si c'est un objet avec des sous-catégories
      else if (typeof photos === 'object') {
        normalized[sectionKey] = {};
        Object.entries(photos).forEach(([subcategory, photoList]) => {
          if (Array.isArray(photoList)) {
            normalized[sectionKey][subcategory] = photoList.map(p => this.normalizePhoto(p));
          }
        });
      }
    });

    return normalized;
  }

  /**
   * Normalise une photo individuelle
   */
  static normalizePhoto(photo) {
    if (!photo) return null;

    // Si c'est juste un ID
    if (typeof photo === 'number' || typeof photo === 'string') {
      return {
        id: photo,
        fileId: photo
      };
    }

    // Si c'est un objet complet
    return {
      id: photo.id,
      fileId: photo.id,
      filename: photo.filename || photo.name,
      category: photo.category,
      subcategory: photo.subcategory,
      metadata: photo.metadata || {}
    };
  }

  /**
   * Aplatit une structure hiérarchique de photos
   */
  static flattenPhotos(photoStructure) {
    if (Array.isArray(photoStructure)) {
      return photoStructure;
    }

    const flattened = [];

    if (typeof photoStructure === 'object') {
      Object.values(photoStructure).forEach(value => {
        if (Array.isArray(value)) {
          flattened.push(...value);
        } else if (typeof value === 'object') {
          flattened.push(...this.flattenPhotos(value));
        }
      });
    }

    return flattened;
  }

  /**
   * Formatte une date pour l'affichage
   */
  static formatDate(date, locale = 'fr-FR', options = {}) {
    if (!date) return '';

    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...options
    };

    try {
      return new Date(date).toLocaleDateString(locale, defaultOptions);
    } catch (error) {
      console.warn('Failed to format date:', error);
      return date;
    }
  }

  /**
   * Formatte un nombre avec des unités
   */
  static formatMeasurement(value, unit = '') {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    return unit ? `${value} ${unit}` : value;
  }

  /**
   * Nettoie et valide les données du rapport
   */
  static sanitizeReportData(reportData) {
    return {
      trialData: this.normalizeTrialData(reportData.trialData || reportData),
      partData: this.normalizePartData(reportData.partData || reportData.part),
      clientData: this.normalizeClientData(reportData.clientData || reportData.client),
      photos: this.normalizePhotos(reportData.sectionFiles || reportData.photos || {})
    };
  }
}
