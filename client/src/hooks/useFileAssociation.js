import { useCallback } from 'react';

/**
 * Hook pour gérer l'association des fichiers en mode standby
 * après la création d'une entité
 */
const useFileAssociation = () => {
  
  /**
   * Crée une fonction d'association pour une section de fichiers
   * @param {Function} uploadPendingFiles - Fonction d'upload des fichiers en attente
   * @param {Function} getPendingFiles - Fonction pour récupérer les fichiers en attente
   * @param {string} category - Catégorie des fichiers
   * @param {string} subcategory - Sous-catégorie des fichiers
   * @returns {Function} Fonction d'association
   */  const createAssociationFunction = useCallback((uploadPendingFiles, getPendingFiles, category, subcategory) => {
    return async (nodeId) => {
      const pendingFiles = getPendingFiles();
      
      
      if (pendingFiles.length === 0) {
        
        return { success: true, files: [] };
      }

      
      
      try {
        const result = await uploadPendingFiles(nodeId, category, subcategory, pendingFiles);
        
        if (result.success) {
        } else {
          console.error(`❌ Erreur lors de l'association des fichiers ${category}/${subcategory}:`, result.error);
        }
        
        return result;
      } catch (error) {
        console.error(`❌ Erreur lors de l'association des fichiers ${category}/${subcategory}:`, error);
        return { success: false, error: error.message };
      }
    };
  }, []);

  /**
   * Combine plusieurs fonctions d'association en une seule
   * @param {Array} associationFunctions - Tableau des fonctions d'association
   * @returns {Function} Fonction d'association combinée
   */
  const combineAssociationFunctions = useCallback((associationFunctions) => {
    return async (nodeId) => {
      const results = [];
      
      // Exécuter toutes les associations en parallèle
      const promises = associationFunctions.map(fn => fn(nodeId));
      const associationResults = await Promise.allSettled(promises);
      
      // Traiter les résultats
      for (let i = 0; i < associationResults.length; i++) {
        const result = associationResults[i];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`❌ Échec de l'association ${i + 1}:`, result.reason);
          results.push({ success: false, error: result.reason?.message || 'Erreur inconnue' });
        }
      }
      
      // Calculer le résumé
      const totalFiles = results.reduce((sum, r) => sum + (r.files?.length || 0), 0);
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      return {
        success: failureCount === 0,
        totalFiles,
        successCount,
        failureCount,
        results
      };
    };
  }, []);

  return {
    createAssociationFunction,
    combineAssociationFunctions
  };
};

export default useFileAssociation;
