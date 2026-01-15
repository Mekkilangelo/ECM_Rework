/**
 * THEME: Tailles de photos standardisées pour le rapport PDF
 * 
 * Chaque section peut choisir les tailles appropriées selon son contexte.
 * La largeur de page utilisable est d'environ 515px (A4 - paddings).
 */

export const PHOTO_SIZES = {
  // Photo principale / Hero (pleine largeur)
  hero: {
    width: 500,
    height: 300,
  },
  
  // Photo large (pleine largeur, moins haute)
  fullWidth: {
    width: 480,
    height: 200,
  },

  // Photo micrographie (optimisée pour 3 zooms par page)
  micrographySingle: {
    width: 480,
    height: 165,
  },
  
  // Grande photo empilée (pour layout vertical)
  stackedLarge: {
    width: 500,
    height: 340,
  },
  
  // Photo première page Load (1 grande + 2 petites)
  heroLoad: {
    width: 500,
    height: 280,
  },
  
  // Demi-largeur (2 photos côte à côte)
  half: {
    width: 235,
    height: 176,
  },
  
  // Demi-largeur pour row secondaire (Load)
  halfSecondary: {
    width: 244,
    height: 200,
  },
  
  // Photos petites en grille (2 colonnes, nombreuses)
  small: {
    width: 235,
    height: 140,
  },
  
  // Photos grille 2x2 (pour pages multiples)
  gridItem: {
    width: 244,
    height: 240,
  },
  
  // Miniatures (pour contrôle)
  thumbnail: {
    width: 120,
    height: 90,
  },
  
  // Pleine page (pour Load avec 1 seule photo)
  fullPage: {
    width: 500,
    height: 700,
  },
};

/**
 * Configurations de layout par nombre de photos
 * Utilisé par les sections pour déterminer automatiquement le layout
 */
export const PHOTO_LAYOUT_CONFIGS = {
  // 1 photo : pleine largeur, mise en avant
  single: {
    cols: 1,
    size: 'fullWidth',
    photosPerPage: 1,
  },
  
  // 2 photos : côte à côte ou empilées selon contexte
  pair: {
    cols: 2,
    size: 'half',
    photosPerPage: 2,
  },
  
  // 2 photos empilées verticalement
  stacked: {
    cols: 1,
    size: 'stackedLarge',
    photosPerPage: 2,
  },
  
  // 3 photos : 1 grande + 2 petites (pattern Load)
  heroPair: {
    firstSize: 'heroLoad',
    restSize: 'halfSecondary',
    photosPerPage: 3,
  },
  
  // Grille 2 colonnes standard
  grid2: {
    cols: 2,
    size: 'half',
    photosPerPage: 4,
  },
  
  // Grille 2 colonnes petite (nombreuses photos)
  grid2Small: {
    cols: 2,
    size: 'small',
    photosPerPage: 6,
  },
  
  // Grille pour pages multiples
  gridPaginated: {
    cols: 2,
    size: 'gridItem',
    photosPerPage: 4,
  },
};

/**
 * Stratégies de layout par section
 * Chaque section a sa propre stratégie adaptée à son contenu
 */
export const SECTION_PHOTO_STRATEGIES = {
  identification: {
    // Photos de pièce : vues multiples, toutes importantes
    layouts: {
      1: 'single',
      2: 'pair',
      default: 'grid2Small',
    },
    prioritizeFirst: false,
    maxPhotosFirstPage: 6,
  },
  
  load: {
    // Vue d'ensemble charge : première photo = hero
    layouts: {
      1: 'single',
      2: 'stacked',
      3: 'heroPair',
      default: 'heroPair', // Première page hero+pair, suite en grille
    },
    prioritizeFirst: true,
    maxPhotosFirstPage: 3,
    subsequentLayout: 'gridPaginated',
    maxPhotosPerPage: 4,
  },
  
  curves: {
    // Courbes : chacune importante, empilées
    layouts: {
      1: 'single',
      2: 'stacked',
      default: 'stacked',
    },
    prioritizeFirst: false,
    maxPhotosFirstPage: 2,
    maxPhotosPerPage: 2,
  },
  
  control: {
    // Photos de contrôle : petites, nombreuses
    layouts: {
      1: 'single',
      2: 'pair',
      default: 'grid2Small',
    },
    prioritizeFirst: false,
    maxPhotosFirstPage: 6,
  },
  
  micrography: {
    // Micrographies : groupées par zoom, layout adaptatif
    layouts: {
      1: 'single',
      2: 'pair',
      default: 'grid2Small',
    },
    prioritizeFirst: false,
    groupBy: 'zoom',
    maxPhotosFirstPage: 4,
  },
};

export default PHOTO_SIZES;
