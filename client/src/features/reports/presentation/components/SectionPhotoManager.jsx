import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { Row, Col, Card, Button, Badge, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import CollapsibleSection from '../../../../components/common/CollapsibleSection/CollapsibleSection';
import fileService from '../../../../services/fileService';

// Reducer pour gérer les états de sélection de façon synchrone
const selectionReducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_PHOTO': {
      const { photoId } = action.payload;
      const isCurrentlySelected = state.selectedPhotoIds.includes(photoId);
      
      const newSelectedIds = isCurrentlySelected 
        ? state.selectedPhotoIds.filter(id => id !== photoId)
        : [...state.selectedPhotoIds, photoId];
      
      let newOrder = { ...state.photoOrder };
      
      if (isCurrentlySelected) {
        // Supprimer la photo et réorganiser les ordres
        const removedOrder = newOrder[photoId];
        delete newOrder[photoId];
        // Réajuster les ordres des photos restantes
        Object.keys(newOrder).forEach(id => {
          if (newOrder[id] > removedOrder) {
            newOrder[id] = newOrder[id] - 1;
          }
        });
      } else {
        // Ajouter la photo avec le prochain ordre disponible
        const maxOrder = Math.max(0, ...Object.values(newOrder));
        newOrder[photoId] = maxOrder + 1;
      }
      
      return {
        ...state,
        selectedPhotoIds: newSelectedIds,
        photoOrder: newOrder,
        forceUpdate: state.forceUpdate + 1
      };
    }
    
    case 'TOGGLE_GROUP': {
      const { photoIds, select } = action.payload;
      let newSelectedIds = [...state.selectedPhotoIds];
      let newOrder = { ...state.photoOrder };
      
      if (select) {
        // Sélectionner toutes les photos non sélectionnées
        let currentMaxOrder = Math.max(0, ...Object.values(newOrder));
        photoIds.forEach(photoId => {
          if (!newSelectedIds.includes(photoId)) {
            newSelectedIds.push(photoId);
            currentMaxOrder += 1;
            newOrder[photoId] = currentMaxOrder;
          }
        });
      } else {
        // Désélectionner toutes les photos sélectionnées
        const photosToRemove = photoIds.filter(id => newSelectedIds.includes(id));
        photosToRemove.forEach(photoId => {
          newSelectedIds = newSelectedIds.filter(id => id !== photoId);
          delete newOrder[photoId];
        });
        
        // Réorganiser les ordres après suppression
        const remainingPhotos = Object.entries(newOrder)
          .sort(([,a], [,b]) => a - b)
          .map(([id]) => id);
        
        newOrder = {};
        remainingPhotos.forEach((id, index) => {
          newOrder[id] = index + 1;
        });
      }
      
      return {
        ...state,
        selectedPhotoIds: newSelectedIds,
        photoOrder: newOrder,
        forceUpdate: state.forceUpdate + 1
      };
    }

    case 'SET_SELECTION': {
      return {
        ...state,
        selectedPhotoIds: action.payload.selectedIds,
        photoOrder: action.payload.order,
        forceUpdate: state.forceUpdate + 1
      };
    }
    
    case 'RESET': {
      return {
        selectedPhotoIds: [],
        photoOrder: {},
        forceUpdate: 0
      };
    }
    
    default:
      return state;
  }
};

const SectionPhotoManager = ({
  trialNodeId,
  partNodeId,
  sectionType,
  onChange,
  initialSelectedPhotos = {},
  show = false
}) => {
  const { t } = useTranslation();
  const abortControllerRef = useRef(null);
  
  // États
  const [availablePhotos, setAvailablePhotos] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [pendingChange, setPendingChange] = useState(null);
  
  // Utiliser useReducer pour les états de sélection
  const [selectionState, dispatchSelection] = useReducer(selectionReducer, {
    selectedPhotoIds: [],
    photoOrder: {},
    forceUpdate: 0
  });
  
  const { selectedPhotoIds, photoOrder, forceUpdate } = selectionState;
  
  // Cleanup lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Configuration des sections avec i18n
  const getSectionConfig = () => {
    // Fonction helper pour les traductions avec fallback
    const tSafe = (key, fallback, options = {}) => {
      try {
        const translated = t(key, options);
        return translated !== key ? translated : fallback;
      } catch (error) {
        console.warn(`Translation error for key "${key}":`, error);
        return fallback;
      }
    };

    return {
      identification: {
        nodeId: partNodeId,
        title: tSafe('parts.photos.manager.sections.identification.title', 'Photos de la pièce'),
        description: tSafe('parts.photos.manager.sections.identification.description', 'Différentes vues de la pièce'),
        sources: [
          { 
            category: 'photos', 
            subcategory: 'front',
            label: tSafe('parts.photos.manager.sections.identification.categories.front', 'Vue de face'),
            description: tSafe('parts.photos.manager.sections.identification.descriptions.front', 'Photos prises de face')
          },
          { 
            category: 'photos', 
            subcategory: 'profile',
            label: tSafe('parts.photos.manager.sections.identification.categories.profile', 'Vue de profil'), 
            description: tSafe('parts.photos.manager.sections.identification.descriptions.profile', 'Photos prises de profil')
          },
          { 
            category: 'photos', 
            subcategory: 'quarter',
            label: tSafe('parts.photos.manager.sections.identification.categories.quarter', 'Vue en trois-quarts'),
            description: tSafe('parts.photos.manager.sections.identification.descriptions.quarter', 'Photos prises en trois-quarts')
          },
          { 
            category: 'photos', 
            subcategory: 'other',
            label: tSafe('parts.photos.manager.sections.identification.categories.other', 'Autres vues'),
            description: tSafe('parts.photos.manager.sections.identification.descriptions.other', 'Autres angles et vues')
          }
        ]
      },      micrography: {
        nodeId: trialNodeId,
        title: tSafe('parts.photos.manager.sections.micrography.title', 'Micrographies'),
        description: tSafe('parts.photos.manager.sections.micrography.description', 'Images micrographiques par résultat et échantillon'),
        // Configuration dynamique - sera générée dans loadPhotosForSection
        sources: [],
        isDynamic: true, // Flag pour indiquer que les sources doivent être générées dynamiquement
        maxResults: 5, // Réduit à 5 pour optimiser (était 10)
        maxSamples: 3,  // Réduit à 3 pour optimiser (était 5)
        magnifications: ['x50', 'x500', 'x1000', 'other'] // Grossissements disponibles
      },
      control: {
        nodeId: trialNodeId,
        title: tSafe('parts.photos.manager.sections.controlLocation.title', 'Localisation de contrôle'),
        description: tSafe('parts.photos.manager.sections.controlLocation.description', 'Photos des zones de contrôle par résultat et échantillon'),
        sources: [],
        isDynamic: true,
        maxResults: 5,
        maxSamples: 3
      },
      controlLocation: {
        nodeId: trialNodeId,
        title: tSafe('parts.photos.manager.sections.controlLocation.title', 'Localisation de contrôle'),
        description: tSafe('parts.photos.manager.sections.controlLocation.description', 'Photos des zones de contrôle par résultat et échantillon'),
        sources: [],
        isDynamic: true,
        maxResults: 5,
        maxSamples: 3
      },
      load: {
        nodeId: trialNodeId,
        title: tSafe('parts.photos.manager.sections.load.title', 'Photos de charge'),
        description: tSafe('parts.photos.manager.sections.load.description', 'Disposition et configuration de la charge'),
        sources: [
          { 
            category: 'load_design', 
            subcategory: 'load_design',
            label: tSafe('parts.photos.manager.sections.load.categories.load_design', 'Configuration de charge'),
            description: tSafe('parts.photos.manager.sections.load.descriptions.load_design', 'Photos de la disposition de la charge')
          }
        ]
      },
      curves: {
        nodeId: trialNodeId,
        title: tSafe('parts.photos.manager.sections.curves.title', 'Rapports de four'),
        description: tSafe('parts.photos.manager.sections.curves.description', 'Courbes et rapports de température'),
        sources: [
          { 
            category: 'furnace_report', 
            subcategory: 'heating',
            label: tSafe('parts.photos.manager.sections.curves.categories.heating', 'Courbes de chauffe'),
            description: tSafe('parts.photos.manager.sections.curves.descriptions.heating', 'Graphiques de montée en température')
          },
          { 
            category: 'furnace_report', 
            subcategory: 'cooling',
            label: tSafe('parts.photos.manager.sections.curves.categories.cooling', 'Courbes de refroidissement'),
            description: tSafe('parts.photos.manager.sections.curves.descriptions.cooling', 'Graphiques de refroidissement')
          },
          { 
            category: 'furnace_report', 
            subcategory: 'tempering',
            label: tSafe('parts.photos.manager.sections.curves.categories.tempering', 'Courbes de revenu'),
            description: tSafe('parts.photos.manager.sections.curves.descriptions.tempering', 'Graphiques de traitement de revenu')
          },
          {
            category: 'datapaq',
            subcategory: 'datapaq',
            label: tSafe('parts.photos.manager.sections.curves.categories.datapaq', 'Données Datapaq'),
            description: tSafe('parts.photos.manager.sections.curves.descriptions.datapaq', 'Relevés des capteurs Datapaq')
          },
          { 
            category: 'furnace_report', 
            subcategory: 'alarms',
            label: tSafe('parts.photos.manager.sections.curves.categories.alarms', 'Alarmes'),            description: tSafe('parts.photos.manager.sections.curves.descriptions.alarms', 'Rapports d\'alarmes et événements')
          }
        ]
      }
    };
  };  // Générer dynamiquement les sources pour la section micrography
  const generateMicrographySources = async (nodeId, config) => {
    const sources = [];
    const { maxResults = 10, maxSamples = 5, magnifications = ['x50', 'x500', 'x1000', 'other'] } = config;
    
    // Fonction helper pour les traductions avec fallback
    const tSafe = (key, fallback, options = {}) => {
      try {
        const translated = t(key, options);
        return translated !== key ? translated : fallback;
      } catch (error) {
        console.warn(`Translation error for key "${key}":`, error);
        return fallback;
      }
    };

    if (process.env.NODE_ENV === 'development') {
      // Recherche optimisée de micrographies
    }

    // Approche optimisée : une seule passe avec traitement en parallèle
    const promises = [];
    
    for (let resultIndex = 0; resultIndex < maxResults; resultIndex++) {
      for (let sampleIndex = 0; sampleIndex < maxSamples; sampleIndex++) {
        for (const magnification of magnifications) {
          
          // Créer une promesse pour chaque combinaison
          const promise = fileService.getNodeFiles(
            nodeId,
            { 
              category: 'micrographs',
              subcategory: `result-${resultIndex}-sample-${sampleIndex}-${magnification}`
            }
          ).then(response => {
            if (response.data && response.data.success !== false) {
              const files = response.data.data?.files || response.data.files || [];
              if (files.length > 0) {
                return {
                  category: 'micrographs',
                  subcategory: `result-${resultIndex}-sample-${sampleIndex}-${magnification}`,
                  label: `${tSafe('parts.photos.manager.sections.micrography.result', 'Résultat {{number}}', { number: resultIndex + 1 })} - ${tSafe('parts.photos.manager.sections.micrography.sample', 'Échantillon {{number}}', { number: sampleIndex + 1 })} - ${tSafe(`parts.photos.manager.sections.micrography.magnifications.${magnification}`, magnification)}`,
                  description: tSafe(`parts.photos.manager.sections.micrography.descriptions.${magnification}`, `Micrographies au grossissement ${magnification}`),
                  group: tSafe('parts.photos.manager.sections.micrography.result', 'Résultat {{number}}', { number: resultIndex + 1 }),
                  subgroup: tSafe('parts.photos.manager.sections.micrography.sample', 'Échantillon {{number}}', { number: sampleIndex + 1 }),
                  filesCount: files.length,
                  resultIndex,
                  sampleIndex
                };
              }
            }
            return null;
          }).catch(error => {
            // Ignorer silencieusement les combinaisons qui n'existent pas
            return null;
          });
          
          promises.push(promise);
        }
      }
    }    if (process.env.NODE_ENV === 'development') {
      // Lancement des requêtes en parallèle
    }
    
    // Annuler les requêtes précédentes si elles existent
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Créer un nouveau contrôleur d'annulation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Exécuter les promesses par lots pour éviter de surcharger le serveur
    const batchSize = 10; // Réduit de 20 à 10 pour moins de charge
    const allResults = [];
    
    try {
      for (let i = 0; i < promises.length; i += batchSize) {
        // Vérifier si l'opération a été annulée
        if (signal.aborted) {
          if (process.env.NODE_ENV === 'development') {
            
          }
          return [];
        }
        
        const batch = promises.slice(i, i + batchSize);
        if (process.env.NODE_ENV === 'development') {
          // Traitement en lots pour éviter la surcharge
        }
        
        const batchResults = await Promise.all(batch);
        allResults.push(...batchResults);
        
        // Pause plus longue entre les lots pour réduire la charge
        if (i + batchSize < promises.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Augmenté de 100ms à 200ms
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        if (process.env.NODE_ENV === 'development') {
          
        }
        return [];
      }
      throw error;
    }
    
    // Filtrer les résultats valides et les ajouter aux sources
    const validSources = allResults.filter(result => result !== null);
    sources.push(...validSources);
      if (process.env.NODE_ENV === 'development') {
      // Génération terminée avec succès
    }
    
    // Afficher un résumé des résultats et échantillons trouvés (development only)
    if (process.env.NODE_ENV === 'development' && sources.length > 0) {
      const foundCombinations = new Set(sources.map(s => s.category));
      const combinationsList = Array.from(foundCombinations).sort();
      
      // Statistiques par résultat
      const statsByResult = {};
      sources.forEach(source => {
        const key = `Résultat ${source.resultIndex + 1}`;
        if (!statsByResult[key]) statsByResult[key] = new Set();
        statsByResult[key].add(source.sampleIndex + 1);
      });
      
      Object.keys(statsByResult).forEach(result => {
        const samples = Array.from(statsByResult[result]).sort((a, b) => a - b);
      });
    }
    
    return sources;
  };

  // Générer dynamiquement les sources pour la section controlLocation
  const generateControlLocationSources = async (nodeId, config) => {
    const sources = [];
    const { maxResults = 5, maxSamples = 3 } = config;
    
    const tSafe = (key, fallback, options = {}) => {
      try {
        const translated = t(key, options);
        return translated !== key ? translated : fallback;
      } catch (error) {
        console.warn(`Translation error for key "${key}":`, error);
        return fallback;
      }
    };

    const promises = [];
    
    for (let resultIndex = 0; resultIndex < maxResults; resultIndex++) {
      for (let sampleIndex = 0; sampleIndex < maxSamples; sampleIndex++) {
        const promise = fileService.getNodeFiles(
          nodeId,
          { 
            category: 'control-location',
            subcategory: `result-${resultIndex}-sample-${sampleIndex}`
          }
        ).then(response => {
          if (response.data && response.data.success !== false) {
            const files = response.data.data?.files || response.data.files || [];
            if (files.length > 0) {
              return {
                category: 'control-location',
                subcategory: `result-${resultIndex}-sample-${sampleIndex}`,
                label: tSafe(
                  'parts.photos.manager.sections.controlLocation.sourceLabel',
                  `Résultat ${resultIndex + 1} - Échantillon ${sampleIndex + 1}`,
                  { result: resultIndex + 1, sample: sampleIndex + 1 }
                ),
                description: tSafe(
                  'parts.photos.manager.sections.controlLocation.sourceDescription',
                  `Photos de localisation de contrôle`,
                  { result: resultIndex + 1, sample: sampleIndex + 1 }
                ),
                group: tSafe('parts.photos.manager.sections.controlLocation.resultGroup', `Résultat ${resultIndex + 1}`, { result: resultIndex + 1 }),
                subgroup: tSafe('parts.photos.manager.sections.controlLocation.sampleSubgroup', `Échantillon ${sampleIndex + 1}`, { sample: sampleIndex + 1 }),
                resultIndex,
                sampleIndex
              };
            }
          }
          return null;
        }).catch(error => {
          if (error.name !== 'AbortError') {
            console.error(`Error fetching control location for result ${resultIndex}, sample ${sampleIndex}:`, error);
          }
          return null;
        });
        
        promises.push(promise);
      }
    }

    try {
      const allResults = await Promise.all(promises);
      const validSources = allResults.filter(result => result !== null);
      sources.push(...validSources);
    } catch (error) {
      if (error.name === 'AbortError') {
        return [];
      }
      throw error;
    }
    
    return sources;
  };

  // Charger les photos au montage du composant
  useEffect(() => {
    const sectionConfig = getSectionConfig();
    // Mapper 'control' vers 'controlLocation' pour la configuration
    const configKey = sectionType === 'control' ? 'controlLocation' : sectionType;
    const config = sectionConfig[configKey];
    if (!config) {
      console.error(`Configuration manquante pour la section ${sectionType} (configKey: ${configKey})`);
      return;
    }
    
    let nodeId = config.nodeId;
    if (sectionType === 'identification' && partNodeId) {
      nodeId = partNodeId;
    }
    
    if (!nodeId) {
      console.error(`NodeId manquant pour la section ${sectionType}`);
      setAvailablePhotos({});
      setError(t('parts.photos.manager.idMissing', { type: sectionType === 'identification' ? 'pièce' : 'test' }));
      return;
    }
    
    loadPhotosForSection();
  }, [sectionType, trialNodeId, partNodeId, t]);
  // Initialiser les photos sélectionnées UNIQUEMENT au montage ou si initialSelectedPhotos change vraiment
  const initializationRef = useRef(false);
  
  useEffect(() => {
    // Ne pas réinitialiser si on a déjà initialisé et que les props n'ont pas vraiment changé
    if (initializationRef.current) {
      return;
    }
    
    
    if (initialSelectedPhotos && initialSelectedPhotos[sectionType]) {
      let initSelected = [];
      const initialData = initialSelectedPhotos[sectionType];
      
      // Si c'est déjà un tableau d'IDs
      if (Array.isArray(initialData)) {
        initSelected = initialData.filter(item => {
          // Supporter les IDs simples et les objets avec métadonnées
          return typeof item === 'string' || (item && item.id);
        }).map(item => typeof item === 'string' ? item : item.id);
      }
      // Si c'est un objet avec sous-catégories (structure avec métadonnées)
      else if (typeof initialData === 'object') {
        Object.values(initialData).forEach(subcategoryData => {
          if (Array.isArray(subcategoryData)) {
            subcategoryData.forEach(item => {
              const id = typeof item === 'string' ? item : (item && item.id);
              if (id) {
                initSelected.push(id);
              }
            });
          }
        });
      }
      
      const initOrder = {};
      initSelected.forEach((photoId, index) => {
        initOrder[photoId] = index + 1;
      });
      
      dispatchSelection({ 
        type: 'SET_SELECTION', 
        payload: { selectedIds: initSelected, order: initOrder } 
      });
    } else {
      dispatchSelection({ type: 'RESET' });
    }
    
    initializationRef.current = true;
  }, [sectionType]); // Supprimer initialSelectedPhotos des dépendances
  
  // Réinitialiser le flag d'initialisation si la section change
  useEffect(() => {
    initializationRef.current = false;
  }, [sectionType]);

  // Effect pour notifier les changements
  useEffect(() => {
    if (pendingChange && onChange) {
      onChange(sectionType, pendingChange);
      setPendingChange(null);
    }
  }, [pendingChange, onChange, sectionType]);

  // Charger les photos pour la section
  const loadPhotosForSection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sectionConfig = getSectionConfig();
      // Plus besoin de mapper car 'control' existe maintenant directement dans la config
      const config = sectionConfig[sectionType];
      let nodeId = config?.nodeId;
      if (sectionType === 'identification' && partNodeId) {
        nodeId = partNodeId;
      }
      
      if (!config || !nodeId) {
        setAvailablePhotos({});
        setLoading(false);
        return;
      }
      
      let sources = config.sources;
        // Si c'est une section dynamique (comme micrography ou control), générer les sources
      if (config.isDynamic && sectionType === 'micrography') {
        sources = await generateMicrographySources(nodeId, config);
        if (process.env.NODE_ENV === 'development') {
          
        }
      } else if (config.isDynamic && (sectionType === 'control' || sectionType === 'controlLocation')) {
        sources = await generateControlLocationSources(nodeId, config);
      }

      // Vérifier que sources est toujours valide après annulation potentielle
      if (!sources || !Array.isArray(sources)) {
        console.warn(`Sources non valides après génération dynamique pour ${sectionType}:`, sources);
        setAvailablePhotos({});
        setLoading(false);
        return;
      }
      
      const organizedPhotos = {};
      
      for (const source of sources) {
        try {
          const response = await fileService.getNodeFiles(
            nodeId,
            { category: source.category, subcategory: source.subcategory }
          );
          
          if (response.data && response.data.success !== false) {
            const files = response.data.data?.files || response.data.files || [];
            
            if (files.length > 0) {
              const groupKey = source.group || source.label;
              const subgroupKey = source.subgroup || source.subcategory;
              
              if (!organizedPhotos[groupKey]) {
                organizedPhotos[groupKey] = {};
              }
              
              if (!organizedPhotos[groupKey][subgroupKey]) {
                organizedPhotos[groupKey][subgroupKey] = [];
              }
              
              const enrichedFiles = files.map(file => {
                // Construire l'URL absolue pour l'affichage
                const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
                let absoluteUrl = file.viewPath;
                
                // Si viewPath est relatif, le rendre absolu
                if (absoluteUrl && absoluteUrl.startsWith('/api/')) {
                  absoluteUrl = API_BASE.replace('/api', '') + absoluteUrl;
                } else if (!absoluteUrl) {
                  absoluteUrl = `${API_BASE}/files/${file.id}`;
                }
                
                return {
                  ...file,
                  sourceCategory: source.category,
                  sourceSubcategory: source.subcategory,
                  sourceLabel: source.label,
                  sourceDescription: source.description,
                  groupLabel: source.group || source.label,
                  subgroupLabel: source.subgroup || source.subcategory,
                  viewPath: absoluteUrl,
                  url: absoluteUrl // Ajouter aussi 'url' pour compatibilité PDF
                };
              });
              
              organizedPhotos[groupKey][subgroupKey].push(...enrichedFiles);
            }
          }
        } catch (sourceError) {
          console.error(`Erreur lors du chargement de ${source.category}/${source.subcategory}:`, sourceError);
        }
      }
      
      setAvailablePhotos(organizedPhotos);
      
      // Initialiser la première section comme ouverte
      const firstGroup = Object.keys(organizedPhotos)[0];
      if (firstGroup) {
        setExpandedSections(prev => ({
          ...prev,
          [firstGroup]: true
        }));
      }
      
    } catch (error) {
      console.error(`Erreur lors du chargement des photos pour ${sectionType}:`, error);
      setError(t('parts.photos.loadError') + ' ' + error.message);
      setAvailablePhotos({});
    } finally {
      setLoading(false);
    }
  };

  // Fonction utilitaire pour obtenir toutes les photos dans un format plat
  const getAllPhotosFlat = () => {
    const flatPhotos = [];
    Object.keys(availablePhotos).forEach(group => {
      Object.keys(availablePhotos[group]).forEach(subgroup => {
        flatPhotos.push(...availablePhotos[group][subgroup]);
      });
    });
    return flatPhotos;
  };  // Fonction pour organiser les photos sélectionnées avec leurs métadonnées et numérotation intelligente
  const organizeSelectedPhotosWithMetadata = useCallback((selectedIds, customPhotoOrder = null) => {
    const organized = {};
    const orderToUse = customPhotoOrder || photoOrder;
    
    // Vérifier que les IDs sélectionnés sont cohérents
    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return organized;
    }
    
    // Créer un mapping des photos sélectionnées avec leur ordre
    const orderedSelectedIds = selectedIds
      .filter(id => id != null) // Filtrer les valeurs nulles/undefined
      .map(id => ({ id, order: orderToUse[id] || 999999 }))
      .sort((a, b) => a.order - b.order)
      .map(item => item.id);
    
    // Parcourir toutes les photos disponibles et récupérer les métadonnées des photos sélectionnées
    Object.keys(availablePhotos).forEach(groupKey => {
      Object.keys(availablePhotos[groupKey]).forEach(subgroupKey => {
        const photos = availablePhotos[groupKey][subgroupKey];        
        photos.forEach(photo => {
          if (selectedIds.includes(photo.id)) {
            // Numérotation basée sur l'ordre de sélection, pas sur la position dans la structure
            const photoSectionOrder = orderedSelectedIds.indexOf(photo.id) + 1;
            
            // Créer un objet avec toutes les métadonnées et la numérotation
            const photoWithMetadata = {
              id: photo.id,
              name: photo.name || '',
              category: photo.category || photo.sourceCategory || groupKey,
              subcategory: photo.subcategory || photo.sourceSubcategory || subgroupKey,
              viewPath: photo.viewPath,
              url: photo.url || photo.viewPath, // URL absolue pour le PDF
              original_name: photo.original_name || photo.name,
              description: photo.description,
              sectionOrder: photoSectionOrder, // Numérotation indépendante pour cette section
              globalOrder: orderToUse[photo.id] || photoSectionOrder, // Ordre global de sélection
              // Ajouter d'autres métadonnées si nécessaires
              originalData: photo
            };
            
            // Pour la section curves, organiser par sous-catégorie réelle
            if (sectionType === 'curves') {
              const realSubcategory = photo.sourceSubcategory || photo.subcategory || subgroupKey;
              
              // Mapper vers nos catégories attendues
              let targetCategory = realSubcategory;
              if (!['heating', 'cooling', 'tempering', 'datapaq', 'alarms'].includes(realSubcategory)) {
                // Si la sous-catégorie n'est pas reconnue, essayer de deviner par le nom
                const photoName = photo.name?.toLowerCase() || '';
                if (photoName.includes('heat') || photoName.includes('chauff') || photoName.includes('montee')) {
                  targetCategory = 'heating';
                } else if (photoName.includes('cool') || photoName.includes('refroid') || photoName.includes('descent')) {
                  targetCategory = 'cooling';
                } else if (photoName.includes('temper') || photoName.includes('revenu')) {
                  targetCategory = 'tempering';
                } else if (photoName.includes('datapaq') || photoName.includes('sensor') || photoName.includes('capteur')) {
                  targetCategory = 'datapaq';
                } else if (photoName.includes('alarm') || photoName.includes('alert') || photoName.includes('erreur')) {
                  targetCategory = 'alarms';
                } else {
                  // Fallback : mettre dans heating par défaut
                  console.warn(`Photo ${photo.id} avec sous-catégorie inconnue "${realSubcategory}" - placée dans heating`);
                  targetCategory = 'heating';
                }
              }
              
              if (!organized[targetCategory]) {
                organized[targetCategory] = [];
              }
              organized[targetCategory].push(photoWithMetadata);
            } else {
              // Pour les autres sections, organiser par catégorie ou garder une liste plate
              const categoryKey = photo.category || photo.sourceCategory || groupKey;
              if (!organized[categoryKey]) {
                organized[categoryKey] = [];
              }
              organized[categoryKey].push(photoWithMetadata);
            }
          }
        });
      });
    });
    
    return organized;
  }, [availablePhotos, sectionType]);



  // Basculer la sélection d'une photo
  const togglePhotoSelection = useCallback((photoId) => {
    // Utiliser le reducer pour la mise à jour d'état synchrone
    dispatchSelection({ type: 'TOGGLE_PHOTO', payload: { photoId } });
  }, [dispatchSelection]);

  // Effet pour synchroniser les changements avec le parent (seulement quand forceUpdate change)
  useEffect(() => {
    if (forceUpdate > 0 && Object.keys(availablePhotos).length > 0) {
      const organizedPhotos = organizeSelectedPhotosWithMetadata(selectedPhotoIds, photoOrder);
      setPendingChange(organizedPhotos);
    }
  }, [forceUpdate, selectedPhotoIds, photoOrder, availablePhotos, organizeSelectedPhotosWithMetadata]);

  // Sélectionner/désélectionner un groupe
  const toggleGroupSelection = (group, subgroup = null, select = true) => {
    const photosToToggle = subgroup 
      ? availablePhotos[group][subgroup] || []
      : Object.keys(availablePhotos[group] || {}).reduce((acc, sg) => {
          acc.push(...(availablePhotos[group][sg] || []));
          return acc;
        }, []);
    
    const photoIds = photosToToggle.map(photo => photo.id);
    
    dispatchSelection({ 
      type: 'TOGGLE_GROUP', 
      payload: { photoIds, select } 
    });
  };

  // Sélectionner/désélectionner toutes les photos
  const toggleAllPhotos = (select) => {
    const allPhotos = getAllPhotosFlat();
    const allPhotoIds = allPhotos.map(photo => photo.id);
    
    dispatchSelection({ 
      type: 'TOGGLE_GROUP', 
      payload: { photoIds: allPhotoIds, select } 
    });
  };

  // Gérer l'ouverture/fermeture des sections
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  // Affichage du chargement
  if (loading) {
    return (
      <div className="text-center p-3">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const sectionConfig = getSectionConfig();
  const config = sectionConfig[sectionType];
  const nodeTypeText = sectionType === 'identification' ? 'pièce' : 'test';
  const nodeId = config?.nodeId;
  const allPhotosFlat = getAllPhotosFlat();

  // Aucune photo disponible
  if (!loading && allPhotosFlat.length === 0 && nodeId) {
    return (
      <Alert variant="info">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faImage} size="2x" className="me-3" />
          <div>
            <h6 className="mb-0">{t('parts.photos.manager.noPhotosAvailable')}</h6>
            <p className="mb-1 mt-1">
              {t('parts.photos.manager.noPhotosMessage')}
              {sectionType === 'identification' ? 
                ` ${t('parts.photos.manager.verifyPhotosMessage')}` :
                ` ${t('parts.photos.manager.verifyFilesMessage')}`
              }
            </p>
            <div>
              <span className="text-muted small">ID {nodeTypeText}: {nodeId}</span>
              <Button 
                size="sm" 
                variant="outline-primary" 
                className="ms-2"
                onClick={loadPhotosForSection}
              >
                {t('parts.photos.manager.refresh')}
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    );
  }

  // Configuration manquante
  if (!nodeId) {
    return (
      <Alert variant="warning">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="me-3" />
          <div>
            <h6 className="mb-0">{t('parts.photos.manager.configurationMissing')}</h6>
            <p className="mb-0 mt-1">
              {t('parts.photos.manager.idMissing', { type: nodeTypeText })}
            </p>
          </div>
        </div>
      </Alert>
    );
  }
  // Calculer les statistiques de sélection pour la section entière
  const totalPhotosInSection = allPhotosFlat.length;
  const selectedPhotosInSection = selectedPhotoIds.length;  return (
    <CollapsibleSection
      title={`${config.title || t('parts.photos.manager.title')} (${selectedPhotosInSection}/${totalPhotosInSection})`}
      isExpandedByDefault={false}
      level={0}
      className="section-photo-manager mb-3"
      sectionId={`photo-manager-${sectionType}`}
      rememberState={true}
    >      {/* En-tête avec contrôles globaux */}
      <div className="d-flex justify-content-end align-items-center mb-3">
        <div>
          <Button 
            size="sm" 
            variant="outline-primary" 
            className="me-1" 
            onClick={() => toggleAllPhotos(true)}
          >
            {t('parts.photos.manager.selectAll')}
          </Button>
          <Button 
            size="sm" 
            variant="outline-secondary" 
            onClick={() => toggleAllPhotos(false)}
          >
            {t('parts.photos.manager.deselectAll')}
          </Button>        </div>
      </div>

      {/* Message de sélection */}{selectedPhotoIds.length > 0 && (
        <div className="mb-3 p-2 bg-success bg-opacity-10 border border-success rounded">
          <small className="text-success">
            {t('parts.photos.manager.selectionMessage', { count: selectedPhotoIds.length })}
          </small>
        </div>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <Alert variant="danger" className="mb-3">{error}</Alert>
      )}

      {/* Sections collapsibles pour chaque groupe/sous-groupe */}
      {Object.keys(availablePhotos).map((groupKey) => {
        const group = availablePhotos[groupKey];
        
        return (
          <div key={groupKey} className="mb-3">
            {/* Si le groupe a plusieurs sous-groupes, les afficher séparément */}
            {Object.keys(group).length > 1 ? (
              // Groupe principal avec sous-groupes
              <CollapsibleSection
                title={groupKey}
                isExpandedByDefault={false}
                onToggle={(isExpanded) => toggleSection(groupKey)}
                level={1}
                className="mb-2"
                sectionId={`group-${sectionType}-${groupKey}`}
                rememberState={true}
              >
                {Object.keys(group).map((subgroupKey) => {
                  const subgroupPhotos = group[subgroupKey];
                  if (subgroupPhotos.length === 0) return null;
                  
                  const subgroupSelectedCount = subgroupPhotos.filter(photo => selectedPhotoIds.includes(photo.id)).length;
                    return (
                    <CollapsibleSection
                      key={`${groupKey}-${subgroupKey}`}
                      title={`${subgroupKey} (${subgroupSelectedCount}/${subgroupPhotos.length})`}
                      isExpandedByDefault={false}
                      level={2}
                      className="mb-2"
                      sectionId={`subgroup-${sectionType}-${groupKey}-${subgroupKey}`}
                      rememberState={true}
                    >
                      <div className="mb-2">
                        <Button 
                          size="sm" 
                          variant="outline-success" 
                          className="me-2"
                          onClick={() => toggleGroupSelection(groupKey, subgroupKey, true)}
                        >
                          {t('parts.photos.manager.selectAll')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => toggleGroupSelection(groupKey, subgroupKey, false)}
                        >
                          {t('parts.photos.manager.deselectAll')}
                        </Button>
                      </div>
                      
                      <PhotoGrid 
                        key={`${groupKey}-${subgroupKey}-${forceUpdate}`}
                        photos={subgroupPhotos} 
                        selectedPhotoIds={selectedPhotoIds}
                        photoOrder={photoOrder}
                        onToggleSelection={togglePhotoSelection}
                        t={t}
                      />
                    </CollapsibleSection>
                  );
                })}
              </CollapsibleSection>
            ) : (
              // Groupe simple sans sous-groupes
              (() => {
                const subgroupKey = Object.keys(group)[0];
                const subgroupPhotos = group[subgroupKey];
                if (subgroupPhotos.length === 0) return null;
                
                const subgroupSelectedCount = subgroupPhotos.filter(photo => selectedPhotoIds.includes(photo.id)).length;                  return (
                    <CollapsibleSection
                      key={groupKey}
                      title={`${groupKey} (${subgroupSelectedCount}/${subgroupPhotos.length})`}
                      isExpandedByDefault={false}
                      onToggle={(isExpanded) => toggleSection(groupKey)}
                      level={1}
                      className="mb-2"
                      sectionId={`simple-group-${sectionType}-${groupKey}`}
                      rememberState={true}
                    >
                      <div className="mb-2">
                        <Button 
                          size="sm" 
                          variant="outline-success" 
                          className="me-2"
                          onClick={() => toggleGroupSelection(groupKey, subgroupKey, true)}
                        >
                          {t('parts.photos.manager.selectAll')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline-secondary"
                          onClick={() => toggleGroupSelection(groupKey, subgroupKey, false)}
                        >
                          {t('parts.photos.manager.deselectAll')}
                        </Button>
                      </div>
                    
                    <PhotoGrid 
                      key={`${groupKey}-${subgroupKey}-${forceUpdate}`}
                      photos={subgroupPhotos} 
                      selectedPhotoIds={selectedPhotoIds}
                      photoOrder={photoOrder}
                      onToggleSelection={togglePhotoSelection}
                      t={t}
                    />
                  </CollapsibleSection>
                );
              })()
            )}
          </div>
        );
      })}
    </CollapsibleSection>
  );
};

// Composant pour la grille de photos
const PhotoGrid = React.memo(({ photos, selectedPhotoIds, photoOrder, onToggleSelection, t }) => {
  return (
    <Row className="g-2">
      {photos
        .sort((a, b) => {
          // Trier par ordre de sélection, puis par nom
          const aOrder = photoOrder[a.id] || 999999;
          const bOrder = photoOrder[b.id] || 999999;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return a.name.localeCompare(b.name);
        })
        .map((photo) => (
        <Col key={photo.id} xs={6} sm={4} md={3} lg={2}>
          <Card 
            className={`photo-card h-100 ${selectedPhotoIds.includes(photo.id) ? 'border-primary border-2 shadow' : 'border-light'}`}
            onClick={() => {
              onToggleSelection(photo.id);
            }}
            style={{ 
              cursor: 'pointer',
              opacity: selectedPhotoIds.includes(photo.id) ? 1 : 0.8,
              transform: selectedPhotoIds.includes(photo.id) ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s ease',
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (!selectedPhotoIds.includes(photo.id)) {
                e.currentTarget.style.opacity = '0.95';
                e.currentTarget.style.transform = 'scale(1.01)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedPhotoIds.includes(photo.id)) {
                e.currentTarget.style.opacity = '0.8';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '';
              }
            }}
          >
            <div style={{ position: 'relative' }}>
              {/* Overlay de sélection */}
              {selectedPhotoIds.includes(photo.id) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.15) 0%, rgba(13, 110, 253, 0.08) 100%)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }} />
              )}
              
              <Card.Img 
                variant="top" 
                src={photo.viewPath || fileService.getFilePreviewUrl(photo.id)} 
                style={{ 
                  height: '140px', // Image plus grande (était 120px)
                  objectFit: 'cover', 
                  background: '#f8f9fa'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM2Yzc1N2QiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub24gZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';
                }}
              />
              
              {/* Indicateur de sélection */}
              <div style={{ 
                position: 'absolute', 
                top: '8px', 
                right: '8px',
                background: selectedPhotoIds.includes(photo.id) ? '#0d6efd' : 'rgba(255,255,255,0.9)',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: selectedPhotoIds.includes(photo.id) ? '2px solid white' : '2px solid #dee2e6',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 2,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(photo.id);
              }}>                {selectedPhotoIds.includes(photo.id) ? (
                  <span style={{ color: 'white' }}>
                    {photoOrder[photo.id]}
                  </span>                ) : (
                  <span style={{ color: '#999', fontSize: '16px', fontWeight: 'bold' }}>+</span>
                )}
              </div>
            </div>
            
            <Card.Body className="p-2">
              <div className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <Card.Text className="mb-0 small fw-medium text-truncate">
                    {photo.description || photo.name}
                  </Card.Text>
                </div>
                {selectedPhotoIds.includes(photo.id) && (
                  <Badge 
                    bg="primary" 
                    className="ms-1" 
                    style={{ fontSize: '9px' }}
                  >
                    #{photoOrder[photo.id]}
                  </Badge>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>      ))}
    </Row>
  );
}, (prevProps, nextProps) => {
  // Comparer les props importantes pour éviter les re-renders inutiles
  const photosEqual = prevProps.photos.length === nextProps.photos.length &&
    prevProps.photos.every((photo, index) => photo.id === nextProps.photos[index].id);
  
  const selectedEqual = prevProps.selectedPhotoIds.length === nextProps.selectedPhotoIds.length &&
    prevProps.selectedPhotoIds.every(id => nextProps.selectedPhotoIds.includes(id));
  
  const orderEqual = Object.keys(prevProps.photoOrder).length === Object.keys(nextProps.photoOrder).length &&
    Object.keys(prevProps.photoOrder).every(id => prevProps.photoOrder[id] === nextProps.photoOrder[id]);
  
  const shouldSkipRender = photosEqual && selectedEqual && orderEqual && 
    prevProps.onToggleSelection === nextProps.onToggleSelection;
  return shouldSkipRender;
});

export default SectionPhotoManager;