import { useState, useCallback, useRef, useEffect } from 'react';
import fileService from '../services/fileService';

/**
 * Hook unifié pour la gestion des fichiers avec MULTI-VUES
 * Utilisé pour les sections avec plusieurs sous-catégories (ex: Micrographs, FurnaceReport, Photos)
 * 
 * Résout les problèmes de :
 * - Accumulation des tempIds par vue
 * - Gestion correcte des opérations (add, delete, update)
 * - Association des fichiers par sous-catégorie
 * 
 * @param {Object} options - Options de configuration
 * @param {string|number} options.nodeId - ID du node parent
 * @param {string} options.category - Catégorie des fichiers
 * @param {Array} options.views - Liste des vues [{id: 'x50', name: 'Zoom x50'}, ...]
 * @param {Function} options.buildSubcategory - Fonction pour construire la subcategory (viewId) => subcategory
 * @param {Function} options.onError - Callback d'erreur (optionnel)
 * @returns {Object} État et fonctions de gestion des fichiers
 */
const useMultiViewFileSectionState = (options = {}) => {
  const {
    nodeId,
    category,
    views = [],
    buildSubcategory = (viewId) => viewId, // Par défaut, viewId = subcategory
    sampleNumber,   // Numéro d'échantillon pour filtrage backend
    resultIndex,    // Index du résultat pour filtrage backend
    onError = console.error
  } = options;

  // État des fichiers uploadés par vue
  const [uploadedFilesByView, setUploadedFilesByView] = useState({});
  
  // État des fichiers en attente par vue (mode standby)
  const [pendingFilesByView, setPendingFilesByView] = useState({});
  
  // IMPORTANT: Objet de tableaux de tempIds pour supporter les uploads multiples par vue
  // Structure: { viewId: [tempId1, tempId2, ...], ... }
  const [tempIdsByView, setTempIdsByView] = useState({});
  
  // Référence pour accéder aux tempIds les plus récents dans les callbacks
  const tempIdsByViewRef = useRef({});
  
  // Références pour les fonctions d'upload par vue (mode standby)
  const uploaderRefs = useRef({});
  
  // Références pour éviter les boucles infinies dans les useCallback
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  
  // Référence pour éviter les appels multiples simultanés
  const isLoadingRef = useRef(false);

  // Synchroniser la référence avec l'état
  useEffect(() => {
    tempIdsByViewRef.current = tempIdsByView;
  }, [tempIdsByView]);

  /**
   * Charge les fichiers existants depuis le serveur
   */
  const loadExistingFiles = useCallback(async () => {
    if (!nodeId) return;

    // Guard pour éviter les appels multiples simultanés
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;

    try {
      // Construire un pattern de subcategory pour récupérer tous les fichiers
      // de ce result/sample peu importe la vue (x50, x500, etc.)
      // IMPORTANT: Les fichiers en base utilisent des index base-1, pas base-0
      // Exemple: "result-1-sample-1-%" pour récupérer result-1-sample-1-x50, result-1-sample-1-x500, etc.
      let subcategoryPattern = null;
      if (resultIndex !== undefined && sampleNumber !== undefined) {
        subcategoryPattern = `result-${resultIndex + 1}-sample-${sampleNumber + 1}-%`;
      }
      
      const response = await fileService.getNodeFiles(nodeId, {
        category,
        subcategory: subcategoryPattern
      });
      
      if (!response.data || response.data.success === false) {
        onErrorRef.current('Erreur lors du chargement des fichiers:', response.data?.message);
        return;
      }
      
      const files = response.data.data?.files || [];
      
      // console.log(`[useMultiViewFileSectionState] Fichiers reçus:`, {
      //   count: files.length,
      //   category,
      //   sampleNumber,
      //   resultIndex,
      //   files: files.map(f => ({ id: f.id, name: f.name, subcategory: f.subcategory }))
      // });
      
      // Organiser les fichiers par vue/subcategory
      const filesByView = {};
      
      files.forEach(file => {
        // Essayer de trouver la vue correspondante à la subcategory
        const matchingView = views.find(view => {
          const expectedSubcategory = buildSubcategory(view.id);
          
          // 1. Correspondance exacte (Priorité haute)
          if (file.subcategory === expectedSubcategory) return true;
          
          // 2. Correspondance Legacy (Juste l'ID de la vue)
          if (file.subcategory === view.id) return true;
          
          // 3. Correspondance par suffixe - AVEC PROTECTION contre les interférences entre samples
          if (file.subcategory && file.subcategory.endsWith(`-${view.id}`)) {
             // Si la sous-catégorie contient des infos de structure dynamiques (result-X-sample-Y)
             // on doit s'assurer qu'elle correspond bien à l'échantillon courant
             if (file.subcategory.includes('result-') && file.subcategory.includes('-sample-')) {
               // Si on a les infos de contexte courantes, on vérifie qu'elles correspondent
               // IMPORTANT: Les fichiers en base utilisent base-1, donc +1
               if (resultIndex !== undefined && sampleNumber !== undefined) {
                 const currentContextPrefix = `result-${resultIndex + 1}-sample-${sampleNumber + 1}`;
                 return file.subcategory.includes(currentContextPrefix);
               }
             }
             // Si c'est un fichier legacy sans structure complexe, on accepte le suffixe
             return true;
          }
          
          return false;
        });
        
        const viewId = matchingView ? matchingView.id : (file.subcategory || 'other');
        
        // console.log(`[useMultiViewFileSectionState] Matching pour fichier:`, {
        //   fileName: file.name,
        //   fileSubcategory: file.subcategory,
        //   matchingViewId: matchingView?.id,
        //   finalViewId: viewId,
        //   expectedSubcategories: views.map(v => ({ viewId: v.id, expected: buildSubcategory(v.id) }))
        // });
        
        if (!filesByView[viewId]) {
          filesByView[viewId] = [];
        }
        filesByView[viewId].push(file);
      });
      
      // console.log(`[useMultiViewFileSectionState] Fichiers organisés par vue:`, {
      //   filesByView: Object.keys(filesByView).map(viewId => ({
      //     viewId,
      //     count: filesByView[viewId].length,
      //     files: filesByView[viewId].map(f => f.name)
      //   }))
      // });
      
      setUploadedFilesByView(filesByView);
    } catch (error) {
      onErrorRef.current('Erreur lors du chargement des fichiers:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [nodeId, category, views, buildSubcategory, sampleNumber, resultIndex]);

  /**
   * Crée un handler spécifique pour une vue
   * 
   * @param {string} viewId - Identifiant de la vue
   * @returns {Function} Handler pour cette vue
   */
  const createHandleFilesUploaded = useCallback((viewId) => {
    return (files, newTempId, operation = 'add', fileId = null) => {
      switch (operation) {
        case 'delete':
          setUploadedFilesByView(prev => ({
            ...prev,
            [viewId]: (prev[viewId] || []).filter(f => f.id !== fileId)
          }));
          break;
          
        case 'update':
          // Mettre à jour le fichier modifié (ex: changement de description)
          setUploadedFilesByView(prev => ({
            ...prev,
            [viewId]: (prev[viewId] || []).map(f => {
              if (f.id === fileId) {
                const updatedFile = files.find(newF => newF.id === fileId);
                return updatedFile ? { ...f, ...updatedFile } : f;
              }
              return f;
            })
          }));
          break;
          
        case 'standby':
          // En mode standby, accumuler les fichiers en attente pour cette vue
          setPendingFilesByView(prev => ({
            ...prev,
            [viewId]: [...(prev[viewId] || []), ...files]
          }));
          break;
          
        default: // 'add'
          // Ajouter les nouveaux fichiers à la vue
          setUploadedFilesByView(prev => ({
            ...prev,
            [viewId]: [...(prev[viewId] || []), ...files]
          }));
          
          // IMPORTANT: Accumuler les tempIds pour cette vue
          if (newTempId) {
            setTempIdsByView(prev => ({
              ...prev,
              [viewId]: [...(prev[viewId] || []), newTempId]
            }));
          }
          break;
      }
    };
  }, []);

  /**
   * Associe tous les fichiers temporaires de toutes les vues au node spécifié
   * 
   * @param {string|number} targetNodeId - ID du node cible
   * @returns {Promise<boolean>} Succès de l'opération
   */
  const associateFiles = useCallback(async (targetNodeId) => {
    try {
      const currentTempIdsByView = tempIdsByViewRef.current;
      const viewIds = Object.keys(currentTempIdsByView);
      
      if (viewIds.length === 0) {
        // Aucun fichier à associer
        return true;
      }
      
      let allSuccessful = true;
      
      // Associer chaque vue
      for (const viewId of viewIds) {
        const tempIdsForView = currentTempIdsByView[viewId] || [];
        
        // Associer chaque lot de fichiers pour cette vue
        for (const tempId of tempIdsForView) {
          const subcategory = buildSubcategory(viewId);

          const response = await fileService.associateFiles(targetNodeId, tempId, {
            category,
            subcategory,
            sampleNumber,
            resultIndex
          });
          
          if (!response.data || response.data.success === false) {
            onErrorRef.current(`Erreur lors de l'association des fichiers (${viewId}):`, response.data?.message);
            allSuccessful = false;
          }
        }
      }
      
      if (allSuccessful) {
        // Réinitialiser les tempIds après association réussie
        setTempIdsByView({});
        
        // Recharger les fichiers si on reste sur le même node
        if (targetNodeId === nodeId) {
          await loadExistingFiles();
        }
      }
      
      return allSuccessful;
    } catch (error) {
      onErrorRef.current('Erreur lors de l\'association des fichiers:', error);
      return false;
    }
  }, [nodeId, category, buildSubcategory, loadExistingFiles, sampleNumber, resultIndex]);

  /**
   * Crée un handler pour enregistrer les fonctions d'upload d'une vue
   * 
   * @param {string} viewId - Identifiant de la vue
   * @returns {Function} Handler pour enregistrer les fonctions
   */
  const createHandleUploaderReady = useCallback((viewId) => {
    return (uploadPendingFiles, getPendingFiles) => {
      uploaderRefs.current[viewId] = { uploadPendingFiles, getPendingFiles };
    };
  }, []);

  /**
   * Récupère les fichiers uploadés pour une vue
   * 
   * @param {string} viewId - Identifiant de la vue
   * @returns {Array} Fichiers de cette vue
   */
  const getFilesForView = useCallback((viewId) => {
    const files = uploadedFilesByView[viewId] || [];
    // console.log(`[getFilesForView] ViewId: ${viewId}`, {
    //   filesCount: files.length,
    //   uploadedFilesByView: Object.keys(uploadedFilesByView),
    //   files: files.map(f => f.name)
    // });
    return files;
  }, [uploadedFilesByView]);

  /**
   * Récupère les fichiers en attente pour une vue
   * 
   * @param {string} viewId - Identifiant de la vue
   * @returns {Array} Fichiers en attente de cette vue
   */
  const getPendingFilesForView = useCallback((viewId) => {
    return pendingFilesByView[viewId] || [];
  }, [pendingFilesByView]);

  /**
   * Vérifie s'il y a des fichiers à associer
   */
  const hasFilesToAssociate = useCallback(() => {
    const hasTemps = Object.values(tempIdsByViewRef.current).some(ids => ids && ids.length > 0);
    const hasPending = Object.values(pendingFilesByView).some(files => files && files.length > 0);
    return hasTemps || hasPending;
  }, [pendingFilesByView]);

  /**
   * Réinitialise l'état complet
   */
  const reset = useCallback(() => {
    setUploadedFilesByView({});
    setPendingFilesByView({});
    setTempIdsByView({});
    tempIdsByViewRef.current = {};
  }, []);

  return {
    // État
    uploadedFilesByView,
    pendingFilesByView,
    tempIdsByView,
    
    // Handlers factory
    createHandleFilesUploaded,
    createHandleUploaderReady,
    
    // Accesseurs
    getFilesForView,
    getPendingFilesForView,
    
    // Actions
    loadExistingFiles,
    associateFiles,
    hasFilesToAssociate,
    reset,
    
    // Références
    uploaderRefs
  };
};

export default useMultiViewFileSectionState;
