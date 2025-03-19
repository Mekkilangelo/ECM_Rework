import api from './api';

export const clientService = {
  getClients: (page = 1, limit = 10) => 
    api.get('/clients', { params: { page, limit } }),
  
  getClient: (id) => 
    api.get(`/clients/${id}`),
  
  createClient: (data) => 
    api.post('/clients', data),
  
  updateClient: (id, data) => 
    api.put(`/clients/${id}`, data),
  
  deleteClient: (id) => 
    api.delete(`/clients/${id}`)
};

export default clientService;