export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'franchise' | 'admin';
  referralCode?: string;
  avatar?: string;
}

export interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  registrationNumber: string;
  batteryCapacity?: number;
  color?: string;
  chargingType?: string;
  documents?: VehicleDocument[];
}

export interface VehicleDocument {
  _id: string;
  type?: string;
  name?: string;
  fileName?: string;
  url?: string;
  fileUrl?: string;
  uploadedAt: string;
}

export interface Franchise {
  _id: string;
  name: string;
  address?: { street?: string; city?: string; state?: string; pincode?: string };
  workingHours?: { open: string; close: string };
  availableDays?: string[];
  rating?: number;
  upiId?: string;
  distanceKm?: number;
}

export interface Service {
  _id: string;
  serviceType: string;
  status: 'pending' | 'onboarded' | 'diagnosis' | 'in_progress' | 'quality_check' | 'delivered' | 'cancelled';
  scheduledDate?: string;
  createdAt: string;
  vehicle?: Vehicle;
  franchise?: Franchise;
  description?: string;
  finalAmount?: number;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceItems?: InvoiceItem[];
  technicianNotes?: string;
  progressUpdates?: ProgressUpdate[];
}

export interface InvoiceItem {
  description: string;
  type: 'service' | 'part' | 'other';
  amount: number;
}

export interface ProgressUpdate {
  status: string;
  note?: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description?: string;
  amount: number;      // Changed from price to amount
  price?: number;      // Keep for compatibility during transition
  duration: number;
  services: number;    // Added services count
  highlights: string[]; // Changed from features to highlights
  features?: string[];  // Keep for compatibility
  badge?: string;       // Added optional badge
  targetBrand?: string; // Target vehicle brand
  serviceDiscount?: number;
  sparePartsDiscount?: number;
  isActive: boolean;
}

export interface Subscription {
  _id: string;
  user: string;
  vehicle: Vehicle;
  plan: SubscriptionPlan;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: string;
  endDate: string;
  amount: number;
  features: string[];
  servicesIncluded: number;
  servicesUsed: number;
}

export interface SparePart {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  brand?: string;
  partNumber?: string;
  image?: string;
  images?: string[];
}

export interface PartOrder {
  _id: string;
  items: Array<{
    part: SparePart;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  appliedSubscription?: Subscription;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  purpose: string;
  createdAt: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  refundedAt?: string;
  refundAmount?: number;
}

export interface Feedback {
  _id: string;
  comment: string;
  rating: number;
  category: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  adminResponse?: string;
  images?: string[];
}

export interface Reminder {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  isAcknowledged: boolean;
  type: 'service' | 'insurance' | 'registration' | 'custom';
  vehicle?: Vehicle;
}

export interface Referral {
  referralCode: string;
  referredUsers: Array<{ name: string; email: string; joinedAt: string }>;
  referralCount: number;
  rewards: number;
}

export interface FeedPost {
  _id: string;
  title: string;
  content: string;
  type: 'announcement' | 'offer' | 'news' | 'update';
  image?: string;
  createdAt: string;
  author?: { name: string };
  likes?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
