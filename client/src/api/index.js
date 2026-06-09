import api from './axios'

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
}

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getLowStock: () => api.get('/products/low-stock'),
  getExpiring: () => api.get('/products/expiring'),
  getByBarcode: (code) => api.get(`/products/barcode/${code}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}

export const salesAPI = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  getDailySummary: () => api.get('/sales/summary/daily'),
  getWeeklySummary: () => api.get('/sales/summary/weekly'),
  getMonthlySummary: () => api.get('/sales/summary/monthly'),
  getTopProducts: (params) => api.get('/sales/reports/top-products', { params }),
  getCategoryBreakdown: (params) => api.get('/sales/reports/category-breakdown', { params }),
  downloadPDF: (id) => api.get(`/sales/${id}/pdf`, { responseType: 'blob' }),
}

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  recordPayment: (id, data) => api.post(`/customers/${id}/pay`, data),
}

export const suppliersAPI = {
  getAll: () => api.get('/suppliers'),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  createPurchaseOrder: (data) => api.post('/suppliers/purchase-orders', data),
  getPurchaseOrders: () => api.get('/suppliers/purchase-orders'),
}

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
}

export const reportsAPI = {
  downloadDailyPDF: () => api.get('/reports/pdf/daily', { responseType: 'blob' }),
}

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  changePassword: (data) => api.put('/settings/password', data),
  createUser: (data) => api.post('/settings/users', data),
}
