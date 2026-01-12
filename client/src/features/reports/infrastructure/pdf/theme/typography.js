/**
 * THEME: Échelle typographique du rapport PDF
 * Définit toutes les tailles et styles de texte
 */

export const TYPOGRAPHY = {
  // Titres
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
  },
  
  pageTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1,
  },
  
  subsectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  
  // Corps de texte
  body: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  
  bodySmall: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  
  // Labels
  label: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  
  labelSmall: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
  },
  
  // Valeurs
  value: {
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  
  valueSmall: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
  },
  
  // Légendes et annotations
  caption: {
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    fontStyle: 'italic',
  },
  
  // Tableaux
  tableHeader: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  
  tableCell: {
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  
  // Pied de page
  footer: {
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  
  footerSmall: {
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
  
  // Éléments spéciaux
  badge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  
  axisLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica',
  },
};

export default TYPOGRAPHY;
