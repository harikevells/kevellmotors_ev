import api from './apiClient';

export const authAPI = {
  register: (data: object) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: object) => api.put('/auth/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

export const vehicleAPI = {
  list: () => api.get('/vehicles'),
  get: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: object) => api.post('/vehicles', data),
  update: (id: string, data: object) => api.put(`/vehicles/${id}`, data),
  remove: (id: string) => api.delete(`/vehicles/${id}`),
  uploadDocument: (id: string, formData: FormData) =>
    api.post(`/vehicles/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  removeDocument: (vehicleId: string, docId: string) =>
    api.delete(`/vehicles/${vehicleId}/documents/${docId}`),
};

export const serviceAPI = {
  list: (params?: object) => api.get('/services', { params }),
  get: (id: string) => api.get(`/services/${id}`),
  create: (data: object) => api.post('/services', data),
  updateDropRequest: (id: string, dropRequested: boolean) => api.patch(`/services/${id}/drop-request`, { dropRequested }),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  list: () => api.get('/subscriptions'),
  create: (data: object) => api.post('/subscriptions', data),
};

export const partsAPI = {
  list: (params?: object) => api.get('/parts', { params }),
  get: (id: string) => api.get(`/parts/${id}`),
  placeOrder: (data: object) => api.post('/parts/orders', data),
  myOrders: () => api.get('/parts/orders/mine'),
};

export const paymentAPI = {
  list: () => api.get('/payments'),
  createOrder: (data: object) => api.post('/payments/create-order', data),
  verify: (data: object) => api.post('/payments/verify', data),
};

export const feedbackAPI = {
  submit: (formData: FormData) =>
    api.post('/feedback', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  myFeedback: () => api.get('/feedback/mine'),
  submitReview: (data: object) => api.post('/feedback/reviews', data),
  getReviews: (params?: object) => api.get('/feedback/reviews', { params }),
};

export const reminderAPI = {
  list: () => api.get('/reminders'),
  create: (data: object) => api.post('/reminders', data),
  acknowledge: (id: string) => api.put(`/reminders/${id}/acknowledge`),
  remove: (id: string) => api.delete(`/reminders/${id}`),
};

export const referralAPI = {
  getMyReferral: () => api.get('/referrals/me'),
};

export const feedAPI = {
  list: (params?: object) => api.get('/feed', { params }),
  like: (id: string) => api.put(`/feed/${id}/like`),
};

export const franchiseAPI = {
  listActive: () => api.get('/franchises', { params: { status: 'active' } }),
  nearby: (lat: number, lng: number, radius = 500) =>
    api.get('/franchises/nearby', { params: { lat, lng, radius } }),
  get: (id: string) => api.get(`/franchises/${id}`),
};

export const agentAPI = {
  chat: (messages: Array<{ role: string; content: string }>) =>
    api.post('/agent/chat', { messages }),
};
