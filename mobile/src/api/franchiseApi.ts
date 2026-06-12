import apiClient from './apiClient';
import type {
  DashboardData,
  QueueData,
  Customer,
  RevenueData,
  FeedbackData,
  FranchiseProfile,
  Booking,
  ServiceStatus,
  InvoiceItem,
  WalletData,
  JobCard,
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ token: string; user: { _id: string; name: string; email: string; role: string } }>(
      '/auth/login',
      { email, password },
    ),
  getMe: () => apiClient.get<{ user: { _id: string; name: string; email: string; role: string } }>('/auth/me'),
};

// ── Franchise Portal ──────────────────────────────────────────────────────────
export const franchiseApi = {
  /** GET /franchise/dashboard */
  getDashboard: () => apiClient.get<DashboardData>('/franchise/dashboard'),

  /** GET /franchise/bookings */
  getBookings: (params?: { status?: ServiceStatus; page?: number }) =>
    apiClient.get<{ bookings: Booking[] }>('/franchise/bookings', { params }),

  /** PATCH /franchise/bookings/:id/status */
  updateBookingStatus: (
    id: string,
    body: {
      status: ServiceStatus;
      note?: string;
      invoiceItems?: InvoiceItem[];
      technicianNotes?: string;
    },
  ) => apiClient.patch<{ service: Booking }>(`/franchise/bookings/${id}/status`, body),

  /** PATCH /franchise/bookings/:id/job-card */
  updateJobCard: (id: string, body: JobCard) =>
    apiClient.patch<{ service: Booking }>(`/franchise/bookings/${id}/job-card`, body),

  /** PUT /franchise/bookings/:id/complete  (invoice submission) */
  completeBooking: (
    id: string,
    body: { serviceCharge: number; parts: { description: string; amount: number }[]; notes?: string },
  ) => apiClient.put<{ booking: Booking }>(`/franchise/bookings/${id}/complete`, body),

  /** PATCH /franchise/bookings/:id/payment */
  confirmPayment: (id: string, data: { paymentStatus: string }) =>
    apiClient.patch<{ booking: Booking }>(`/franchise/bookings/${id}/payment`, data),

  /** GET /franchise/queue */
  getQueue: () => apiClient.get<QueueData>('/franchise/queue'),

  /** GET /franchise/customers */
  getCustomers: () => apiClient.get<{ customers: Customer[] }>('/franchise/customers'),

  /** GET /franchise/customers/:id/orders */
  getCustomerOrders: (id: string) => apiClient.get<{ orders: any[] }>(`/franchise/customers/${id}/orders`),

  /** GET /franchise/history */
  getHistory: (params?: { period?: 'today' | 'week' | 'month' }) =>
    apiClient.get<{ history: Booking[] }>('/franchise/history', { params }),

  /** GET /franchise/revenue */
  getRevenue: () => apiClient.get<RevenueData>('/franchise/revenue'),

  /** GET /franchise/wallet */
  getWallet: () => apiClient.get<{ wallet: WalletData }>('/franchise/wallet'),

  /** POST /franchise/wallet/redeem */
  requestRedeem: (data: { amount: number; note?: string }) =>
    apiClient.post<{ wallet: WalletData }>('/franchise/wallet/redeem', data),

  /** GET /franchise/feedback */
  getFeedback: () => apiClient.get<FeedbackData>('/franchise/feedback'),

  /** GET /franchise/profile */
  getProfile: () => apiClient.get<{ franchise: FranchiseProfile }>('/franchise/profile'),

  /** PUT /franchise/profile */
  updateProfile: (data: Partial<FranchiseProfile>) =>
    apiClient.put<{ franchise: FranchiseProfile }>('/franchise/profile', data),

  /** POST /franchise/bookings */
  createBooking: (data: any) => apiClient.post<{ service: Booking }>('/franchise/bookings', data),

  /** PATCH /franchise/bookings/:id/logistics */
  updateLogisticsStatus: (id: string, body: { pickupStatus?: string; dropStatus?: string }) =>
    apiClient.patch<{ service: Booking }>(`/franchise/bookings/${id}/logistics`, body),

  // ── Subscriptions ────────────────────────────────────────────────────────────
  getSubscriptions: () => apiClient.get<{ subscriptions: any[] }>('/subscriptions'),
  getPlans: () => apiClient.get<{ plans: any[] }>('/subscriptions/admin/plans'),
  createSubscription: (data: { planId: string; vehicleId: string; userId: string }) =>
    apiClient.post<any>('/subscriptions', data),
  getUsers: () => apiClient.get<{ users: any[] }>('/admin/users'),
  getUserVehicles: (userId: string) => apiClient.get<{ vehicles: any[] }>(`/vehicles/user/${userId}`),
};

export const notificationsApi = {
  list: () => apiClient.get<{ notifications: any[] }>('/notifications'),
  getUnreadCount: () => apiClient.get<{ unreadCount: number }>('/notifications/unread-count'),
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/notifications/read-all'),
};
