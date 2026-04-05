// No API_URL constant needed — Next.js serves API from same origin
const API_BASE_URL = '/api';

// Generic fetch wrapper with error handling
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
};

// Screens API
export const screensAPI = {
  getAll: () => fetchAPI('/screens'),
  getById: (id) => fetchAPI(`/screens/${id}`),
  create: (data) => fetchAPI('/screens', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/screens/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/screens/${id}`, { method: 'DELETE' }),
  updateQuantity: (id, quantity) => fetchAPI(`/screens/${id}/quantity`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  getLowStock: () => fetchAPI('/screens/alerts/low-stock'),
};

// Phones API
export const phonesAPI = {
  getAll: () => fetchAPI('/phones'),
  getById: (id) => fetchAPI(`/phones/${id}`),
  create: (data) => fetchAPI('/phones', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/phones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/phones/${id}`, { method: 'DELETE' }),
  updateQuantity: (id, quantity) => fetchAPI(`/phones/${id}/quantity`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  getLowStock: () => fetchAPI('/phones/alerts/low-stock'),
};

// Accessories API
export const accessoriesAPI = {
  getAll: () => fetchAPI('/accessories'),
  getById: (id) => fetchAPI(`/accessories/${id}`),
  create: (data) => fetchAPI('/accessories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/accessories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/accessories/${id}`, { method: 'DELETE' }),
  updateQuantity: (id, quantity) => fetchAPI(`/accessories/${id}/quantity`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  getLowStock: () => fetchAPI('/accessories/alerts/low-stock'),
};

// Stickers API
export const stickersAPI = {
  getAll: () => fetchAPI('/stickers'),
  getById: (id) => fetchAPI(`/stickers/${id}`),
  create: (data) => fetchAPI('/stickers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/stickers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/stickers/${id}`, { method: 'DELETE' }),
  updateQuantity: (id, quantity) => fetchAPI(`/stickers/${id}/quantity`, { method: 'PATCH', body: JSON.stringify({ quantity }) }),
  getLowStock: () => fetchAPI('/stickers/alerts/low-stock'),
};

// Programming API
export const programmingAPI = {
  getAll: () => fetchAPI('/programming'),
  getById: (id) => fetchAPI(`/programming/${id}`),
  create: (data) => fetchAPI('/programming', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/programming/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/programming/${id}`, { method: 'DELETE' }),
  updateStatus: (id, status) => fetchAPI(`/programming/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  markPaid: (id) => fetchAPI(`/programming/${id}/pay`, { method: 'PATCH' }),
  markNotified: (id) => fetchAPI(`/programming/${id}/notify`, { method: 'PATCH' }),
  getStats: () => fetchAPI('/programming/stats/summary'),
};

// Customers API
export const customersAPI = {
  getAll: () => fetchAPI('/customers'),
  getById: (id) => fetchAPI(`/customers/${id}`),
  create: (data) => fetchAPI('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/customers/${id}`, { method: 'DELETE' }),
  updatePurchase: (id, amount) => fetchAPI(`/customers/${id}/purchase`, { method: 'PATCH', body: JSON.stringify({ amount }) }),
  search: (query) => fetchAPI(`/customers/search/${query}`),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => fetchAPI('/suppliers'),
  getById: (id) => fetchAPI(`/suppliers/${id}`),
  create: (data) => fetchAPI('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/suppliers/${id}`, { method: 'DELETE' }),
  search: (query) => fetchAPI(`/suppliers/search/${query}`),
};

// Sales API
export const salesAPI = {
  getAll: () => fetchAPI('/sales'),
  getById: (id) => fetchAPI(`/sales/${id}`),
  getByDateRange: (startDate, endDate) => fetchAPI(`/sales/range?startDate=${startDate}&endDate=${endDate}`),
  create: (data) => fetchAPI('/sales', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/sales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/sales/${id}`, { method: 'DELETE' }),
  deleteByDateRange: (startDate, endDate) => fetchAPI(`/sales/range/delete?startDate=${startDate}&endDate=${endDate}`, { method: 'DELETE' }),
  getStats: () => fetchAPI('/sales/stats/summary'),
};

// Repairs API
export const repairsAPI = {
  getAll: () => fetchAPI('/repairs'),
  getById: (id) => fetchAPI(`/repairs/${id}`),
  getByStatus: (status) => fetchAPI(`/repairs/status/${status}`),
  create: (data) => fetchAPI('/repairs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/repairs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => fetchAPI(`/repairs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  markPaid: (id) => fetchAPI(`/repairs/${id}/pay`, { method: 'PATCH' }),
  markNotified: (id) => fetchAPI(`/repairs/${id}/notify`, { method: 'PATCH' }),
  delete: (id) => fetchAPI(`/repairs/${id}`, { method: 'DELETE' }),
  getStats: () => fetchAPI('/repairs/stats/summary'),
};

// Expenses API
export const expensesAPI = {
  getAll: () => fetchAPI('/expenses'),
  getById: (id) => fetchAPI(`/expenses/${id}`),
  getByDateRange: (startDate, endDate) => fetchAPI(`/expenses/range?startDate=${startDate}&endDate=${endDate}`),
  getByCategory: (category) => fetchAPI(`/expenses/category/${category}`),
  create: (data) => fetchAPI('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/expenses/${id}`, { method: 'DELETE' }),
  getStats: () => fetchAPI('/expenses/stats/summary'),
};

// Returns API
export const returnsAPI = {
  getAll: () => fetchAPI('/returns'),
  getById: (id) => fetchAPI(`/returns/${id}`),
  getBySale: (saleId) => fetchAPI(`/returns/sale/${saleId}`),
  create: (data) => fetchAPI('/returns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/returns/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/returns/${id}`, { method: 'DELETE' }),
};

// Installments API
export const installmentsAPI = {
  getAll: () => fetchAPI('/installments'),
  getById: (id) => fetchAPI(`/installments/${id}`),
  getPending: () => fetchAPI('/installments/status/pending'),
  create: (data) => fetchAPI('/installments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/installments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordPayment: (id, paymentId) => fetchAPI(`/installments/${id}/payment/${paymentId}`, { method: 'PATCH' }),
  delete: (id) => fetchAPI(`/installments/${id}`, { method: 'DELETE' }),
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => fetchAPI('/dashboard/summary'),
  getLowStockAlerts: () => fetchAPI('/dashboard/alerts/low-stock'),
  getReadyRepairs: () => fetchAPI('/dashboard/alerts/ready-repairs'),
  getMonthlyTrends: () => fetchAPI('/dashboard/trends/monthly'),
  getInventorySummary: () => fetchAPI('/dashboard/inventory/summary'),
};

// Backup API
export const backupAPI = {
  export: () => fetchAPI('/backup/export'),
  import: (data, clearExisting = false) => fetchAPI('/backup/import', {
    method: 'POST',
    body: JSON.stringify({ data, clearExisting })
  }),
  clear: () => fetchAPI('/backup/clear', { method: 'DELETE' }),
};

// Health check
export const healthCheck = () => fetchAPI('/health');

// Export all APIs
export default {
  screens: screensAPI,
  phones: phonesAPI,
  accessories: accessoriesAPI,
  stickers: stickersAPI,
  customers: customersAPI,
  suppliers: suppliersAPI,
  sales: salesAPI,
  repairs: repairsAPI,
  expenses: expensesAPI,
  returns: returnsAPI,
  installments: installmentsAPI,
  dashboard: dashboardAPI,
  backup: backupAPI,
  healthCheck,
};
