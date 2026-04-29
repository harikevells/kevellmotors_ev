// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'franchise' | 'admin';
}

// ─── Service / Booking ───────────────────────────────────────────────────────
export type ServiceStatus =
  | 'onboarded'
  | 'diagnosis'
  | 'in_progress'
  | 'waiting_parts'
  | 'quality_check'
  | 'delivered'
  | 'cancelled';

export interface Vehicle {
  _id: string;
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
}

export interface InvoiceItem {
  description: string;
  type: 'service' | 'part' | 'other';
  quantity?: number;
  rate?: number;
  amount: number;
}

export interface JobCard {
  jobNo?: string;
  date?: string;
  make?: string;
  year?: string;
  model?: string;
  colour?: string;
  regNo?: string;
  speedo?: string;
  totalAmount?: number;
  address?: string;
  postCode?: string;
  phone?: string;
  fax?: string;
  repairOrderNo?: string;
  inDate?: string;
  outDate?: string;
  charge?: number;
  cash?: number;
  vehicleInfo?: string;
  sundries?: string;
  customerName?: string;
  customerContact?: string;
}

export interface Booking {
  _id: string;
  createdAt?: string;
  owner: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  franchise?: {
    _id?: string;
    name?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  };
  vehicle: Vehicle;
  serviceType: string;
  status: ServiceStatus;
  paymentStatus?: 'pending' | 'confirmed' | 'waived';
  scheduledDate?: string;
  completedDate?: string;
  invoiceDate?: string;
  invoiceNumber?: string;
  finalAmount?: number;
  estimatedAmount?: number;
  invoiceItems?: InvoiceItem[];
  notes?: string;
  technicianNotes?: string;
  voiceNote?: string;
  jobCard?: JobCard;
}

export interface WalletTransaction {
  _id: string;
  amount: number;
  type: 'credit' | 'redeem_request' | 'redeemed';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  note?: string;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  pendingBalance: number;
  transactions: WalletTransaction[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DailyBooking {
  label: string;
  count: number;
  revenue?: number;
}

export interface DashboardStats {
  todayBookings: number;
  completedToday: number;
  pendingBookings: number;
  weekRevenue: number;
  capacityUsed: number;
  capacityTotal: number;
}

export interface DashboardData {
  stats: DashboardStats;
  wallet?: WalletData;
  dailyBookings: DailyBooking[];
  recentServices: Booking[];
}

// ─── Queue ───────────────────────────────────────────────────────────────────
export interface QueueData {
  queue: Booking[];
  capacity: number;
  occupied: number;
  availableSlots: number;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  vehicles: string[];
  totalVisits: number;
  lastServiceDate?: string;
}

// ─── Revenue ─────────────────────────────────────────────────────────────────
export interface RevenueData {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  payments: Booking[];
}

// ─── Feedback ────────────────────────────────────────────────────────────────
export interface Review {
  _id: string;
  user: { name: string };
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  isVerified?: boolean;
}

export interface FeedbackItem {
  _id: string;
  service?: { owner?: { name: string } };
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface FeedbackData {
  reviews: Review[];
  feedbacks: FeedbackItem[];
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export interface FranchiseProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber?: string;
  gstNumber?: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  workingHours: {
    open: string;
    close: string;
  };
  availableDays: string[];
  capacity: number;
  status: string;
}
