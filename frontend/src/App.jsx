import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User pages
import DashboardPage from './pages/user/DashboardPage';
import VehiclesPage from './pages/user/VehiclesPage';
import ServicesPage from './pages/user/ServicesPage';
import SubscriptionsPage from './pages/user/SubscriptionsPage';
import PartsPage from './pages/user/PartsPage';
import PaymentsPage from './pages/user/PaymentsPage';
import FeedbackPage from './pages/user/FeedbackPage';
import RemindersPage from './pages/user/RemindersPage';
import ReferralsPage from './pages/user/ReferralsPage';
import FeedPage from './pages/user/FeedPage';
import DocumentsPage from './pages/user/DocumentsPage';
import ProfilePage from './pages/user/ProfilePage';
import AIAgentPage from './pages/user/AIAgentPage';
import NotificationsPage from './pages/NotificationsPage';

// Franchise pages
import FranchiseDashboardPage from './pages/franchise/FranchiseDashboardPage';
import FranchiseBookingsPage from './pages/franchise/FranchiseBookingsPage';
import FranchiseQueuePage from './pages/franchise/FranchiseQueuePage';
import FranchiseCustomersPage from './pages/franchise/FranchiseCustomersPage';
import FranchiseHistoryPage from './pages/franchise/FranchiseHistoryPage';
import FranchisePaymentsPage from './pages/franchise/FranchisePaymentsPage';
import FranchiseWalletPage from './pages/franchise/FranchiseWalletPage';
import FranchiseFeedbackPage from './pages/franchise/FranchiseFeedbackPage';
import FranchiseProfilePage from './pages/franchise/FranchiseProfilePage';
import FranchiseBookingDetailsPage from './pages/franchise/FranchiseBookingDetailsPage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import AdminFeedManagePage from './pages/admin/AdminFeedManagePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminFranchisesPage from './pages/admin/AdminFranchisesPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminPartsPage from './pages/admin/AdminPartsPage';
import AdminFranchiseWalletPage from './pages/admin/AdminFranchiseWalletPage';

function Layout({ children, hideNav }) {
  return (
    <>
      {!hideNav && <Navbar />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/feed" element={<ProtectedRoute><Layout hideNav><FeedPage /></Layout></ProtectedRoute>} />
          <Route path="/parts" element={<ProtectedRoute><Layout hideNav><PartsPage /></Layout></ProtectedRoute>} />

          {/* User protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout hideNav><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Layout hideNav><VehiclesPage /></Layout></ProtectedRoute>} />
          <Route path="/services" element={<ProtectedRoute><Layout hideNav><ServicesPage /></Layout></ProtectedRoute>} />
          <Route path="/subscriptions" element={<ProtectedRoute><Layout hideNav><SubscriptionsPage /></Layout></ProtectedRoute>} />
          <Route path="/payments" element={<ProtectedRoute><Layout hideNav><PaymentsPage /></Layout></ProtectedRoute>} />
          <Route path="/feedback" element={<ProtectedRoute><Layout hideNav><FeedbackPage /></Layout></ProtectedRoute>} />
          <Route path="/reminders" element={<ProtectedRoute><Layout hideNav><RemindersPage /></Layout></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><Layout hideNav><ReferralsPage /></Layout></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Layout hideNav><DocumentsPage /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout hideNav><ProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/ai-agent" element={<ProtectedRoute><Layout hideNav><AIAgentPage /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout hideNav><NotificationsPage /></Layout></ProtectedRoute>} />

          {/* Franchise protected */}
          <Route path="/franchise/dashboard" element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseDashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/bookings" element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseBookingsPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/bookings/:id" element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseBookingDetailsPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/queue"     element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseQueuePage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/customers" element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseCustomersPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/history"   element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseHistoryPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/payments"  element={<ProtectedRoute role="franchise"><Layout hideNav><FranchisePaymentsPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/wallet"    element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseWalletPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/feedback"  element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseFeedbackPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/profile"   element={<ProtectedRoute role="franchise"><Layout hideNav><FranchiseProfilePage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/subscriptions" element={<ProtectedRoute role="franchise"><Layout hideNav><AdminSubscriptionsPage /></Layout></ProtectedRoute>} />
          <Route path="/franchise/notifications" element={<ProtectedRoute role="franchise"><Layout hideNav><NotificationsPage /></Layout></ProtectedRoute>} />

          {/* Admin protected */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><Layout hideNav><AdminDashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/services" element={<ProtectedRoute role="admin"><Layout hideNav><AdminServicesPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute role="admin"><Layout hideNav><AdminPaymentsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute role="admin"><Layout hideNav><AdminFeedbackPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/feed" element={<ProtectedRoute role="admin"><Layout hideNav><AdminFeedManagePage /></Layout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><Layout hideNav><AdminUsersPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/franchises" element={<ProtectedRoute role="admin"><Layout hideNav><AdminFranchisesPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/subscriptions" element={<ProtectedRoute role="admin"><Layout hideNav><AdminSubscriptionsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/parts" element={<ProtectedRoute role="admin"><Layout hideNav><AdminPartsPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/franchise-wallet" element={<ProtectedRoute role="admin"><Layout hideNav><AdminFranchiseWalletPage /></Layout></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute role="admin"><Layout hideNav><NotificationsPage /></Layout></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
