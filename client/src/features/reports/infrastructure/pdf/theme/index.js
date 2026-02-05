/**
 * THEME: Export centralisé du système de design PDF
 * 
 * Import unique pour accéder à toutes les constantes de style.
 * 
 * Usage:
 * import { COLORS, TYPOGRAPHY, SPACING, PHOTO_SIZES } from '../theme';
 */

export {
  COLORS,
  getAccentColor,
  getSubsectionBackground,
  getSubsectionTextColor
} from './colors';

export { TYPOGRAPHY } from './typography';

export { SPACING } from './spacing';

export {
  PHOTO_SIZES,
  PHOTO_LAYOUT_CONFIGS,
  SECTION_PHOTO_STRATEGIES
} from './photoSizes';

// Styles globaux pré-composés pour réutilisation rapide
export const COMMON_STYLES = {
  // Style de base pour une page
  page: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },

  // Style de bordure photo
  photoBorder: {
    borderWidth: 0.5,
    borderColor: '#d0d0d0',
    borderStyle: 'solid',
  },

  // Style ligne de séparation
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8e8e8',
  },
};
