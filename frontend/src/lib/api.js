import apiClient from './api-client';

// Auth endpoints
export const authAPI = {
  register: (data) => apiClient.post('/users/register/', data),
  login: (data) => apiClient.post('/auth/login/', data),
  logout: () => apiClient.post('/auth/logout/'),
  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh/', { refresh: refreshToken }),
  getCurrentUser: () => apiClient.get('/users/me/'),
  updateProfile: (data) => apiClient.put('/users/me/', data),
  changePassword: (data) => apiClient.post('/auth/change-password/', data),
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password/', { email }),
  resetPassword: (token, password) =>
    apiClient.post('/auth/reset-password/', { token, password }),
};

// Business endpoints
export const businessAPI = {
  getMe: () => apiClient.get('/businesses/'),
  create: (data) => apiClient.post('/businesses/create/', data),
  updateBusiness: (id, data) => apiClient.put(`/businesses/${id}/`, data),
  getSettings: (id) => apiClient.get(`/businesses/${id}/settings/`),
  updateSettings: (id, data) =>
    apiClient.put(`/businesses/${id}/settings/`, data),
};

// Products endpoints
export const productsAPI = {
  list: (params) => apiClient.get('/products/', { params }),
  create: (data) => apiClient.post('/products/', data),
  get: (id) => apiClient.get(`/products/${id}/`),
  update: (id, data) => apiClient.put(`/products/${id}/`, data),
  delete: (id) => apiClient.delete(`/products/${id}/`),
  listCategories: () => apiClient.get('/categories/'),
  createCategory: (data) => apiClient.post('/categories/', data),
};

// Sales endpoints
export const salesAPI = {
  list: (params) => apiClient.get('/sales/', { params }),
  create: (data) => apiClient.post('/sales/', data),
  get: (id) => apiClient.get(`/sales/${id}/`),
  update: (id, data) => apiClient.put(`/sales/${id}/`, data),
  delete: (id) => apiClient.delete(`/sales/${id}/`),
  getReceipt: (id) => apiClient.get(`/sales/${id}/receipt/`),
};

// Expenses endpoints
export const expensesAPI = {
  list: (params) => apiClient.get('/expenses/', { params }),
  create: (data) => apiClient.post('/expenses/', data),
  get: (id) => apiClient.get(`/expenses/${id}/`),
  update: (id, data) => apiClient.put(`/expenses/${id}/`, data),
  delete: (id) => apiClient.delete(`/expenses/${id}/`),
};

// Inventory endpoints
export const inventoryAPI = {
  list: (params) => apiClient.get('/inventory/', { params }),
  get: (id) => apiClient.get(`/inventory/${id}/`),
  update: (id, data) => apiClient.put(`/inventory/${id}/`, data),
  getMovements: (productId) =>
    apiClient.get(`/stock-movements/`, { params: { product: productId } }),
  createMovement: (data) => apiClient.post('/stock-movements/', data),
};

// Customers endpoints
export const customersAPI = {
  list: (params) => apiClient.get('/customers/', { params }),
  create: (data) => apiClient.post('/customers/', data),
  get: (id) => apiClient.get(`/customers/${id}/`),
  update: (id, data) => apiClient.put(`/customers/${id}/`, data),
  delete: (id) => apiClient.delete(`/customers/${id}/`),
};

// Reports endpoints
export const reportsAPI = {
  getSales: (params) => apiClient.get('/reports/sales/', { params }),
  getExpenses: (params) => apiClient.get('/reports/expenses/', { params }),
  getInventory: (params) => apiClient.get('/reports/inventory/', { params }),
  getProfitLoss: (params) => apiClient.get('/reports/profit-loss/', { params }),
  getHistory: (params) => apiClient.get('/reports/history/', { params }),
  getSummary: (params) => apiClient.get('/reports/summary/', { params }),
  generatePDF: (type, params) =>
    apiClient.get(`/reports/${type}/export/`, { params, responseType: 'blob' }),
};

// SACCO endpoints
export const saccoAPI = {
  getMembers: (params) => apiClient.get('/sacco-members/', { params }),
  createMember: (data) => apiClient.post('/sacco-members/', data),
  getMember: (id) => apiClient.get(`/sacco-members/${id}/`),
  updateMember: (id, data) => apiClient.put(`/sacco-members/${id}/`, data),
  deleteMember: (id) => apiClient.delete(`/sacco-members/${id}/`),
  getContributions: (params) =>
    apiClient.get('/sacco-contributions/', { params }),
  recordContribution: (data) => apiClient.post('/sacco-contributions/', data),
  
  getLoans: (params) => apiClient.get('/sacco-loans/', { params }),
  createLoan: (data) => apiClient.post('/sacco-loans/', data),
  getLoan: (id) => apiClient.get(`/sacco-loans/${id}/`),
  recordRepayment: (loanId, data) =>
    apiClient.post(`/sacco-repayments/`, { ...data, loan: loanId }),
  
  getStats: () => apiClient.get('/sacco-stats/'),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: (params) => apiClient.get('/dashboard/stats/', { params }),
  getRecentSales: (limit = 10) =>
    apiClient.get('/dashboard/recent-sales/', { params: { limit } }),
  getLowStockAlerts: () => apiClient.get('/dashboard/low-stock-alerts/'),
  getAnalytics: (params) => apiClient.get('/dashboard/analytics/', { params }),
};

// Notifications endpoints
export const notificationsAPI = {
  list: (params) => apiClient.get('/notifications/', { params }),
  markAsRead: (id) => apiClient.post(`/notifications/${id}/mark-read/`),
  markAllAsRead: () => apiClient.post('/notifications/mark-all-read/'),
};

//category endpoints
export const categoriesAPI = {
  list: (params) => apiClient.get('/categories/', { params }),
  create: (data) => apiClient.post('/categories/', data),
  get: (id) => apiClient.get(`/categories/${id}/`),
  update: (id, data) => apiClient.put(`/categories/${id}/`, data),
  delete: (id) => apiClient.delete(`/categories/${id}/`),
};
