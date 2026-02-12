/**
 * THEME: Système d'espacement du rapport PDF
 * Basé sur une unité de base de 4px
 */

const BASE = 2;

export const SPACING = {
  // Espacements de base (multiples de 2) - Réduits pour maximiser l'espace
  xs: BASE,           // 2
  sm: BASE * 2,       // 4
  md: BASE * 3,       // 6
  lg: BASE * 4,       // 8
  xl: BASE * 5,       // 10
  xxl: BASE * 6,      // 12
  xxxl: BASE * 8,     // 16

  // Espacements sémantiques - Minimisés
  page: {
    padding: 15,
    headerMargin: 8,
    footerMargin: 10,
  },

  section: {
    marginBottom: 6,
    titlePaddingV: 3,
    titlePaddingH: 6,
    titleMarginBottom: 4,
  },

  subsection: {
    marginTop: 4,
    marginBottom: 3,
    paddingV: 3,
    paddingH: 5,
  },

  photo: {
    gap: 4,
    marginBottom: 3,
    captionMarginTop: 2,
  },

  dataRow: {
    marginBottom: 4,
    paddingBottom: 3,
  },

  table: {
    cellPaddingH: 4,
    cellPaddingV: 2,
    marginTop: 3,
    marginBottom: 4,
  },
};

export default SPACING;
