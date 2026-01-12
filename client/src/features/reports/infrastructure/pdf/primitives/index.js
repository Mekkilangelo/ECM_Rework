/**
 * PRIMITIVES: Export centralisé des composants primitifs PDF
 * 
 * Ces composants sont les briques de base réutilisables par toutes les sections.
 * Chaque section compose ces primitives selon ses besoins spécifiques.
 */

export { SectionTitle, default as SectionTitleDefault } from './SectionTitle';
export { SubsectionTitle, default as SubsectionTitleDefault } from './SubsectionTitle';
export { DataRow, default as DataRowDefault } from './DataRow';
export { DataTable, default as DataTableDefault } from './DataTable';
export { 
  PhotoContainer, 
  PhotoContainerInline,
  default as PhotoContainerDefault 
} from './PhotoContainer';
export { 
  PhotoGrid2, 
  PhotoRow, 
  PhotoStack, 
  PhotoHero, 
  PhotoHeroPair,
  default as PhotoLayoutsDefault
} from './PhotoLayouts';
export { EmptyState, default as EmptyStateDefault } from './EmptyState';
