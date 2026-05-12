import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { store } from '../store';
import { setCredentials, logout } from '../store/slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = store.getState().auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';
    const authState = store.getState().auth;
    const hasActiveSession = Boolean(authState.accessToken || authState.isAuthenticated);
    const isAuthEndpoint = requestUrl.includes('/auth/');
    const canAttemptRefresh = !isAuthEndpoint || requestUrl.includes('/auth/me');

    if (error.response?.status === 401 && !originalRequest._retry && canAttemptRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data.data;
        store.dispatch(setCredentials({ accessToken }));
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        if (hasActiveSession) {
          store.dispatch(logout());
          toast.error('Session expired. Please login again.');
          window.location.assign('/auth/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Methods ──────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: object) => api.post('/auth/register', data),
  login: (data: object) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: FormData | object) =>
    api.put('/auth/me', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  changePassword: (data: object) => api.put('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: object) => api.post('/auth/reset-password', data),
  verifyEmail: (token: string, email: string) => api.get(`/auth/verify-email?token=${token}&email=${email}`),
  toggleWishlist: (productId: string) => api.post(`/auth/wishlist/${productId}`),
  getWishlist: () => api.get('/auth/wishlist'),
};

export const productAPI = {
  getProducts: (params?: object) => api.get('/products', { params }),
  getProductBySlug: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: () => api.get('/products/featured'),
  getRelated: (id: string) => api.get(`/products/${id}/related`),
  createProduct: (data: FormData) => api.post('/admin/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct: (id: string, data: FormData | object) =>
    api.put(`/admin/products/${id}`, data,
      data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {}),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getProductReviews: (productId: string, params?: object) => api.get(`/products/${productId}/reviews`, { params }),
  createReview: (productId: string, data: object) => api.post(`/products/${productId}/reviews`, data),
};

export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  createCategory: (data: object) => api.post('/categories', data),
};

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addItem: (data: object) => api.post('/cart/items', data),
  updateItem: (itemId: string, quantity: number) => api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clearCart: () => api.delete('/cart'),
};

export const orderAPI = {
  getBankDetails: () => api.get('/orders/bank-details'),
  uploadPaymentProof: (orderId: string, formData: FormData) =>
    api.post(`/orders/${orderId}/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createCheckout: (data: object) => api.post('/orders/checkout', data),
  getMyOrders: (params?: object) => api.get('/orders/my-orders', { params }),
  getOrderByNumber: (orderNumber: string) => api.get(`/orders/my-orders/${orderNumber}`),
  cancelOrder: (id: string, reason?: string) => api.post(`/orders/my-orders/${id}/cancel`, { reason }),
};


export const reviewAPI = {
  createReview: (productId: string, data: object) => api.post(`/products/${productId}/reviews`, data),
  voteHelpful: (reviewId: string) => api.post(`/products/${reviewId}/helpful`),
};

export const notificationAPI = {
  getNotifications: (params?: object) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const adminAPI = {
  getDashboard: (period?: string) => api.get('/admin/dashboard', { params: { period } }),
  getAllUsers: (params?: object) => api.get('/admin/users', { params }),
  toggleUserStatus: (userId: string) => api.put(`/admin/users/${userId}/toggle-status`),
  getAllOrders: (params?: object) => api.get('/admin/orders', { params }),
  confirmPayment: (orderId: string) => api.patch(`/admin/orders/${orderId}/confirm-payment`),
  rejectPayment: (orderId: string, reason: string) => api.patch(`/admin/orders/${orderId}/reject-payment`, { reason }),
  getAllCategories: (params?: object) => api.get('/categories', { params }),
  createCategory: (data: object) => api.post('/categories', data),
};

export default api;

// ─── AI API (calls backend proxy — API key never in frontend) ─────────────────
export const aiAPI = {
  chat: (messages: { role: string; content: string }[], context?: object) =>
    api.post('/ai/chat', { messages, context }),
  smartSearch: (query: string) => api.post('/ai/search', { query }),
  generateDescription: (data: { name: string; category: string; price: number; storeSection: string }) =>
    api.post('/ai/generate-description', data),
  inventoryInsights: () => api.get('/ai/inventory-insights'),
};

// ─── Categories by store section ──────────────────────────────────────────────
export const storeCategoryAPI = {
  getBySection: (section: 'pharmacy' | 'supermarket' | 'cosmetics') =>
    api.get(`/categories/by-section/${section}`),
  getAll: () => api.get('/categories'),
};
