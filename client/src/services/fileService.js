import api from './api';

/**
 * Service de gestion des fichiers
 * Fournit des méthodes pour interagir avec l'API REST pour la gestion des fichiers
 */
const fileService = {
  /**
   * Télécharge des fichiers sur le serveur
   * @param {FormData} formData - Données du formulaire contenant les fichiers
   * @param {Function} onUploadProgress - Callback pour suivre la progression du téléchargement
   * @returns {Promise<Object>} Résultat de l'opération de téléchargement
   * @throws {Error} En cas d'échec de la requête
   */  uploadFiles: async (formData, onUploadProgress) => {
    try {
      const response = await api.post(`/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress
      });
      // On retourne directement la réponse pour une gestion uniforme
      return response;
    } catch (error) {
      console.error('Erreur lors du téléchargement des fichiers:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les fichiers associés à un nœud
   * @param {string|number} nodeId - Identifiant du nœud
   * @param {Object} options - Options de filtrage
   * @param {string} [options.category] - Catégorie de fichiers à récupérer
   * @param {string} [options.subcategory] - Sous-catégorie de fichiers à récupérer
   * @returns {Promise<Array>} Liste des fichiers associés au nœud
   * @throws {Error} En cas d'échec de la requête
   */
  getNodeFiles: async (nodeId, options = {}) => {
    try {
      const { category, subcategory } = options;
      let url = `/files/node/${nodeId}`;
      
      // Ajouter les paramètres de requête si nécessaire
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
      
      // Ajouter les paramètres à l'URL si nécessaires
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }      const response = await api.get(url);
      // On retourne directement la réponse pour une gestion uniforme
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des fichiers du nœud ${nodeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un fichier
   * @param {string|number} fileId - Identifiant du fichier à supprimer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  deleteFile: async (fileId) => {    try {
      const response = await api.delete(`/files/${fileId}`);
      // On retourne directement la réponse pour une gestion uniforme
      return response;
    } catch (error) {
      console.error(`Erreur lors de la suppression du fichier ${fileId}:`, error);
      throw error;
    }
  },
    /**
   * Télécharge un fichier ou ouvre son aperçu
   * @param {string|number} fileId - Identifiant du fichier à télécharger
   * @param {boolean} preview - Si true, ouvre un aperçu du fichier
   */
  downloadFile: (fileId, preview = false) => {
    const url = new URL(`${api.defaults.baseURL}/files/download/${fileId}`);
    if (preview) {
      url.searchParams.append('preview', 'true');
    }
    
    // Ouvrir dans un nouvel onglet
    window.open(url.toString(), '_blank');
  },
  
  /**
   * Récupère l'URL d'aperçu d'un fichier
   * @param {string|number} fileId - Identifiant du fichier
   * @returns {string} URL d'aperçu du fichier
   */
  getFilePreviewUrl: (fileId) => {
    return `${api.defaults.baseURL}/files/${fileId}`;
  },
  /**
   * Récupère l'URL d'un fichier par son ID
   * @param {string|number} fileId - Identifiant du fichier
   * @returns {string} URL du fichier
   */
  getFileUrl: (fileId) => {
    return `${api.defaults.baseURL}/files/${fileId}`;
  },
  
  /**
   * Récupère l'URL d'un fichier par son ID (alias pour getFileUrl)
   * @param {string|number} fileId - Identifiant du fichier
   * @returns {string} URL du fichier
   */
  getFileById: (fileId) => {
    return `${api.defaults.baseURL}/files/${fileId}`;
  },
  
  /**
   * Récupère le contenu d'un fichier sous forme de blob
   * @param {string|number} fileId - Identifiant du fichier
   * @returns {Promise<Blob>} Contenu du fichier sous forme de blob
   * @throws {Error} En cas d'échec de la requête
   */
  getFileBlob: async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du blob pour le fichier ${fileId}:`, error);
      throw error;
    }
  },
  
  /**
   * Associe des fichiers temporaires à un nœud
   * @param {string|number} nodeId - Identifiant du nœud
   * @param {string} tempId - Identifiant temporaire des fichiers
   * @param {Object} options - Options d'association
   * @param {string} [options.category] - Catégorie des fichiers
   * @param {string} [options.subcategory] - Sous-catégorie des fichiers
   * @returns {Promise<Object>} Résultat de l'opération d'association
   * @throws {Error} En cas d'échec de la requête
   */
  associateFiles: async (nodeId, tempId, options = {}) => {
    try {
      const { category, subcategory } = options;      const response = await api.post(`/files/associate`, {
        nodeId,
        tempId,
        category,
        subcategory      });
      // On retourne directement la réponse pour une gestion uniforme
      return response;
    } catch (error) {
      console.error(`Erreur lors de l'association des fichiers au nœud ${nodeId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère des statistiques sur les fichiers d'un nœud
   * @param {string|number} nodeId - Identifiant du nœud
   * @returns {Promise<Object>} Statistiques des fichiers (par catégorie, etc.)
   * @throws {Error} En cas d'échec de la requête
   */
  getFileStats: async (nodeId) => {
    try {
      const response = await api.get(`/files/stats/${nodeId}`);
      // On retourne directement la réponse pour une gestion uniforme
      return response;
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques de fichiers pour le nœud ${nodeId}:`, error);
      throw error;
    }
  },

  /**
   * Met à jour les métadonnées d'un fichier (description, nom, etc.)
   * @param {string|number} fileId - Identifiant du fichier
   * @param {Object} updateData - Données à mettre à jour
   * @param {string} [updateData.description] - Nouvelle description
   * @param {string} [updateData.name] - Nouveau nom
   * @param {string} [updateData.category] - Nouvelle catégorie
   * @param {string} [updateData.subcategory] - Nouvelle sous-catégorie
   * @returns {Promise<Object>} Résultat de la mise à jour
   * @throws {Error} En cas d'échec de la requête
   */
  updateFile: async (fileId, updateData) => {
    try {
      const response = await api.put(`/files/${fileId}`, updateData);
      return response;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du fichier ${fileId}:`, error);
      throw error;
    }
  }
};

export default fileService;
