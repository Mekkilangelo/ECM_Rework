/**
 * INFRASTRUCTURE: Section Courbes pour le PDF
 * Affiche les courbes de température et rapports de four avec layout intelligent
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPhotoUrl } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  // ========== LAYOUT ==========
  section: {
    marginBottom: 12,
  },
  
  // ========== TITRES ==========
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#ffffff',
    backgroundColor: '#2c3e50',
    letterSpacing: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  subsectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#d35400',
    backgroundColor: '#fef9e7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
  },
  
  // ========== PHOTOS - Layouts adaptatifs ==========
  photoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'flex-start',
    gap: 8,
  },
  
  // Conteneurs photo selon layout
  photoContainerSingle: {
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  
  // Tailles de photos
  photo: {
    objectFit: 'cover',
    border: '0.5pt solid #d0d0d0',
  },
  photoFullWidth: {
    width: 480,
    height: 200,
  },
  photoHalfWidth: {
    width: 235,
    height: 176,
  },
  photoSmall: {
    width: 235,
    height: 140,
  },
  
  // Légendes
  photoLabel: {
    fontSize: 7.5,
    textAlign: 'center',
    marginTop: 3,
    color: '#888',
    fontStyle: 'italic',
  },
  
  // ========== ÉTATS VIDES ==========
  emptyState: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 20,
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
 * Composant pour afficher un groupe de catégorie avec layout intelligent
 */
const CategoryGroup = ({ categoryKey, photos, isFirst = false }) => {
  const photoCount = photos.length;
  
  return (
    <View style={styles.section} wrap={false}>
      {isFirst && (
        <Text style={styles.sectionTitle}>FURNACE CURVES AND REPORTS</Text>
      )}
      <Text style={styles.subsectionTitle}>
        {formatCategoryName(categoryKey)}
      </Text>
      
      {/* Layout adaptatif selon le nombre de photos */}
      {photoCount === 1 ? (
        // 1 photo : pleine largeur
        <View style={styles.photoContainerSingle}>
          <Image 
            src={getPhotoUrl(photos[0])} 
            style={[styles.photo, styles.photoFullWidth]}
          />
          <Text style={styles.photoLabel}>
            {photos[0].description && photos[0].description.trim() !== '' 
              ? photos[0].description 
              : (photos[0].original_name || photos[0].name || 'Document')}
          </Text>
        </View>
      ) : photoCount === 2 ? (
        // 2 photos : côte à côte
        <View style={styles.photoRow}>
          {photos.map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoContainerHalf}>
              <Image 
                src={getPhotoUrl(photo)} 
                style={[styles.photo, styles.photoHalfWidth]}
              />
              <Text style={styles.photoLabel}>
                {photo.description && photo.description.trim() !== '' 
                  ? photo.description 
                  : (photo.original_name || photo.name || 'Document')}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        // 3+ photos : grille 2 colonnes
        <View style={styles.photoGrid}>
          {photos.map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoContainerHalf}>
              <Image 
                src={getPhotoUrl(photo)} 
                style={[styles.photo, styles.photoSmall]}
              />
              <Text style={styles.photoLabel}>
                {photo.description && photo.description.trim() !== '' 
                  ? photo.description 
                  : (photo.original_name || photo.name || 'Document')}
              </Text>
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
        <Text style={styles.sectionTitle}>FURNACE CURVES AND REPORTS</Text>
        <Text style={styles.emptyState}>
          No furnace curves or reports available for this test.
        </Text>
      </View>
    );
  }

  // Ordre des categories : heating, cooling, tempering, alarms, datapaq, other
  const categoryOrder = ['heating', 'cooling', 'tempering', 'alarms', 'datapaq', 'other'];

  return (
    <>
      {/* Afficher toutes les catégories dans l'ordre */}
      {categoryOrder.map((categoryKey, index) => {
        const category = organizedPhotos[categoryKey];
        if (!category || category.photos.length === 0) return null;
        
        return (
          <CategoryGroup 
            key={categoryKey}
            categoryKey={categoryKey}
            photos={category.photos}
            isFirst={index === 0}
          />
        );
      })}
    </>
  );
};

export default CurvesSectionPDF;