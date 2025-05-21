import api from './api';

export const testService = {
  getTests: (parent_id, page = 1, limit = 10, offset = 0) => 
    api.get('/tests', { params: { parent_id, offset, limit } }),
  
  getTest: (id) => 
    api.get(`/tests/${id}`),
  
  createTest: (data) => 
    api.post('/tests', data),
  
  updateTest: (id, data) => 
    api.put(`/tests/${id}`, data),
  
  deleteTest: (id) => 
    api.delete(`/tests/${id}`),

  getTestSpecs: (testId, parentId) => 
    api.get(`/tests/${testId}/specs`, { params: { parentId } }),
    
  // Nouvelle méthode pour récupérer les données du rapport
  getTestReportData: (testId, selectedSections) => 
    api.get(`/tests/${testId}/report`, { 
      params: { 
        sections: JSON.stringify(selectedSections) 
      } 
    })
};

export default testService;