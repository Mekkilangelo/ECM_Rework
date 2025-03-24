// client/src/services/fileService.js
import api from './api'

const fileService = {
  uploadFiles: (formData, onUploadProgress) => {
    return api.post(`/files/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
  },
  
  getFilesByNode: (nodeId) => {
    return api.get(`/files/node/${nodeId}`);
  },
  
  deleteFile: (fileId) => {
    return api.delete(`/files/${fileId}`);
  },
  
  downloadFile: (fileId) => {
    window.open(`/files/download/${fileId}`, '_blank');
  },
  
  associateFiles: (nodeId, tempId) => {
    return api.post(`/files/associate`, { nodeId, tempId });
  }
};

export default fileService;