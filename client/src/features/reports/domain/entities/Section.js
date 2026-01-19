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
    order = 0,
    options = {} // Options de sous-section (ex: showRecipeCurve pour la section recipe)
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
    this.options = options;
  }

  /**
   * Met à jour une option de la section
   */
  withOption(optionKey, value) {
    return new Section({
      ...this,
      options: {
        ...this.options,
        [optionKey]: value
      }
    });
  }

  /**
   * Récupère une option de la section
   */
  getOption(optionKey, defaultValue = null) {
    return this.options[optionKey] !== undefined ? this.options[optionKey] : defaultValue;
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
   * Vérifie si la section a du contenu (données ou photos)
   */
  hasContent() {
    // Vérifier si la section a des photos
    if (this.hasPhotos && this.getPhotoCount() > 0) {
      return true;
    }

    // Vérifier si la section a des données
    if (this.data && Object.keys(this.data).length > 0) {
      return true;
    }

    // Pour certaines sections, vérifier des critères spécifiques
    switch(this.type) {
      case 'identification':
      case 'load':
        // Ces sections ont toujours du contenu si elles sont liées à un trial
        return true;
      case 'recipe':
      case 'curves':
      case 'datapaq':
      case 'control':
      case 'micrography':
        // Ces sections nécessitent soit des données soit des photos
        return false;
      default:
        return false;
    }
  }

  /**
   * Vérifie si la section est vide (pas de contenu)
   */
  isEmpty() {
    return !this.hasContent();
  }

  /**
   * Valide si la section peut être générée
   */
  isValid() {
    if (!this.isEnabled) return false;
    
    // Vérifier si la section a du contenu
    return this.hasContent();
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
    DATAPAQ: 'datapaq',
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
      [this.SECTION_TYPES.LOAD]: {
        id: 'load',
        type: 'load',
        label: 'Charge',
        icon: 'faCubes',
        description: 'Information sur la charge et le positionnement',
        hasPhotos: true,
        order: 2
      },
      [this.SECTION_TYPES.CURVES]: {
        id: 'curves',
        type: 'curves',
        label: 'Courbes',
        icon: 'faChartLine',
        description: 'Graphiques et courbes de température/puissance',
        hasPhotos: true,
        order: 3
      },
      [this.SECTION_TYPES.DATAPAQ]: {
        id: 'datapaq',
        type: 'datapaq',
        label: 'Datapaq',
        icon: 'faChartArea',
        description: 'Relevés et rapports des capteurs Datapaq',
        hasPhotos: true,
        order: 4
      },
      [this.SECTION_TYPES.RECIPE]: {
        id: 'recipe',
        type: 'recipe',
        label: 'Recette',
        icon: 'faList',
        description: 'Paramètres de la recette utilisée',
        hasPhotos: false,
        order: 5,
        options: {
          showRecipeDetails: true, // Afficher les détails (tableaux, données) par défaut
          showRecipeCurve: true // Afficher le graphique des cycles par défaut
        }
      },
      [this.SECTION_TYPES.CONTROL]: {
        id: 'control',
        type: 'control',
        label: 'Contrôle',
        icon: 'faClipboardCheck',
        description: 'Résultats de mesures et contrôles',
        hasPhotos: true,
        order: 6
      },
      [this.SECTION_TYPES.MICROGRAPHY]: {
        id: 'micrography',
        type: 'micrography',
        label: 'Micrographie',
        icon: 'faMicroscope',
        description: 'Images et analyses micrographiques',
        hasPhotos: true,
        order: 7
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
