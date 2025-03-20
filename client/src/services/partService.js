import api from './api';

export const partService = {
  getParts: (page = 1, limit = 10) => 
    api.get('/parts', { params: { page, limit } }),
  
  getPart: (id) => 
    api.get(`/parts/${id}`),
  
  createPart: (data) => 
    api.post('/parts', data),
  
  updatePart: (id, data) => 
    api.put(`/parts/${id}`, data),
  
  deletePart: (id) => 
    api.delete(`/parts/${id}`)
};

export default partService;