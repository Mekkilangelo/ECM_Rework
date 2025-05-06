// client/src/services/fileService.js
import api from './api';

const fileService = {
  uploadFiles: (formData, onUploadProgress) => {
    return api.post(`/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  
  getFilesByNode: (nodeId, options = {}) => {
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
    }
    
    return api.get(url);
  },
  
  deleteFile: (fileId) => {
    return api.delete(`/files/${fileId}`);
  },
  
  downloadFile: (fileId, preview = false) => {
    const url = new URL(`${api.defaults.baseURL}/files/download/${fileId}`);
    if (preview) {
      url.searchParams.append('preview', 'true');
    }
    window.open(url.toString(), '_blank');
  },
  
  getFilePreviewUrl: (fileId) => {
    return `${api.defaults.baseURL}/files/${fileId}`;
  },
  
  // Nouvelle méthode pour récupérer un fichier par ID
  getFileById: (fileId) => {
    return `${api.defaults.baseURL}/files/${fileId}`;
  },
  
  // Nouvelle méthode pour récupérer le contenu d'un fichier en blob
  getFileBlob: (fileId) => {
    return api.get(`/files/${fileId}`, {
      responseType: 'blob'
    });
  },
  
  associateFiles: (nodeId, tempId, options = {}) => {
    const { category, subcategory } = options;
    return api.post(`/files/associate`, {
      nodeId,
      tempId,
      category,
      subcategory
    });
  },
  
  // Méthode pour récupérer des statistiques sur les fichiers (par exemple, nombre par catégorie)
  getFileStats: (nodeId) => {
    return api.get(`/files/stats/${nodeId}`);
  }
};

export default fileService;
