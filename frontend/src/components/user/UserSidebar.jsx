import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Zap, 
  Car, 
  Wrench, 
  Package, 
  Settings2, 
  CreditCard, 
  MessageCircle, 
  Bell, 
  Gift, 
  FileText, 
  UserCircle, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const items = [
  { to: '/dashboard',     icon: Home,          label: 'Dashboard' },
  { to: '/ai-agent',      icon: Zap,           label: 'AI Booking Agent', highlight: true },
  { to: '/vehicles',      icon: Car,           label: 'My Vehicles' },
  { to: '/services',      icon: Wrench,        label: 'Services' },
  { to: '/subscriptions', icon: Package,       label: 'Subscriptions' },
  { to: '/parts',         icon: Settings2,     label: 'Spare Parts' },
  { to: '/payments',      icon: CreditCard,    label: 'Payments' },
  { to: '/feedback',      icon: MessageCircle, label: 'Feedback' },
  { to: '/reminders',     icon: Bell,          label: 'Reminders' },
  { to: '/referrals',     icon: Gift,          label: 'Referrals' },
  { to: '/documents',     icon: FileText,      label: 'Documents' },
  { to: '/profile',       icon: UserCircle,    label: 'Profile' },
];

export default function UserSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="Kevell Motors" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '.5px' }}>KEVELL</div>
            <div style={{ fontSize: '.7rem', fontWeight: 600, color: '#6b7280', letterSpacing: '1px' }}>MOTORS</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const isActive = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className={`sidebar-item ${isActive ? 'active' : ''}`}
              style={item.highlight ? { background: 'linear-gradient(90deg,rgba(0,229,255,0.12),rgba(26,110,247,0.08))', borderLeft: '2px solid #00e5ff', marginBottom: 4 } : {}}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} style={{ marginRight: '0.85rem' }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && <span style={{ fontSize: '.6rem', fontWeight: 700, background: 'rgba(0,229,255,0.2)', color: '#00e5ff', borderRadius: 4, padding: '1px 5px', letterSpacing: '.4px' }}>AI</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} style={{ marginRight: '0.85rem' }} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
