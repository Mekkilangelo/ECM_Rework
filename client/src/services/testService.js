import api from './api';

// Cache simple pour les spécifications
const specsCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Debouncing pour les requêtes fréquentes
const pendingRequests = new Map();

/**
 * Service de gestion des tests
 * Fournit des méthodes pour interagir avec l'API REST pour les opérations CRUD sur les tests
 */
const testService = {/**
   * Récupère la liste des tests avec pagination et recherche
   * @param {string|number} parent_id - Identifiant de la pièce associée (optionnel)
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @param {string} sortBy - Champ de tri
   * @param {string} sortOrder - Ordre de tri (asc/desc)
   * @param {string} search - Terme de recherche optionnel
   * @returns {Promise<Object>} Données des tests et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  getTests: async (parent_id, page = 1, limit = 10, sortBy = 'modified_at', sortOrder = 'desc', search = '') => {
    try {
      const offset = (page - 1) * limit;
      const params = { 
        parent_id, 
        offset, 
        limit, 
        sortBy, 
        sortOrder 
      };
      
      // Ajouter le paramètre de recherche s'il est fourni
      if (search && search.trim()) {
        params.search = search.trim();
      }
      
      const response = await api.get('/tests', { params });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return {
          tests: response.data.data,
          pagination: response.data.pagination
        };
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tests:', error);
      throw error;
    }
  },
    /**
   * Récupère un test par son identifiant
   * @param {string|number} id - L'identifiant du test
   * @returns {Promise<Object>} Les données du test
   * @throws {Error} En cas d'échec de la requête
   */
  getTest: async (id) => {
    try {
      const response = await api.get(`/tests/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du test ${id}:`, error);
      throw error;
    }
  },

  /**
   * Alias pour getTest - Récupère un test par son identifiant
   * @param {string|number} id - L'identifiant du test
   * @returns {Promise<Object>} Les données du test
   * @throws {Error} En cas d'échec de la requête
   */
  getTestById: async (id) => {
    return testService.getTest(id);
  },
  
  /**
   * Crée un nouveau test
   * @param {Object} data - Les données du test à créer
   * @returns {Promise<Object>} Le test créé
   * @throws {Error} En cas d'échec de la requête
   */
  createTest: async (data) => {
    try {
      const response = await api.post('/tests', data);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du test:', error);
      throw error;
    }
  },
    /**
   * Met à jour un test existant
   * @param {string|number} id - L'identifiant du test
   * @param {Object} data - Les nouvelles données du test
   * @returns {Promise<Object>} Le test mis à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateTest: async (id, data) => {
    try {
      const response = await api.put(`/tests/${id}`, data);
      
      // Invalider le cache des spécifications pour ce test
      testService.invalidateSpecsCache(id);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du test ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un test
   * @param {string|number} id - L'identifiant du test à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   * @throws {Error} En cas d'échec de la requête
   */
  deleteTest: async (id) => {
    try {
      const response = await api.delete(`/tests/${id}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du test ${id}:`, error);
      throw error;
    }
  },  /**
   * Récupère les spécifications d'un test (avec cache)
   * @param {string|number} testId - L'identifiant du test
   * @param {string|number} parentId - L'identifiant du parent (optionnel)
   * @returns {Promise<Object>} Les spécifications du test
   * @throws {Error} En cas d'échec de la requête
   */  getTestSpecs: async (testId, parentId) => {
    try {
      // Récupération des spécifications pour test
      
      // Clé de cache basée sur testId et parentId
      const cacheKey = `specs_${testId}_${parentId || 'null'}`;
      const cached = specsCache.get(cacheKey);
      
      // Vérifier si les données en cache sont encore valides
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        // Spécifications récupérées depuis le cache
        return cached.data;
      }
      
      // Vérifier si une requête similaire est déjà en cours (debouncing)
      if (pendingRequests.has(cacheKey)) {
        console.log(`Requête en cours trouvée pour ${cacheKey}, réutilisation...`);
        return pendingRequests.get(cacheKey);
      }
      
      // Si parentId est null, undefined ou vide, ne pas l'inclure dans les paramètres
      const params = {};
      if (parentId !== null && parentId !== undefined && parentId !== '') {
        params.parent_id = parentId;
      }
      
      // Créer la promesse de requête et la mettre en cache temporairement
      const requestPromise = api.get(`/tests/${testId}/specs`, { params })
        .then(response => {
          // Traitement de la réponse selon le nouveau format d'API
          if (response.data && response.data.success === true) {
            // Spécifications récupérées avec succès
            
            // Vérifier si les spécifications sont une chaîne JSON et les parser si nécessaire
            let specs = response.data.data.specifications || [];
            if (typeof specs === 'string') {
              try {
                specs = JSON.parse(specs);
              } catch (e) {
                console.error('Erreur lors du parsing des spécifications:', e);
                specs = {};
              }
            }
            
            // Standardiser le format de retour pour faciliter l'utilisation dans les composants
            const result = {
              testId: response.data.data.testId,
              testName: response.data.data.testName,
              specifications: specs
            };
              // Mettre en cache le résultat
            specsCache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
            
            // Nettoyer le cache si nécessaire
            testService.cleanupCache();
            
            return result;
          }
          
          // Pour assurer la compatibilité avec les anciens formats
          if (response.data) {
            // Vérifier si les spécifications sont une chaîne JSON et les parser si nécessaire
            let specs = response.data.specifications || [];
            if (typeof specs === 'string') {
              try {
                specs = JSON.parse(specs);
              } catch (e) {
                console.error('Erreur lors du parsing des spécifications:', e);
                specs = {};
              }
            }
            
            return {
              ...response.data,
              specifications: specs
            };
          }
          
          return { specifications: [] };
        })
        .finally(() => {
          // Nettoyer la requête en cours
          pendingRequests.delete(cacheKey);
        });
      
      // Mettre la requête en cache temporairement
      pendingRequests.set(cacheKey, requestPromise);
      
      return requestPromise;
    } catch (error) {
      console.error(`Erreur lors de la récupération des spécifications du test ${testId}:`, error);
      console.error('Détails de l\'erreur:', error.response?.data || 'Pas de données dans la réponse');
      throw error;
    }
  },
    
  /**
   * Récupère les données du rapport d'un test
   * @param {string|number} testId - L'identifiant du test
   * @param {Array} selectedSections - Les sections du rapport à récupérer
   * @returns {Promise<Object>} Les données du rapport
   * @throws {Error} En cas d'échec de la requête
   */  getTestReportData: async (testId, selectedSections) => {
    try {
      console.log(`Récupération des données de rapport pour test ${testId}`, selectedSections);
      const response = await api.get(`/tests/${testId}/report`, { 
        params: { 
          sections: JSON.stringify(selectedSections) 
        } 
      });
      
      console.log('Réponse brute du serveur:', response);
      console.log('Données de la réponse:', response.data);
      
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        console.log('Format API success détecté, retour de response.data.data');
        return response.data.data;
      }      console.log('Format direct détecté, retour de response.data');
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des données du rapport pour le test ${testId}:`, error);
      throw error;
    }
  },
  /**
   * Vide le cache des spécifications
   */
  clearSpecsCache: () => {
    specsCache.clear();
    pendingRequests.clear();
    console.log('Cache des spécifications et requêtes en cours vidés');
  },

  /**
   * Invalide le cache pour un test spécifique
   * @param {string|number} testId - L'identifiant du test
   */
  invalidateSpecsCache: (testId) => {
    const keysToDelete = [];
    specsCache.forEach((value, key) => {
      if (key.startsWith(`specs_${testId}_`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => {
      specsCache.delete(key);
      pendingRequests.delete(key);
    });
    console.log(`Cache invalidé pour le test #${testId}`);
  },

  /**
   * Obtenir des statistiques détaillées du cache pour l'optimisation
   */
  getCacheStats: () => {
    const now = Date.now();
    const stats = {
      size: specsCache.size,
      pendingRequests: pendingRequests.size,
      entries: [],
      oldEntries: 0,
      recentEntries: 0
    };
    
    specsCache.forEach((value, key) => {
      const age = now - value.timestamp;
      const entry = {
        key,
        age: Math.round(age / 1000), // en secondes
        isExpired: age > CACHE_DURATION
      };
      
      stats.entries.push(entry);
      
      if (entry.isExpired) {
        stats.oldEntries++;
      } else {
        stats.recentEntries++;
      }
    });
    
    // Trier par âge
    stats.entries.sort((a, b) => b.age - a.age);
    
    return stats;
  },

  /**
   * Nettoie automatiquement les entrées expirées du cache
   */
  cleanupExpiredCache: () => {
    const now = Date.now();
    let removedCount = 0;
    
    specsCache.forEach((value, key) => {
      if ((now - value.timestamp) > CACHE_DURATION) {
        specsCache.delete(key);
        removedCount++;
      }
    });
    
    if (process.env.NODE_ENV === 'development' && removedCount > 0) {
      console.log(`Cache expiré nettoyé: ${removedCount} entrées supprimées`);
    }
    
    return removedCount;
  },

  /**
   * Nettoie le cache en supprimant les entrées les plus anciennes si la limite est atteinte
   */
  cleanupCache: () => {
    const MAX_CACHE_SIZE = 100; // Limite de 100 entrées pour éviter les fuites mémoire
    
    if (specsCache.size > MAX_CACHE_SIZE) {
      // Trier par timestamp et supprimer les plus anciennes
      const entries = Array.from(specsCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => specsCache.delete(key));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Cache nettoyé: ${toDelete.length} entrées supprimées`);
      }
    }
  },
};

// Maintenance automatique du cache (appelée périodiquement si nécessaire)
const setupCacheMaintenance = () => {
  // Nettoyage automatique toutes les 10 minutes
  setInterval(() => {
    testService.cleanupExpiredCache();
  }, 10 * 60 * 1000);
};

// Démarrer la maintenance du cache seulement en développement pour éviter les timers inutiles en production
if (process.env.NODE_ENV === 'development') {
  setupCacheMaintenance();
}

export default testService;