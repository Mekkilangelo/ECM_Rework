import api from './api';

const steelService = {
  // Get all steels with pagination
  getAllSteels: (page = 1, limit = 10) =>
    api.get('/steels', { params: { limit, offset: (page - 1) * limit }}),

  // Get all steel grades
  getSteelGrades: () => 
    api.get('/steels/grades'),
  
  // Get a specific steel by ID
  getSteelById: (id) => 
    api.get(`/steels/${id}`),
  
  // Create a new steel
  createSteel: (steelData) => 
    api.post('/steels', steelData),
  
  // Update an existing steel
  updateSteel: (id, steelData) => 
    api.put(`/steels/${id}`, steelData),
  
  // Delete a steel
  deleteSteel: (id) => 
    api.delete(`/steels/${id}`),
  
  // Search steels by grade or family
  searchSteels: (query) => 
    api.get(`/steels/search`, { params: { q: query }}),
  
  // Get steels by family
  getSteelsByFamily: (family) => 
    api.get(`/steels/family/${family}`),
  
  // Get steels by standard
  getSteelsByStandard: (standard) => 
    api.get(`/steels/standard/${standard}`)
};

export default steelService;
