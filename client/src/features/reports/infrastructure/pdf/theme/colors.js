/**
 * THEME: Palette de couleurs du rapport PDF
 * Source unique de vérité pour toutes les couleurs
 */

export const COLORS = {
  // Couleurs principales de la marque
  brand: {
    primary: '#DC3545',      // Rouge ECM
    secondary: '#2c3e50',    // Bleu foncé (titres sections)
    dark: '#1a1a2e',         // Bleu très foncé (page de garde)
  },

  // Couleur d'accent par section (identité propre de chaque section)
  accent: {
    identification: '#3498db',  // Bleu
    load: '#16a085',            // Vert teal
    curves: '#f39c12',          // Orange
    datapaq: '#e67e22',         // Orange foncé
    postTreatment: '#8e44ad',   // Violet
    recipe: '#e74c3c',          // Rouge
    control: '#27ae60',         // Vert
    micrography: '#9b59b6',     // Violet
  },

  // Couleurs de texte
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    muted: '#999999',
    light: '#888888',
    white: '#ffffff',
  },

  // Couleurs de fond
  background: {
    white: '#ffffff',
    light: '#f8f9fa',
    subtle: '#fafafa',
    section: '#2c3e50',
    
    // Fonds spécifiques par section (sous-titres)
    identification: '#ecf0f1',
    load: '#e8f6f3',
    curves: '#fef9e7',
    datapaq: '#fef5e7',
    postTreatment: '#f5eef8',
    recipe: '#fef5e7',
    control: '#eafaf1',
    micrography: '#f4ecf7',
  },

  // Couleurs de texte pour sous-titres par section
  subsectionText: {
    identification: '#2c3e50',
    load: '#117864',
    curves: '#d35400',
    datapaq: '#ba4a00',
    postTreatment: '#6c3483',
    recipe: '#c0392b',
    control: '#1e8449',
    micrography: '#6c3483',
  },

  // Bordures
  border: {
    light: '#e0e0e0',
    medium: '#cccccc',
    dark: '#dddddd',
    photo: '#d0d0d0',
  },

  // États spéciaux
  status: {
    success: '#4caf50',
    successLight: '#e8f5e9',
    error: '#f44336',
    warning: '#ff9800',
  },
};

/**
 * Récupère la couleur d'accent pour une section
 * @param {string} sectionType - Type de section
 * @returns {string} Couleur d'accent
 */
export const getAccentColor = (sectionType) => {
  return COLORS.accent[sectionType] || COLORS.brand.primary;
};

/**
 * Récupère la couleur de fond pour les sous-titres d'une section
 * @param {string} sectionType - Type de section
 * @returns {string} Couleur de fond
 */
export const getSubsectionBackground = (sectionType) => {
  return COLORS.background[sectionType] || COLORS.background.light;
};

/**
 * Récupère la couleur de texte pour les sous-titres d'une section
 * @param {string} sectionType - Type de section
 * @returns {string} Couleur de texte
 */
export const getSubsectionTextColor = (sectionType) => {
  return COLORS.subsectionText[sectionType] || COLORS.text.secondary;
};

export default COLORS;
