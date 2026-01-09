import { useState, useCallback, useRef, useEffect } from 'react';
import fileService from '../services/fileService';

/**
 * Hook unifié pour la gestion des fichiers dans les sections de formulaire
 * Résout les problèmes de :
 * - Accumulation des tempIds (uploads multiples)
 * - Gestion correcte des opérations (add, delete, update)
 * - Association des fichiers au node parent
 * 
 * @param {Object} options - Options de configuration
 * @param {string|number} options.nodeId - ID du node parent
 * @param {string} options.category - Catégorie des fichiers
 * @param {string} options.subcategory - Sous-catégorie des fichiers (optionnel)
 * @param {Function} options.onError - Callback d'erreur (optionnel)
 * @returns {Object} État et fonctions de gestion des fichiers
 */
const useFileSectionState = (options = {}) => {
  const { 
    nodeId, 
    category, 
    subcategory = null,
    onError = console.error 
  } = options;

  // État des fichiers uploadés
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  // État des fichiers en attente (mode standby)
  const [pendingFiles, setPendingFiles] = useState([]);
  
  // IMPORTANT: Tableau de tempIds pour supporter les uploads multiples
  const [tempIds, setTempIds] = useState([]);
  
  // Référence pour accéder aux tempIds les plus récents dans les callbacks
  const tempIdsRef = useRef([]);
  
  // Référence pour les fonctions d'upload (mode standby)
  const uploaderRef = useRef(null);
  
  // Référence pour stocker onError sans déclencher de re-renders
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  
  // Référence pour éviter les doubles appels
  const isLoadingRef = useRef(false);

  // Synchroniser la référence avec l'état
  useEffect(() => {
    tempIdsRef.current = tempIds;
  }, [tempIds]);

  /**
   * Charge les fichiers existants depuis le serveur
   * Note: Cette fonction est stable et ne change pas entre les renders
   */
  const loadExistingFiles = useCallback(async () => {
    if (!nodeId || isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    
    try {
      const params = { category };
      if (subcategory) {
        params.subcategory = subcategory;
      }
      
      const response = await fileService.getNodeFiles(nodeId, params);
      
      if (!response.data || response.data.success === false) {
        onErrorRef.current('Erreur lors du chargement des fichiers:', response.data?.message);
        return;
      }
      
      const files = response.data.data?.files || [];
      setUploadedFiles(files);
    } catch (error) {
      onErrorRef.current('Erreur lors du chargement des fichiers:', error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [nodeId, category, subcategory]); // onError retiré des dépendances

  /**
   * Handler unifié pour les événements de fichiers
   * Gère correctement les opérations: add, delete, update, standby
   * 
   * @param {Array} files - Fichiers concernés
   * @param {string} newTempId - ID temporaire pour l'association future
   * @param {string} operation - Type d'opération (add, delete, update, standby)
   * @param {string|number} fileId - ID du fichier (pour delete/update)
   */
  const handleFilesUploaded = useCallback((files, newTempId, operation = 'add', fileId = null) => {
    switch (operation) {
      case 'delete':
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
        break;
        
      case 'update':
        // Mettre à jour le fichier modifié (ex: changement de description)
        setUploadedFiles(prev => prev.map(f => {
          if (f.id === fileId) {
            // Trouver le fichier mis à jour dans les nouveaux fichiers
            const updatedFile = files.find(newF => newF.id === fileId);
            return updatedFile ? { ...f, ...updatedFile } : f;
          }
          return f;
        }));
        break;
        
      case 'standby':
        // En mode standby, accumuler les fichiers en attente
        setPendingFiles(prev => [...prev, ...files]);
        break;
        
      default: // 'add'
        // Ajouter les nouveaux fichiers
        setUploadedFiles(prev => [...prev, ...files]);
        
        // IMPORTANT: Accumuler les tempIds, ne pas écraser
        if (newTempId) {
          setTempIds(prev => [...prev, newTempId]);
        }
        break;
    }
  }, []);

  /**
   * Associe tous les fichiers temporaires au node spécifié
   * Gère l'accumulation de plusieurs tempIds
   * 
   * @param {string|number} targetNodeId - ID du node cible
   * @returns {Promise<boolean>} Succès de l'opération
   */
  const associateFiles = useCallback(async (targetNodeId) => {
    try {
      const currentTempIds = tempIdsRef.current;
      
      if (!currentTempIds || currentTempIds.length === 0) {
        // Aucun fichier à associer
        return true;
      }
      
      let allSuccessful = true;
      
      // Associer chaque lot de fichiers (chaque tempId)
      for (const tempId of currentTempIds) {
        const params = { category };
        if (subcategory) {
          params.subcategory = subcategory;
        }
        
        const response = await fileService.associateFiles(targetNodeId, tempId, params);
        
        if (!response.data || response.data.success === false) {
          onErrorRef.current('Erreur lors de l\'association des fichiers:', response.data?.message);
          allSuccessful = false;
        }
      }
      
      if (allSuccessful) {
        // Réinitialiser les tempIds après association réussie
        setTempIds([]);
        
        // Recharger les fichiers si on reste sur le même node
        if (targetNodeId === nodeId) {
          // Utiliser un setTimeout pour éviter les problèmes de timing
          setTimeout(() => loadExistingFiles(), 100);
        }
      }
      
      return allSuccessful;
    } catch (error) {
      onErrorRef.current('Erreur lors de l\'association des fichiers:', error);
      return false;
    }
  }, [nodeId, category, subcategory, loadExistingFiles]); // onError retiré des dépendances

  /**
   * Enregistre les références aux fonctions d'upload (pour mode standby)
   */
  const handleUploaderReady = useCallback((uploadPendingFiles, getPendingFiles) => {
    uploaderRef.current = { uploadPendingFiles, getPendingFiles };
  }, []);

  /**
   * Récupère les fichiers en attente
   */
  const getPendingFiles = useCallback(() => {
    return pendingFiles;
  }, [pendingFiles]);

  /**
   * Vérifie s'il y a des fichiers à associer
   */
  const hasFilesToAssociate = useCallback(() => {
    return tempIdsRef.current.length > 0 || pendingFiles.length > 0;
  }, [pendingFiles]);

  /**
   * Réinitialise l'état complet
   */
  const reset = useCallback(() => {
    setUploadedFiles([]);
    setPendingFiles([]);
    setTempIds([]);
    tempIdsRef.current = [];
  }, []);

  return {
    // État
    uploadedFiles,
    pendingFiles,
    tempIds,
    
    // Handlers
    handleFilesUploaded,
    handleUploaderReady,
    
    // Actions
    loadExistingFiles,
    associateFiles,
    getPendingFiles,
    hasFilesToAssociate,
    reset,
    
    // Référence pour accès externe si nécessaire
    uploaderRef
  };
};

export default useFileSectionState;
