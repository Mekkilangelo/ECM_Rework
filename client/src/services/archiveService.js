import api from './api';

/**
 * Service de gestion des archives
 * Fournit des méthodes pour interagir avec le système de fichiers d'archives
 */
const archiveService = {
  /**
   * Récupère le contenu d'un répertoire
   * @param {string} path - Chemin du répertoire
   * @returns {Promise<Object>} Contenu du répertoire (fichiers et dossiers)
   * @throws {Error} En cas d'échec de la requête
   */
  getDirectoryContents: async (path) => {
    try {
      const response = await api.get(`/archives/directory`, {
        params: { path }
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du contenu du répertoire "${path}":`, error);
      throw error;
    }
  },

  /**
   * Télécharge un fichier d'archives
   * @param {string} path - Chemin du fichier
   * @returns {Promise<Blob>} Le contenu du fichier sous forme de Blob
   * @throws {Error} En cas d'échec de la requête
   */
  downloadArchive: async (path) => {
    try {
      const response = await api.get(`/archives/download`, {
        params: { path },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du téléchargement du fichier "${path}":`, error);
      throw error;
    }
  },

  /**
   * Récupère un aperçu du fichier
   * @param {string} path - Chemin du fichier
   * @returns {Promise<Object>} Données d'aperçu du fichier
   * @throws {Error} En cas d'échec de la requête
   */
  getArchivePreview: async (path) => {
    try {
      const response = await api.get(`/archives/preview`, {
        params: { path }
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'aperçu du fichier "${path}":`, error);
      throw error;
    }
  },

  /**
   * Crée un nouveau dossier dans les archives
   * @param {string} path - Chemin où créer le dossier
   * @param {string} folderName - Nom du dossier à créer
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  createFolder: async (path, folderName) => {
    try {
      const response = await api.post(`/archives/directory`, { 
        path, 
        folderName 
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la création du dossier "${folderName}" dans "${path}":`, error);
      throw error;
    }
  }
};

export default archiveService;