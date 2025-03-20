import api from './api';

const steelService = {
  // Récupérer tous les grades d'acier
  getSteelGrades: () => 
    api.get('/steels/grades').then(response => response.data.data),
  
  // Récupérer un acier spécifique par ID
  getSteelById: (id) => 
    api.get(`/api/steels/${id}`).then(response => response.data),
  
  // Créer un nouvel acier
  createSteel: (steelData) => 
    api.post('/steels', steelData).then(response => response.data),
  
  // Mettre à jour un acier existant
  updateSteel: (id, steelData) => 
    api.put(`/steels/${id}`, steelData).then(response => response.data),
  
  // Supprimer un acier
  deleteSteel: (id) => 
    api.delete(`/steels/${id}`).then(response => response.data),
  
  // Rechercher des aciers par grade ou famille
  searchSteels: (query) => 
    api.get(`/steels/search?q=${query}`).then(response => response.data),
  
  // Récupérer les aciers par famille
  getSteelsByFamily: (family) => 
    api.get(`/steels/family/${family}`).then(response => response.data),
  
  // Récupérer les aciers par standard
  getSteelsByStandard: (standard) => 
    api.get(`/steels/standard/${standard}`).then(response => response.data)
};

export default steelService;