/**
 * INFRASTRUCTURE: Section Micrographie pour le PDF - Version Améliorée
 * Affiche les micrographies organisées par résultat/échantillon/grossissement avec pagination intelligente
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
    borderBottom: '2pt solid #8bc34a',
    paddingBottom: 6,
    textAlign: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderLeft: '4pt solid #4caf50',
  },
  sampleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#1976d2',
    backgroundColor: '#e3f2fd',
    padding: 6,
    borderLeft: '3pt solid #2196f3',
  },
  magnificationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
    color: '#7b1fa2',
    backgroundColor: '#f3e5f5',
    padding: 4,
    borderLeft: '2pt solid #9c27b0',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 10,
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
    maxWidth: 120,
    lineHeight: 1.2,
  },
  magnificationLabel: {
    fontSize: 7,
    color: '#9c27b0',
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
 * Composant Section Micrographie pour le PDF
 */
export const MicrographySectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // S'assurer que photos est toujours un tableau valide et organiser par métadonnées
  const organizedPhotos = (() => {
    let allPhotos = [];
    
    if (Array.isArray(photos)) {
      allPhotos = photos;
    } else if (typeof photos === 'object' && photos) {
      // Si c'est un objet avec des sous-catégories, les aplatir
      Object.values(photos).forEach(categoryPhotos => {
        if (Array.isArray(categoryPhotos)) {
          allPhotos.push(...categoryPhotos);
        }
      });
    }

    // Organiser les photos par résultat, échantillon et grossissement
    const organized = {};
    
    allPhotos.forEach(photo => {
      // Extraire les métadonnées de la photo ou de sa sous-catégorie
      const subcategory = photo.subcategory || '';
      const name = photo.name || photo.original_name || '';
      
      // Parser les informations depuis la sous-catégorie (format: result-X-sample-Y-magnification)
      let resultIndex = 0;
      let sampleIndex = 0;
      let magnification = 'unknown';
      
      if (subcategory.includes('result-')) {
        const resultMatch = subcategory.match(/result-(\d+)/);
        const sampleMatch = subcategory.match(/sample-(\d+)/);
        const magMatch = subcategory.match(/(x\d+|other)$/);
        
        if (resultMatch) resultIndex = parseInt(resultMatch[1]) - 1;
        if (sampleMatch) sampleIndex = parseInt(sampleMatch[1]) - 1;
        if (magMatch) magnification = magMatch[1];
      } else {
        // Essayer de parser depuis le nom du fichier
        const nameMatch = name.match(/result[_-]?(\d+)|échantillon[_-]?(\d+)|sample[_-]?(\d+)|(x\d+)/gi);
        if (nameMatch) {
          nameMatch.forEach(match => {
            if (match.toLowerCase().includes('result')) {
              const num = match.match(/\d+/);
              if (num) resultIndex = parseInt(num[0]) - 1;
            } else if (match.toLowerCase().includes('sample') || match.toLowerCase().includes('échantillon')) {
              const num = match.match(/\d+/);
              if (num) sampleIndex = parseInt(num[0]) - 1;
            } else if (match.toLowerCase().startsWith('x')) {
              magnification = match.toLowerCase();
            }
          });
        }
      }
      
      const resultKey = `result_${resultIndex}`;
      const sampleKey = `sample_${sampleIndex}`;
      
      if (!organized[resultKey]) {
        organized[resultKey] = {
          index: resultIndex,
          samples: {}
        };
      }
      
      if (!organized[resultKey].samples[sampleKey]) {
        organized[resultKey].samples[sampleKey] = {
          index: sampleIndex,
          magnifications: {}
        };
      }
      
      if (!organized[resultKey].samples[sampleKey].magnifications[magnification]) {
        organized[resultKey].samples[sampleKey].magnifications[magnification] = [];
      }
      
      organized[resultKey].samples[sampleKey].magnifications[magnification].push({
        ...photo,
        parsedMagnification: magnification
      });
    });
    
    return organized;
  })();



  // Formater le nom du grossissement
  const formatMagnification = (mag) => {
    if (mag === 'unknown') return 'Grossissement non spécifié';
    if (mag === 'other') return 'Autre grossissement';
    if (mag.startsWith('x')) return `Grossissement ${mag.toUpperCase()}`;
    return mag;
  };

  // Compter le total de photos
  const totalPhotos = Object.values(organizedPhotos).reduce((total, result) => {
    return total + Object.values(result.samples).reduce((sampleTotal, sample) => {
      return sampleTotal + Object.values(sample.magnifications).reduce((magTotal, photos) => {
        return magTotal + photos.length;
      }, 0);
    }, 0);
  }, 0);

  if (totalPhotos === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>ANALYSE MICROGRAPHIQUE</Text>
        <Text style={styles.emptyState}>
          Aucune micrographie disponible pour cet essai.
          L'analyse métallographique n'a pas été réalisée ou les images ne sont pas encore disponibles.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>ANALYSE MICROGRAPHIQUE</Text>
        
        <Text style={styles.analysisInfo}>
          Cette section présente les micrographies obtenues lors de l'analyse métallographique.
          Les images sont organisées par résultat d'analyse, échantillon et grossissement.
          Total : {totalPhotos} micrographie{totalPhotos > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Parcourir les résultats */}
      {Object.keys(organizedPhotos)
        .sort((a, b) => organizedPhotos[a].index - organizedPhotos[b].index)
        .map(resultKey => {
          const result = organizedPhotos[resultKey];
          
          return (
            <React.Fragment key={resultKey}>
              <View style={styles.section} wrap={false}>
                <Text style={styles.resultTitle}>
                  RÉSULTAT {result.index + 1}
                </Text>
                
                {/* Parcourir les échantillons */}
                {Object.keys(result.samples)
                  .sort((a, b) => result.samples[a].index - result.samples[b].index)
                  .map(sampleKey => {
                    const sample = result.samples[sampleKey];
                    
                    return (
                      <View key={`${resultKey}-${sampleKey}`} style={{ marginBottom: 15 }}>
                        <Text style={styles.sampleTitle}>
                          Échantillon {sample.index + 1}
                        </Text>
                        
                        {/* Parcourir les grossissements */}
                        {Object.keys(sample.magnifications)
                          .sort((a, b) => {
                            // Trier les grossissements par ordre numérique
                            const aNum = a.match(/\d+/) ? parseInt(a.match(/\d+/)[0]) : 0;
                            const bNum = b.match(/\d+/) ? parseInt(b.match(/\d+/)[0]) : 0;
                            return aNum - bNum;
                          })
                          .map(magnification => {
                            const photos = sample.magnifications[magnification];
                            const layout = calculatePhotoLayout(photos.length, 'micrography');
                            
                            return (
                              <View key={`${resultKey}-${sampleKey}-${magnification}`} style={{ marginBottom: 12 }}>
                                <Text style={styles.magnificationTitle}>
                                  {formatMagnification(magnification)} ({photos.length} image{photos.length > 1 ? 's' : ''})
                                </Text>
                                
                                <View style={styles.photoGrid}>
                                  {photos.map((photo, photoIndex) => (
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
                                      <Text style={styles.magnificationLabel}>
                                        {formatMagnification(magnification)}
                                      </Text>
                                      <Text style={styles.photoCounter}>
                                        R{result.index + 1}-É{sample.index + 1}-{photoIndex + 1}
                                      </Text>
                                    </View>
                                  ))}
                                </View>
                              </View>
                            );
                          })}
                      </View>
                    );
                  })}
              </View>
            </React.Fragment>
          );
        })}
    </>
  );
};

export default MicrographySectionPDF;