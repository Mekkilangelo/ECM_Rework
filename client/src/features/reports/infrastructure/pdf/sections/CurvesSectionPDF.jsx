/**
 * INFRASTRUCTURE: Section Courbes pour le PDF - Version Améliorée
 * Affiche les courbes de température et rapports de four avec pagination intelligente
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPhotoUrl, calculatePhotoLayout, validatePhotos } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 15,
    border: '1pt solid #e0e0e0',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    borderBottom: '2pt solid #ff9800',
    paddingBottom: 6,
    textAlign: 'center',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#e65100',
    backgroundColor: '#fff3e0',
    padding: 8,
    borderLeft: '4pt solid #ff9800',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 10,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  photo: {
    objectFit: 'cover',
    border: '1pt solid #ddd',
    borderRadius: 2,
  },
  photoLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
    maxWidth: 150,
    lineHeight: 1.2,
  },
  categoryLabel: {
    fontSize: 7,
    color: '#e65100',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyState: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  analysisInfo: {
    fontSize: 10,
    color: '#555',
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 3,
    border: '1pt solid #e9ecef',
  },
  photoCounter: {
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    marginTop: 1,
  }
});

/**
 * Composant Section Courbes pour le PDF
 */
export const CurvesSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Organiser les photos par catégorie
  const organizedPhotos = (() => {
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

    // Organiser par catégorie
    const categories = {
      heating: { name: 'Courbes de Chauffage', photos: [], order: 1 },
      cooling: { name: 'Courbes de Refroidissement', photos: [], order: 2 },
      datapaq: { name: 'Rapports Datapaq', photos: [], order: 3 },
      alarms: { name: 'Alarmes et Événements', photos: [], order: 4 },
      other: { name: 'Autres Rapports', photos: [], order: 5 }
    };

    allPhotos.forEach(photo => {
      const category = photo.category || photo.subcategory || 'other';
      const name = (photo.name || photo.original_name || '').toLowerCase();
      
      // Déterminer la catégorie basée sur le nom ou la métadonnée
      let targetCategory = 'other';
      
      if (category === 'heating' || name.includes('heating') || name.includes('chauff') || name.includes('montée')) {
        targetCategory = 'heating';
      } else if (category === 'cooling' || name.includes('cooling') || name.includes('refroid') || name.includes('descent')) {
        targetCategory = 'cooling';
      } else if (category === 'datapaq' || name.includes('datapaq') || name.includes('sensor') || name.includes('capteur')) {
        targetCategory = 'datapaq';
      } else if (category === 'alarms' || name.includes('alarm') || name.includes('alert') || name.includes('erreur')) {
        targetCategory = 'alarms';
      }
      
      if (categories[targetCategory]) {
        categories[targetCategory].photos.push(photo);
      }
    });

    return categories;
  })();



  // Compter le total de photos
  const totalPhotos = Object.values(organizedPhotos).reduce((total, category) => {
    return total + category.photos.length;
  }, 0);

  if (totalPhotos === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>COURBES ET RAPPORTS DE FOUR</Text>
        <Text style={styles.emptyState}>
          Aucune courbe ou rapport de four disponible pour cet essai.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>COURBES ET RAPPORTS DE FOUR</Text>
        
        <Text style={styles.analysisInfo}>
          Cette section présente les courbes de température et les rapports de four générés durant l'essai.
          Les données incluent les phases de chauffage, refroidissement, ainsi que les rapports de capteurs et alarmes.
          Total : {totalPhotos} document{totalPhotos > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Parcourir les catégories */}
      {Object.entries(organizedPhotos)
        .filter(([_, category]) => category.photos.length > 0)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([categoryKey, category]) => {
          const layout = calculatePhotoLayout(category.photos.length, 'curves');
          
          return (
            <View key={categoryKey} style={styles.section} wrap={false}>
              <Text style={styles.categoryTitle}>
                {category.name} ({category.photos.length} document{category.photos.length > 1 ? 's' : ''})
              </Text>
              
              <View style={styles.photoGrid}>
                {category.photos.map((photo, photoIndex) => (
                  <View key={photo.id || photoIndex} style={[
                    styles.photoContainer,
                    { width: `${100 / layout.cols}%` }
                  ]}>
                    <Image 
                      src={getPhotoUrl(photo)} 
                      style={[
                        styles.photo,
                        { 
                          width: layout.photoWidth, 
                          height: layout.photoHeight 
                        }
                      ]}
                    />
                    {(photo.original_name || photo.name) && (
                      <Text style={styles.photoLabel}>
                        {photo.original_name || photo.name}
                      </Text>
                    )}
                    <Text style={styles.categoryLabel}>
                      {category.name}
                    </Text>
                    <Text style={styles.photoCounter}>
                      {categoryKey.toUpperCase()}-{photoIndex + 1}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
    </>
  );
};

export default CurvesSectionPDF;