/**
 * INFRASTRUCTURE: Section Courbes pour le PDF
 * Affiche les courbes de température et rapports de four avec layout intelligent
 * 
 * Refactorisé pour utiliser le système de thème et les primitives
 */

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { SPACING } from '../theme';
import { 
  SectionTitle, 
  SubsectionTitle, 
  PhotoContainer,
  EmptyState 
} from '../primitives';
import { getPhotoUrl, validatePhotos } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'curves';

// Styles spécifiques à cette section
const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.section.marginBottom,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.photo.marginBottom,
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    justifyContent: 'flex-start',
    gap: SPACING.photo.gap,
  },
  photoContainerSingle: {
    width: '100%',
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
});

/**
 * Organise les photos par catégorie (heating, cooling, tempering, alarms, datapaq, other)
 */
const organizePhotosByCategory = (photos) => {
  const categories = {
    heating: { name: 'Heating Curves', photos: [], order: 1 },
    cooling: { name: 'Cooling Curves', photos: [], order: 2 },
    tempering: { name: 'Tempering Curves', photos: [], order: 3 },
    alarms: { name: 'Alarms and Events', photos: [], order: 4 },
    datapaq: { name: 'Datapaq Reports', photos: [], order: 5 },
    other: { name: 'Other Curves', photos: [], order: 6 }
  };

  // Normaliser photos en tableau
  let allPhotos = [];
  if (Array.isArray(photos)) {
    allPhotos = photos;
  } else if (typeof photos === 'object' && photos) {
    Object.values(photos).forEach(categoryPhotos => {
      if (Array.isArray(categoryPhotos)) {
        allPhotos.push(...categoryPhotos);
      }
    });
  }

  // Classer chaque photo dans la bonne catégorie
  allPhotos.forEach(photo => {
    const subcategory = (photo.subcategory || '').toLowerCase();
    const name = (photo.name || photo.original_name || '').toLowerCase();
    
    let targetCategory = 'other';
    
    // Priorité à la subcategory si elle correspond exactement
    if (subcategory === 'heating' || subcategory === 'chauffage') {
      targetCategory = 'heating';
    } else if (subcategory === 'cooling' || subcategory === 'refroidissement') {
      targetCategory = 'cooling';
    } else if (subcategory === 'tempering' || subcategory === 'revenu') {
      targetCategory = 'tempering';
    } else if (subcategory === 'alarms' || subcategory === 'alarmes') {
      targetCategory = 'alarms';
    } else if (subcategory === 'datapaq') {
      targetCategory = 'datapaq';
    } 
    // Sinon, essayer de deviner depuis le nom
    else if (name.includes('heating') || name.includes('chauff') || name.includes('montée')) {
      targetCategory = 'heating';
    } else if (name.includes('cooling') || name.includes('refroid') || name.includes('descent')) {
      targetCategory = 'cooling';
    } else if (name.includes('tempering') || name.includes('revenu') || name.includes('temper')) {
      targetCategory = 'tempering';
    } else if (name.includes('alarm') || name.includes('alert') || name.includes('erreur') || name.includes('event')) {
      targetCategory = 'alarms';
    } else if (name.includes('datapaq') || name.includes('sensor') || name.includes('capteur')) {
      targetCategory = 'datapaq';
    }
    
    if (categories[targetCategory]) {
      categories[targetCategory].photos.push(photo);
    }
  });

  return categories;
};

/**
 * Formate le nom d'une catégorie
 */
const formatCategoryName = (categoryKey) => {
  const names = {
    heating: 'Heating Curves',
    cooling: 'Cooling Curves',
    tempering: 'Tempering Curves',
    alarms: 'Alarms and Events',
    datapaq: 'Datapaq Reports',
    other: 'Other Curves'
  };
  return names[categoryKey] || categoryKey;
};

/**
 * Get photo caption
 */
const getPhotoCaption = (photo) => {
  return photo.description && photo.description.trim() !== '' 
    ? photo.description 
    : (photo.original_name || photo.name || 'Document');
};

/**
 * Composant pour afficher un groupe de catégorie avec layout intelligent
 */
const CategoryGroup = ({ categoryKey, photos, isFirst = false }) => {
  const photoCount = photos.length;
  
  return (
    <View style={styles.section} wrap={false}>
      {isFirst && (
        <SectionTitle sectionType={SECTION_TYPE}>
          FURNACE CURVES AND REPORTS
        </SectionTitle>
      )}
      <SubsectionTitle sectionType={SECTION_TYPE}>
        {formatCategoryName(categoryKey)}
      </SubsectionTitle>
      
      {/* Layout adaptatif selon le nombre de photos */}
      {photoCount === 1 ? (
        // 1 photo : pleine largeur
        <View style={styles.photoContainerSingle}>
          <PhotoContainer 
            photo={photos[0]} 
            size="fullWidth" 
            captionText={getPhotoCaption(photos[0])}
          />
        </View>
      ) : photoCount === 2 ? (
        // 2 photos : côte à côte
        <View style={styles.photoRow}>
          {photos.map((photo, idx) => (
            <PhotoContainer 
              key={photo.id || idx}
              photo={photo} 
              size="half"
              captionText={getPhotoCaption(photo)}
            />
          ))}
        </View>
      ) : (
        // 3+ photos : grille 2 colonnes
        <View style={styles.photoGrid}>
          {photos.map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoContainerHalf}>
              <PhotoContainer
                photo={photo}
                size="small"
                captionText={getPhotoCaption(photo)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Composant principal : Section Courbes
 * Affiche toutes les courbes organisées par catégorie avec layout intelligent
 */
export const CurvesSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Organiser les photos par catégorie
  const organizedPhotos = organizePhotosByCategory(photos);
  
  // Compter le total de photos
  const totalPhotos = Object.values(organizedPhotos).reduce((total, category) => {
    return total + category.photos.length;
  }, 0);

  if (totalPhotos === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <SectionTitle sectionType={SECTION_TYPE}>
          FURNACE CURVES AND REPORTS
        </SectionTitle>
        <EmptyState message="No furnace curves or reports available for this test." />
      </View>
    );
  }

  // Ordre des categories
  const categoryOrder = ['heating', 'cooling', 'tempering', 'alarms', 'datapaq', 'other'];

  // Trouver le premier index avec des photos
  let firstWithPhotos = -1;
  categoryOrder.forEach((key, idx) => {
    if (firstWithPhotos === -1 && organizedPhotos[key]?.photos.length > 0) {
      firstWithPhotos = idx;
    }
  });

  return (
    <>
      {categoryOrder.map((categoryKey, index) => {
        const category = organizedPhotos[categoryKey];
        if (!category || category.photos.length === 0) return null;
        
        return (
          <CategoryGroup 
            key={categoryKey}
            categoryKey={categoryKey}
            photos={category.photos}
            isFirst={index === firstWithPhotos}
          />
        );
      })}
    </>
  );
};

export default CurvesSectionPDF;
