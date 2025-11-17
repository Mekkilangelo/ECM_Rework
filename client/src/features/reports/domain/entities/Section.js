/**
 * DOMAIN ENTITY: Section
 * Représentation métier d'une section de rapport
 */

export class Section {
  constructor({
    id,
    type,
    label,
    icon,
    description,
    isEnabled = false,
    hasPhotos = false,
    photos = [],
    data = {},
    order = 0
  }) {
    this.id = id;
    this.type = type;
    this.label = label;
    this.icon = icon;
    this.description = description;
    this.isEnabled = isEnabled;
    this.hasPhotos = hasPhotos;
    this.photos = photos;
    this.data = data;
    this.order = order;
  }

  /**
   * Active/Désactive la section
   */
  toggle() {
    return new Section({
      ...this,
      isEnabled: !this.isEnabled
    });
  }

  /**
   * Définit les photos de la section
   */
  withPhotos(photos) {
    return new Section({
      ...this,
      photos: Array.isArray(photos) ? photos : []
    });
  }

  /**
   * Définit les données de la section
   */
  withData(data) {
    return new Section({
      ...this,
      data
    });
  }

  /**
   * Estime le nombre de pages nécessaires
   */
  estimatePages() {
    let pages = 1; // Au moins 1 page pour le contenu

    // Ajouter des pages pour les photos (4 photos par page)
    if (this.hasPhotos && this.photos.length > 0) {
      pages += Math.ceil(this.photos.length / 4);
    }

    return pages;
  }

  /**
   * Retourne le nombre de photos sélectionnées
   */
  getPhotoCount() {
    if (!this.hasPhotos) return 0;
    
    // Gestion des structures hiérarchiques
    if (Array.isArray(this.photos)) {
      return this.photos.length;
    }
    
    if (typeof this.photos === 'object') {
      return Object.values(this.photos).reduce((count, photoList) => {
        return count + (Array.isArray(photoList) ? photoList.length : 0);
      }, 0);
    }

    return 0;
  }

  /**
   * Valide si la section peut être générée
   */
  isValid() {
    if (!this.isEnabled) return false;
    
    // Vérifier si des données sont requises
    if (this.requiresData()) {
      return this.data && Object.keys(this.data).length > 0;
    }

    return true;
  }

  /**
   * Indique si la section nécessite des données
   */
  requiresData() {
    return ['recipe', 'curves', 'control'].includes(this.type);
  }
}

/**
 * FACTORY: Création de sections prédéfinies
 */
export class SectionFactory {
  static SECTION_TYPES = {
    IDENTIFICATION: 'identification',
    RECIPE: 'recipe',
    LOAD: 'load',
    CURVES: 'curves',
    MICROGRAPHY: 'micrography',
    CONTROL: 'control'
  };

  static createSection(type, overrides = {}) {
    const configs = {
      [this.SECTION_TYPES.IDENTIFICATION]: {
        id: 'identification',
        type: 'identification',
        label: 'Identification',
        icon: 'faIdCard',
        description: 'Informations d\'identification du test et de la pièce',
        hasPhotos: true,
        order: 1
      },
      [this.SECTION_TYPES.RECIPE]: {
        id: 'recipe',
        type: 'recipe',
        label: 'Recette',
        icon: 'faList',
        description: 'Paramètres de la recette utilisée',
        hasPhotos: false,
        order: 2
      },
      [this.SECTION_TYPES.LOAD]: {
        id: 'load',
        type: 'load',
        label: 'Charge',
        icon: 'faCubes',
        description: 'Information sur la charge et le positionnement',
        hasPhotos: true,
        order: 3
      },
      [this.SECTION_TYPES.CURVES]: {
        id: 'curves',
        type: 'curves',
        label: 'Courbes',
        icon: 'faChartLine',
        description: 'Graphiques et courbes de température/puissance',
        hasPhotos: true,
        order: 4
      },
      [this.SECTION_TYPES.MICROGRAPHY]: {
        id: 'micrography',
        type: 'micrography',
        label: 'Micrographie',
        icon: 'faMicroscope',
        description: 'Images et analyses micrographiques',
        hasPhotos: true,
        order: 5
      },
      [this.SECTION_TYPES.CONTROL]: {
        id: 'control',
        type: 'control',
        label: 'Contrôle',
        icon: 'faClipboardCheck',
        description: 'Résultats de mesures et contrôles',
        hasPhotos: false,
        order: 6
      }
    };

    const config = configs[type];
    if (!config) {
      throw new Error(`Section type "${type}" not supported`);
    }

    return new Section({ ...config, ...overrides });
  }

  static createAllSections(enabledByDefault = true) {
    return Object.values(this.SECTION_TYPES).map(type =>
      this.createSection(type, { isEnabled: enabledByDefault })
    );
  }
}
