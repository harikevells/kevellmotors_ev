import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  registerFranchise: (data) => api.post('/auth/register-franchise', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const vehicleAPI = {
  list: () => api.get('/vehicles'),
  listForUser: (userId) => api.get(`/vehicles/user/${userId}`),
  get: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  remove: (id) => api.delete(`/vehicles/${id}`),
  uploadDocument: (id, formData) =>
    api.post(`/vehicles/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const serviceAPI = {
  list: (params) => api.get('/services', { params }),
  get: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  updateStatus: (id, data) => api.put(`/services/${id}/status`, data),
  updateDeliverables: (id, data) => api.put(`/services/${id}/deliverables`, data),
  assign: (id, franchiseId) => api.put(`/services/${id}/assign`, { franchiseId }),
  updateDropRequest: (id, dropRequested) => api.patch(`/services/${id}/drop-request`, { dropRequested }),
};

export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions/plans'),
  list: () => api.get('/subscriptions'),
  get: (id) => api.get(`/subscriptions/${id}`),
  create: (data) => api.post('/subscriptions', data),
  activate: (id, data) => api.put(`/subscriptions/${id}/activate`, data),
  reject: (id) => api.put(`/subscriptions/${id}/reject`),
};

export const subscriptionPlanAPI = {
  listAll: () => api.get('/subscriptions/admin/plans'),
  create: (data) => api.post('/subscriptions/admin/plans', data),
  update: (id, data) => api.put(`/subscriptions/admin/plans/${id}`, data),
  remove: (id) => api.delete(`/subscriptions/admin/plans/${id}`),
};

export const partsAPI = {
  list: (params) => api.get('/parts', { params }),
  get: (id) => api.get(`/parts/${id}`),
  create: (data) => api.post('/parts', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/parts/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/parts/${id}`),
  placeOrder: (data) => api.post('/parts/orders', data),
  myOrders: () => api.get('/parts/orders/mine'),
  allOrders: () => api.get('/parts/admin/orders'),
  updateOrderStatus: (id, status) => api.put(`/parts/orders/${id}/status`, { status }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  sendNotification: (data) => api.post('/notifications/send', data), // admin/franchise
};

export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  list: () => api.get('/payments'),
  listAll: (params) => api.get('/payments/all', { params }),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

export const feedbackAPI = {
  submit: (formData) =>
    api.post('/feedback', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) =>
    api.put(`/feedback/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/feedback/${id}`),
  myFeedback: () => api.get('/feedback/mine'),
  allFeedback: (params) => api.get('/feedback/all', { params }),
  respond: (id, data) => api.put(`/feedback/${id}/respond`, data),
  submitReview: (data) => api.post('/feedback/reviews', data),
  getReviews: (params) => api.get('/feedback/reviews', { params }),
  updateReview: (id, data) => api.put(`/feedback/reviews/${id}`, data),
  removeReview: (id) => api.delete(`/feedback/reviews/${id}`),
};

export const reminderAPI = {
  list: () => api.get('/reminders'),
  create: (data) => api.post('/reminders', data),
  acknowledge: (id) => api.put(`/reminders/${id}/acknowledge`),
  remove: (id) => api.delete(`/reminders/${id}`),
};

export const referralAPI = {
  getMyReferral: () => api.get('/referrals/me'),
};

export const feedAPI = {
  list: (params) => api.get('/feed', { params }),
  get: (id) => api.get(`/feed/${id}`),
  create: (formData) =>
    api.post('/feed', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  like: (id) => api.put(`/feed/${id}/like`),
  update: (id, data) => api.put(`/feed/${id}`, data),
  remove: (id) => api.delete(`/feed/${id}`),
};

export const franchiseAPI = {
  list: (params) => api.get('/franchises', { params }),
  listActive: () => api.get('/franchises', { params: { status: 'active' } }),
  nearby: (lat, lng, radius = 30) => api.get('/franchises/nearby', { params: { lat, lng, radius } }),
  get: (id) => api.get(`/franchises/${id}`),
  create: (data) => api.post('/franchises', data),
  update: (id, data) => api.put(`/franchises/${id}`, data),
  updateStatus: (id, data) => api.put(`/franchises/${id}/status`, data),
};

export const franchisePortalAPI = {
  me: () => api.get('/franchise/me'),
  getProfile: () => api.get('/franchise/profile'),
  updateProfile: (data) => api.put('/franchise/profile', data),
  getDashboard: () => api.get('/franchise/dashboard'),
  getBookings: (params) => api.get('/franchise/bookings', { params }),
  updateBookingStatus: (id, data) => api.patch(`/franchise/bookings/${id}/status`, data),
  updateJobCard: (id, data) => api.patch(`/franchise/bookings/${id}/job-card`, data),
  getQueue: () => api.get('/franchise/queue'),
  getCustomers: () => api.get('/franchise/customers'),
  getHistory: (params) => api.get('/franchise/history', { params }),
  getRevenue: () => api.get('/franchise/revenue'),
  getFeedback: () => api.get('/franchise/feedback'),
  confirmPayment: (id, data) => api.patch(`/franchise/bookings/${id}/payment`, data),
  getWallet: () => api.get('/franchise/wallet'),
  requestRedeem: (data) => api.post('/franchise/wallet/redeem', data),
  createBooking: (data) => api.post('/franchise/bookings', data),
  updateLogisticsStatus: (id, data) => api.patch(`/franchise/bookings/${id}/logistics`, data),
};

export const adminAPI = {
  dashboard: () => api.get('/admin/dashboard'),
  listUsers: (params) => api.get('/admin/users', { params }),
  updateUserAccess: (id, data) => api.put(`/admin/users/${id}/access`, data),
  listServices: (params) => api.get('/admin/services', { params }),
  listSubscriptions: (params) => api.get('/subscriptions', { params }),
  pushOffer: (data) => api.post('/admin/push-offer', data),
  pushFeed: (data) => api.post('/admin/push-feed', data),
  getRedeemRequests: () => api.get('/franchises/wallet/redeem-requests'),
  getWalletBalances: () => api.get('/franchises/wallet/balances'),
  processRedeemRequest: (franchiseId, txId, data) =>
    api.put(`/franchises/${franchiseId}/wallet/redeem/${txId}`, data),
};

export const agentAPI = {
  chat: (messages) => api.post('/agent/chat', { messages }),
};
