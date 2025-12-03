/**
 * DOMAIN ENTITY: Photo
 * Représentation métier d'une photo dans le rapport
 */

export class Photo {
  constructor({
    id,
    fileId,
    url,
    filename,
    category,
    subcategory,
    metadata = {},
    thumbnail = null,
    optimized = null
  }) {
    this.id = id;
    this.fileId = fileId;
    this.url = url;
    this.filename = filename;
    this.category = category;
    this.subcategory = subcategory;
    this.metadata = metadata;
    this.thumbnail = thumbnail;
    this.optimized = optimized;
  }

  /**
   * Retourne l'URL optimisée pour le PDF
   */
  getOptimizedUrl() {
    return this.optimized || this.url;
  }

  /**
   * Retourne l'URL de la miniature
   */
  getThumbnailUrl() {
    return this.thumbnail || this.url;
  }

  /**
   * Extrait les métadonnées de la sous-catégorie
   * Format attendu: "result-0-sample-1-x100"
   */
  extractMetadata() {
    if (!this.subcategory) return {};

    const match = this.subcategory.match(/result-(\d+)-sample-(\d+)-(.+)/);
    if (match) {
      return {
        resultIndex: parseInt(match[1]),
        sampleIndex: parseInt(match[2]),
        magnification: match[3]
      };
    }

    return {};
  }

  /**
   * Clone avec une URL optimisée
   */
  withOptimizedUrl(url) {
    return new Photo({
      ...this,
      optimized: url
    });
  }

  /**
   * Estime la taille de la photo en Ko
   */
  estimateSize() {
    // Estimation basée sur les métadonnées ou valeur par défaut
    return this.metadata?.size || 500; // 500 Ko par défaut
  }
}

/**
 * VALUE OBJECT: Collection de photos avec métadonnées
 */
export class PhotoCollection {
  constructor(photos = []) {
    this.photos = photos.map(p => p instanceof Photo ? p : new Photo(p));
  }

  /**
   * Retourne toutes les photos
   */
  getAll() {
    return this.photos;
  }

  /**
   * Filtre par catégorie
   */
  filterByCategory(category) {
    return new PhotoCollection(
      this.photos.filter(p => p.category === category)
    );
  }

  /**
   * Filtre par sous-catégorie
   */
  filterBySubcategory(subcategory) {
    return new PhotoCollection(
      this.photos.filter(p => p.subcategory === subcategory)
    );
  }

  /**
   * Groupe par catégorie
   */
  groupByCategory() {
    const groups = {};
    this.photos.forEach(photo => {
      if (!groups[photo.category]) {
        groups[photo.category] = [];
      }
      groups[photo.category].push(photo);
    });
    return groups;
  }

  /**
   * Groupe par sous-catégorie
   */
  groupBySubcategory() {
    const groups = {};
    this.photos.forEach(photo => {
      if (!groups[photo.subcategory]) {
        groups[photo.subcategory] = [];
      }
      groups[photo.subcategory].push(photo);
    });
    return groups;
  }

  /**
   * Organise en hiérarchie (result > sample > magnification)
   */
  organizeHierarchically() {
    const hierarchy = {};

    this.photos.forEach(photo => {
      const meta = photo.extractMetadata();
      const { resultIndex = 0, sampleIndex = 0, magnification = 'other' } = meta;

      const resultKey = `result-${resultIndex}`;
      const sampleKey = `sample-${sampleIndex}`;

      if (!hierarchy[resultKey]) {
        hierarchy[resultKey] = { samples: {} };
      }

      if (!hierarchy[resultKey].samples[sampleKey]) {
        hierarchy[resultKey].samples[sampleKey] = { magnifications: {} };
      }

      if (!hierarchy[resultKey].samples[sampleKey].magnifications[magnification]) {
        hierarchy[resultKey].samples[sampleKey].magnifications[magnification] = [];
      }

      hierarchy[resultKey].samples[sampleKey].magnifications[magnification].push(photo);
    });

    return hierarchy;
  }

  /**
   * Retourne le nombre total de photos
   */
  count() {
    return this.photos.length;
  }

  /**
   * Estime la taille totale en Ko
   */
  estimateTotalSize() {
    return this.photos.reduce((total, photo) => total + photo.estimateSize(), 0);
  }

  /**
   * Ajoute une photo
   */
  add(photo) {
    return new PhotoCollection([...this.photos, photo]);
  }

  /**
   * Supprime une photo par ID
   */
  remove(photoId) {
    return new PhotoCollection(
      this.photos.filter(p => p.id !== photoId)
    );
  }
}
