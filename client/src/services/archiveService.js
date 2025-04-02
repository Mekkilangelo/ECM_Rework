import api from './api';

const archiveService = {
  /**
   * Récupère le contenu d'un répertoire
   * @param {string} path - Chemin du répertoire
   * @returns {Promise} - Promesse avec les données du répertoire
   */
  getDirectoryContents: async (path) => {
    return api.get(`/archives/directory`, {
      params: { path },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  /**
   * Télécharge un fichier
   * @param {string} path - Chemin du fichier
   * @returns {Promise} - Promesse avec les données du fichier
   */
  downloadArchive: async (path) => {
    return api.get(`/archives/download`, {
      params: { path },
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  /**
   * Récupère un aperçu du fichier
   * @param {string} path - Chemin du fichier
   * @returns {Promise} - Promesse avec les données d'aperçu
   */
  getArchivePreview: async (path) => {
    return api.get(`/archives/preview`, {
      params: { path },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
  },

  /**
   * Crée un nouveau dossier
   * @param {string} path - Chemin où créer le dossier
   * @param {string} folderName - Nom du dossier à créer
   * @returns {Promise} - Promesse avec le résultat de l'opération
   */
  createFolder: async (path, folderName) => {
    return api.post(`/archives/directory`, 
      { path, folderName },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
  }
};

export default archiveService;