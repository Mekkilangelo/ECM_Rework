import api from './api';

export const testService = {
  getTests: (partId, page = 1, limit = 10) => 
    api.get('/tests', { params: { partId, page, limit } }),
  
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