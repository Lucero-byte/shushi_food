// Centralized API Client for Kaiseki Sushi Bar (Django REST Backend)
const API_BASE = (typeof window !== 'undefined' && window.location.origin)
  ? '/api'
  : 'http://127.0.0.1:8000/api';

// Storage helpers for session persistence
export const authStorage = {
  getUser: () => {
    try {
      const u = localStorage.getItem('kaiseki_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('kaiseki_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kaiseki_user');
    }
  },
  getToken: () => localStorage.getItem('kaiseki_token'),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('kaiseki_token', token);
    } else {
      localStorage.removeItem('kaiseki_token');
    }
  },
  clear: () => {
    localStorage.removeItem('kaiseki_user');
    localStorage.removeItem('kaiseki_token');
  }
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = authStorage.getToken();
  const user = authStorage.getUser();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(user?.role ? { 'X-User-Role': user.role } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 204) {
      return null;
    }
    const data = await response.json();
    if (!response.ok) {
      const errorMsg = data.detail || data.error || (typeof data === 'object' ? JSON.stringify(data) : 'Error en la solicitud');
      throw new Error(errorMsg);
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  login: async (username, password) => {
    const res = await request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res?.user && res?.token) {
      authStorage.setUser(res.user);
      authStorage.setToken(res.token);
    }
    return res;
  },
  logout: async () => {
    try {
      await request('/auth/logout/', { method: 'POST' });
    } catch (e) {
      console.warn('Logout endpoint notification failed, clearing local state anyway');
    } finally {
      authStorage.clear();
    }
  },
  getCurrentUser: () => request('/auth/user/'),

  // System Health
  getHealth: () => request('/health/'),

  // Dashboard
  getDashboard: () => request('/dashboard/'),

  // Categories (CRUD)
  getCategories: (params = '') => request(`/categories/${params}`),
  getCategory: (id) => request(`/categories/${id}/`),
  createCategory: (data) => request('/categories/', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`/categories/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}/`, { method: 'DELETE' }),

  // Ingredients (CRUD)
  getIngredients: (params = '') => request(`/ingredients/${params}`),
  createIngredient: (data) => request('/ingredients/', { method: 'POST', body: JSON.stringify(data) }),
  updateIngredient: (id, data) => request(`/ingredients/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIngredient: (id) => request(`/ingredients/${id}/`, { method: 'DELETE' }),
  adjustStock: (id, delta) => request(`/ingredients/${id}/adjust_stock/`, { method: 'POST', body: JSON.stringify({ delta }) }),

  // Products (CRUD)
  getProducts: (params = '') => request(`/products/${params}`),
  getProduct: (id) => request(`/products/${id}/`),
  createProduct: (data) => request('/products/', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}/`, { method: 'DELETE' }),
  toggleProductAvailability: (id) => request(`/products/${id}/toggle_availability/`, { method: 'POST' }),

  // Restaurant Tables (CRUD)
  getTables: (params = '') => request(`/tables/${params}`),
  createTable: (data) => request('/tables/', { method: 'POST', body: JSON.stringify(data) }),
  updateTable: (id, data) => request(`/tables/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTable: (id) => request(`/tables/${id}/`, { method: 'DELETE' }),
  changeTableStatus: (id, status) => request(`/tables/${id}/change_status/`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Customers (CRUD)
  getCustomers: (params = '') => request(`/customers/${params}`),
  createCustomer: (data) => request('/customers/', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}/`, { method: 'DELETE' }),
  toggleCustomerVip: (id) => request(`/customers/${id}/toggle_vip/`, { method: 'POST' }),

  // Orders / Pedidos (CRUD)
  getOrders: (params = '') => request(`/orders/${params}`),
  getOrder: (id) => request(`/orders/${id}/`),
  createOrder: (data) => request('/orders/', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id, data) => request(`/orders/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrder: (id) => request(`/orders/${id}/`, { method: 'DELETE' }),
  changeOrderStatus: (id, status) => request(`/orders/${id}/change_status/`, { method: 'POST', body: JSON.stringify({ status }) }),

  // Reservations (CRUD)
  getReservations: (params = '') => request(`/reservations/${params}`),
  createReservation: (data) => request('/reservations/', { method: 'POST', body: JSON.stringify(data) }),
  updateReservation: (id, data) => request(`/reservations/${id}/`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReservation: (id) => request(`/reservations/${id}/`, { method: 'DELETE' }),
  changeReservationStatus: (id, status) => request(`/reservations/${id}/change_status/`, { method: 'POST', body: JSON.stringify({ status }) }),
};
