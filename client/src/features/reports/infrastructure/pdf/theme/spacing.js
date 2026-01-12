/**
 * THEME: Système d'espacement du rapport PDF
 * Basé sur une unité de base de 4px
 */

const BASE = 4;

export const SPACING = {
  // Espacements de base (multiples de 4)
  xs: BASE,           // 4
  sm: BASE * 2,       // 8
  md: BASE * 3,       // 12
  lg: BASE * 4,       // 16
  xl: BASE * 5,       // 20
  xxl: BASE * 6,      // 24
  xxxl: BASE * 8,     // 32
  
  // Espacements sémantiques
  page: {
    padding: 40,
    headerMargin: 20,
    footerMargin: 30,
  },
  
  section: {
    marginBottom: 16,
    titlePaddingV: 8,
    titlePaddingH: 12,
    titleMarginBottom: 12,
  },
  
  subsection: {
    marginTop: 12,
    marginBottom: 8,
    paddingV: 6,
    paddingH: 8,
  },
  
  photo: {
    gap: 8,
    marginBottom: 8,
    captionMarginTop: 3,
  },
  
  dataRow: {
    marginBottom: 8,
    paddingBottom: 6,
  },
  
  table: {
    cellPaddingH: 6,
    cellPaddingV: 3,
    marginTop: 6,
    marginBottom: 10,
  },
};

export default SPACING;
