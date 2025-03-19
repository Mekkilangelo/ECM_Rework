import api from './api';

export const orderService = {
  getOrders: (clientId, page = 1, limit = 10) => 
    api.get('/orders', { params: { clientId, page, limit } }),
  
  getOrder: (id) => 
    api.get(`/orders/${id}`),
  
  createOrder: (data) => 
    api.post('/orders', data),
  
  updateOrder: (id, data) => 
    api.put(`/orders/${id}`, data),
  
  deleteOrder: (id) => 
    api.delete(`/orders/${id}`)
};

export default orderService;