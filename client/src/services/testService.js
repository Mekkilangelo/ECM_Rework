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
    api.get(`/tests/${testId}/specs`, { params: { parentId } })
};

export default testService;