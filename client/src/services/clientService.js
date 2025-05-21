import api from './api';

export const clientService = {
  getClients: (page = 1, limit = 10) => 
    api.get('/clients', { params: { page, limit } })
      .then(response => {
        // Si la réponse correspond au nouveau format (data + pagination)
        if (response.data && response.data.data) {
          return {
            data: {
              clients: response.data.data,
              pagination: response.data.pagination
            }
          };
        }
        // Sinon, retourner la réponse telle quelle
        return response;
      }),
  
  getClient: (id) => 
    api.get(`/clients/${id}`)
      .then(response => {
        // Si la réponse correspond au nouveau format (data)
        if (response.data && response.data.data) {
          return { 
            data: response.data.data 
          };
        }
        // Sinon, retourner la réponse telle quelle
        return response;
      }),
  
  createClient: (data) => 
    api.post('/clients', data),
  
  updateClient: (id, data) => 
    api.put(`/clients/${id}`, data),
  
  deleteClient: (id) => 
    api.delete(`/clients/${id}`)
};

export default clientService;