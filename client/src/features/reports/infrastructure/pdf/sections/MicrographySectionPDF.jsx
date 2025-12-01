/**
 * INFRASTRUCTURE: Section Micrographie pour le PDF - Version Améliorée
 * Affiche les micrographies organisées par résultat/échantillon/grossissement avec pagination intelligente
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

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
    boxShadow: '0 2pt 4pt rgba(0,0,0,0.1)',
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
  pageBreak: {
    marginTop: 20,
    borderTop: '1pt dashed #ccc',
    paddingTop: 15,
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

  // Helper pour obtenir l'URL de la photo
  const getPhotoUrl = (photo) => {
    if (!photo) return '';
    
    if (photo.url) return photo.url;
    
    if (photo.file_path) {
      return `http://localhost:5001${photo.file_path.replace(/\\/g, '/')}`;
    }
    
    if (photo.id || photo.node_id) {
      return `http://localhost:5001/api/files/${photo.id || photo.node_id}/preview`;
    }
    
    return '';
  };\n\n  // Calculer la mise en page optimale des photos\n  const calculatePhotoLayout = (photoCount) => {\n    if (photoCount === 0) return { cols: 0, photoWidth: 0, photoHeight: 0 };\n    if (photoCount === 1) return { cols: 1, photoWidth: 180, photoHeight: 135 };\n    if (photoCount === 2) return { cols: 2, photoWidth: 140, photoHeight: 105 };\n    if (photoCount <= 4) return { cols: 2, photoWidth: 120, photoHeight: 90 };\n    if (photoCount <= 6) return { cols: 3, photoWidth: 100, photoHeight: 75 };\n    return { cols: 3, photoWidth: 80, photoHeight: 60 };\n  };\n\n  // Formater le nom du grossissement\n  const formatMagnification = (mag) => {\n    if (mag === 'unknown') return 'Grossissement non spécifié';\n    if (mag === 'other') return 'Autre grossissement';\n    if (mag.startsWith('x')) return `Grossissement ${mag.toUpperCase()}`;\n    return mag;\n  };\n\n  // Compter le total de photos\n  const totalPhotos = Object.values(organizedPhotos).reduce((total, result) => {\n    return total + Object.values(result.samples).reduce((sampleTotal, sample) => {\n      return sampleTotal + Object.values(sample.magnifications).reduce((magTotal, photos) => {\n        return magTotal + photos.length;\n      }, 0);\n    }, 0);\n  }, 0);\n\n  if (totalPhotos === 0) {\n    return (\n      <View style={styles.section} wrap={false}>\n        <Text style={styles.sectionTitle}>ANALYSE MICROGRAPHIQUE</Text>\n        <Text style={styles.emptyState}>\n          Aucune micrographie disponible pour cet essai.\n          L'analyse métallographique n'a pas été réalisée ou les images ne sont pas encore disponibles.\n        </Text>\n      </View>\n    );\n  }\n\n  return (\n    <>\n      <View style={styles.section} wrap={false}>\n        <Text style={styles.sectionTitle}>ANALYSE MICROGRAPHIQUE</Text>\n        \n        <Text style={styles.analysisInfo}>\n          Cette section présente les micrographies obtenues lors de l'analyse métallographique.\n          Les images sont organisées par résultat d'analyse, échantillon et grossissement.\n          Total : {totalPhotos} micrographie{totalPhotos > 1 ? 's' : ''}\n        </Text>\n      </View>\n\n      {/* Parcourir les résultats */}\n      {Object.keys(organizedPhotos)\n        .sort((a, b) => organizedPhotos[a].index - organizedPhotos[b].index)\n        .map(resultKey => {\n          const result = organizedPhotos[resultKey];\n          \n          return (\n            <React.Fragment key={resultKey}>\n              <View style={styles.section} wrap={false}>\n                <Text style={styles.resultTitle}>\n                  RÉSULTAT {result.index + 1}\n                </Text>\n                \n                {/* Parcourir les échantillons */}\n                {Object.keys(result.samples)\n                  .sort((a, b) => result.samples[a].index - result.samples[b].index)\n                  .map(sampleKey => {\n                    const sample = result.samples[sampleKey];\n                    \n                    return (\n                      <View key={`${resultKey}-${sampleKey}`} style={{ marginBottom: 15 }}>\n                        <Text style={styles.sampleTitle}>\n                          Échantillon {sample.index + 1}\n                        </Text>\n                        \n                        {/* Parcourir les grossissements */}\n                        {Object.keys(sample.magnifications)\n                          .sort((a, b) => {\n                            // Trier les grossissements par ordre numérique\n                            const aNum = a.match(/\\d+/) ? parseInt(a.match(/\\d+/)[0]) : 0;\n                            const bNum = b.match(/\\d+/) ? parseInt(b.match(/\\d+/)[0]) : 0;\n                            return aNum - bNum;\n                          })\n                          .map(magnification => {\n                            const photos = sample.magnifications[magnification];\n                            const layout = calculatePhotoLayout(photos.length);\n                            \n                            return (\n                              <View key={`${resultKey}-${sampleKey}-${magnification}`} style={{ marginBottom: 12 }}>\n                                <Text style={styles.magnificationTitle}>\n                                  {formatMagnification(magnification)} ({photos.length} image{photos.length > 1 ? 's' : ''})\n                                </Text>\n                                \n                                <View style={styles.photoGrid}>\n                                  {photos.map((photo, photoIndex) => (\n                                    <View key={photo.id || photoIndex} style={[\n                                      styles.photoContainer,\n                                      { width: `${100 / layout.cols}%` }\n                                    ]}>\n                                      <Image \n                                        src={getPhotoUrl(photo)} \n                                        style={[\n                                          styles.photo,\n                                          { \n                                            width: layout.photoWidth, \n                                            height: layout.photoHeight \n                                          }\n                                        ]}\n                                      />\n                                      {(photo.description || photo.original_name || photo.name) && (\n                                        <Text style={styles.photoLabel}>\n                                          {photo.description || photo.original_name || photo.name}\n                                        </Text>\n                                      )}\n                                      <Text style={styles.magnificationLabel}>\n                                        {formatMagnification(magnification)}\n                                      </Text>\n                                      <Text style={styles.photoCounter}>\n                                        R{result.index + 1}-É{sample.index + 1}-{photoIndex + 1}\n                                      </Text>\n                                    </View>\n                                  ))}\n                                </View>\n                              </View>\n                            );\n                          })}\n                      </View>\n                    );\n                  })}\n              </View>\n            </React.Fragment>\n          );\n        })}\n    </>\n  );\n};\n\nexport default MicrographySectionPDF;