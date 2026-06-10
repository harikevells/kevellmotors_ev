import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  CreditCard, 
  Calendar, 
  Box, 
  Wallet, 
  MessageSquare, 
  Megaphone, 
  Users, 
  Store, 
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const items = [
  { to: '/admin',                  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/services',         icon: Settings,        label: 'Services' },
  { to: '/admin/payments',         icon: CreditCard,      label: 'Payments' },
  { to: '/admin/subscriptions',    icon: Calendar,        label: 'Subscriptions' },
  { to: '/admin/parts',            icon: Box,             label: 'Spare Parts' },
  { to: '/admin/franchise-wallet', icon: Wallet,          label: 'Franchise Wallet' },
  { to: '/admin/feedback',         icon: MessageSquare,   label: 'Feedback' },
  { to: '/admin/feed',             icon: Megaphone,       label: 'Push Feed' },
  { to: '/admin/users',            icon: Users,           label: 'Users' },
  { to: '/admin/franchises',       icon: Store,           label: 'Franchises' },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside style={{
      width: 220, background: '#07081e',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <img src="/logo.png" alt="Kevell Motors" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#e2e8f0', letterSpacing: '.5px' }}>KEVELL</div>
            <div style={{ fontSize: '.7rem', fontWeight: 600, color: '#6b7280', letterSpacing: '1px' }}>MOTORS</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '.75rem 0', overflowY: 'auto' }}>
        {items.map(item => {
          const isActive = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} style={{
              display: 'flex', alignItems: 'center', gap: '.85rem',
              padding: '.75rem 1.4rem',
              color: isActive ? '#00e5ff' : '#6b7280',
              background: isActive ? 'rgba(0,229,255,0.07)' : 'transparent',
              borderLeft: isActive ? '3px solid #00e5ff' : '3px solid transparent',
              fontSize: '.85rem', fontWeight: isActive ? 700 : 500,
              textDecoration: 'none', transition: 'all .15s',
              position: 'relative'
            }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '.75rem 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => { logout(); navigate('/login'); }} style={{
          display: 'flex', alignItems: 'center', gap: '.85rem',
          padding: '.75rem 1.4rem', width: '100%', background: 'none',
          border: 'none', color: '#ef4444', fontSize: '.85rem',
          fontWeight: 600, cursor: 'pointer', transition: 'opacity .15s',
        }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
