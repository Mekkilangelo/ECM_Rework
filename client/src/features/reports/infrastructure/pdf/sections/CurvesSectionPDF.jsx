/**
 * INFRASTRUCTURE: Section Courbes pour le PDF
 * Affiche les courbes de température et rapports de four avec layout intelligent
 * 
 * Refactorisé pour utiliser le système de thème et les primitives
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { SPACING, COLORS } from '../theme';
import { PhotoContainer } from '../primitives';

// Brand Colors
const BRAND_DARK = '#1e293b';

// Styles spécifiques à cette section
const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 0,
    fontFamily: 'Helvetica',
  },
  // Section Header (Dark Blue Bar)
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  sectionPagination: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  // Sub-category Title
  subCategoryTitle: {
    backgroundColor: '#3b82f6', // Lighter blue for subsections
    padding: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    borderRadius: 2,
  },
  subCategoryText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  // Content Layout
  pageContent: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2, // Minimal gap
  },
  photoWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 2,
  },
});

// ... (skipping unchanged code) ...

// Actually, I need to be careful with ReplaceFileContent context. I will target the styles block again.
// And then the PhotoContainer size separately.

// Let's do the styling update first.


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

    // Priorité à la subcategory
    if (subcategory === 'heating' || subcategory === 'chauffage') targetCategory = 'heating';
    else if (subcategory === 'cooling' || subcategory === 'refroidissement') targetCategory = 'cooling';
    else if (subcategory === 'tempering' || subcategory === 'revenu') targetCategory = 'tempering';
    else if (subcategory === 'alarms' || subcategory === 'alarmes') targetCategory = 'alarms';
    else if (subcategory === 'datapaq') targetCategory = 'datapaq';
    // Deviner depuis le nom
    else if (name.includes('heating') || name.includes('chauff')) targetCategory = 'heating';
    else if (name.includes('cooling') || name.includes('refroid')) targetCategory = 'cooling';
    else if (name.includes('tempering') || name.includes('revenu')) targetCategory = 'tempering';
    else if (name.includes('alarm') || targetCategory === 'alarms') targetCategory = 'alarms';
    else if (name.includes('datapaq')) targetCategory = 'datapaq';

    if (categories[targetCategory]) {
      categories[targetCategory].photos.push(photo);
    }
  });

  return categories;
};

/**
 * Composant principal : Section Courbes
 */
export const CurvesSectionPDF = ({ report, photos = [] }) => {
  // 1. Organiser et aplatir les items (Titres + Photos)
  const layoutItems = useMemo(() => {
    const organized = organizePhotosByCategory(photos);
    const categoryOrder = ['heating', 'cooling', 'tempering', 'alarms', 'datapaq', 'other'];
    const items = [];

    categoryOrder.forEach(catKey => {
      const cat = organized[catKey];
      if (cat.photos.length > 0) {
        // Ajouter un item Titre de catégorie
        items.push({ type: 'header', text: cat.name });
        // Ajouter les photos
        cat.photos.forEach(p => {
          items.push({ type: 'photo', data: p });
        });
      }
    });
    return items;
  }, [photos]);

  // 2. Paginer (Max 2 photos par page)
  const pages = useMemo(() => {
    const _pages = [];
    let currentPage = { items: [], photoCount: 0 };

    layoutItems.forEach((item, index) => {
      const isPhoto = item.type === 'photo';

      // Si c'est une photo et qu'on a déjà 2 photos, on change de page
      if (isPhoto && currentPage.photoCount >= 2) {
        _pages.push(currentPage);
        currentPage = { items: [], photoCount: 0 };
      }

      // Cas spécial : éviter Titre orphelin en fin de page (optionnel, mais mieux)
      // Si on est à 2 photos (donc pleine) et qu'on a un titre, il ira automatiquement sur la page suivante au prochain tour
      // Mais si on est à 1 photo, on peut ajouter Titre + Photo suivante ? Oui.
      // Le header ne compte pas comme "photoCount".

      currentPage.items.push(item);
      if (isPhoto) currentPage.photoCount++;
    });

    if (currentPage.items.length > 0) {
      _pages.push(currentPage);
    }
    return _pages;
  }, [layoutItems]);

  if (!report) return null;
  if (layoutItems.length === 0) return null;

  const totalPages = pages.length;

  return (
    <>
      {pages.map((page, index) => {
        const isFirstPage = index === 0;
        const pageNum = index + 1;

        return (
          <View key={index} style={styles.sectionContainer} break={!isFirstPage}>
            {/* Section Header (Repeated on every page) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FURNACE CURVES AND REPORTS</Text>
              <Text style={styles.sectionPagination}>{pageNum} / {totalPages}</Text>
            </View>

            {/* Page Content */}
            <View style={styles.pageContent}>
              {page.items.map((item, itemIdx) => {
                if (item.type === 'header') {
                  return (
                    <View key={`h-${itemIdx}`} style={styles.subCategoryTitle}>
                      <Text style={styles.subCategoryText}>{item.text}</Text>
                    </View>
                  );
                }
                if (item.type === 'photo') {
                  return (
                    <View key={`p-${itemIdx}`} style={styles.photoWrapper} wrap={false}>
                      {/* Taille réduite pour garantir 2 photos confortables avec titres */}
                      <PhotoContainer
                        photo={item.data}
                        customSize={{ width: 500, height: 180 }}
                        showCaption={true}
                      />
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        );
      })}
    </>
  );
};

export default CurvesSectionPDF;
