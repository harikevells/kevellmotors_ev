import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock, Package, DollarSign, Settings, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/user/UserSidebar';
import AdminSidebar from '../components/admin/AdminSidebar';
import FranchiseSidebar from '../components/franchise/FranchiseSidebar';
import AdminPageHeader from '../components/admin/AdminPageHeader';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.notifications.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead({ stopPropagation: () => {} }, notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'booking': return <Wrench size={22} color="#06b6d4" />;
      case 'payment': return <DollarSign size={22} color="#4ade80" />;
      case 'order': return <Package size={22} color="#818cf8" />;
      case 'message': return <Bell size={22} color="#f472b6" />;
      default: return <Settings size={22} color="#94a3b8" />;
    }
  };

  const renderSidebar = () => {
    if (user?.role === 'admin') return <AdminSidebar />;
    if (user?.role === 'franchise') return <FranchiseSidebar />;
    return <UserSidebar />;
  };

  return (
    <div className="layout user-dark">
      {renderSidebar()}
      
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {(user?.role === 'admin' || user?.role === 'franchise') ? (
          <AdminPageHeader title="Notifications" />
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: '#06b6d4', marginBottom: '.3rem' }}>
                Account Center
              </div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Bell color="#06b6d4" size={26} /> Notifications
              </h1>
              <p style={{ margin: '.3rem 0 0', color: '#64748b', fontSize: '.9rem' }}>Stay updated with the latest alerts and activities.</p>
            </div>
            
            {unreadCount > 0 && (
              <button 
                className="btn btn-outline"
                onClick={handleMarkAllAsRead}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Check size={16} /> Mark all read
              </button>
            )}
          </div>
        )}

        {(user?.role === 'admin' || user?.role === 'franchise') && unreadCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button 
              className="btn btn-outline"
              onClick={handleMarkAllAsRead}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Check size={16} /> Mark all read
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {notifications.length === 0 ? (
            <div style={{ 
              padding: '4rem 2rem', textAlign: 'center', 
              background: 'linear-gradient(135deg, #0d0e2b 0%, #111330 100%)', 
              borderRadius: '16px', border: '1px solid rgba(99,102,241,0.1)' 
            }}>
              <Bell size={48} style={{ margin: '0 auto 1.5rem', color: '#334155' }} />
              <h3 style={{ margin: '0 0 0.5rem', color: '#e2e8f0', fontSize: '1.2rem', fontWeight: 600 }}>All Caught Up!</h3>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>You don't have any notifications right now.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '16px',
                  border: n.read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(99,102,241,0.3)',
                  background: n.read ? 'linear-gradient(135deg, #0d0e2b 0%, #111330 100%)' : 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(99,102,241,0.02) 100%)',
                  cursor: n.link ? 'pointer' : 'default',
                  display: 'flex',
                  gap: '1.25rem',
                  alignItems: 'center',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: n.read ? 'none' : '0 4px 20px rgba(99,102,241,0.08)'
                }}
                onMouseEnter={(e) => { if(n.link) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { if(n.link) e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ 
                  width: 52, 
                  height: 52, 
                  borderRadius: '14px', 
                  background: n.read ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: n.read ? 'none' : 'inset 0 0 0 1px rgba(99,102,241,0.2)'
                }}>
                  {getIcon(n.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: n.read ? 600 : 700, color: n.read ? '#cbd5e1' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {n.title.replace(' 🆕', '').replace('New ', '')}
                      {!n.read && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New</span>
                      )}
                    </h4>
                    {!n.read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(e, n._id)}
                        style={{ 
                          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', 
                          color: '#818cf8', cursor: 'pointer', padding: '4px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Mark as read"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: n.read ? '#94a3b8' : '#e2e8f0', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                    <Clock size={12} />
                    {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {n.link && (
                  <div style={{ color: '#06b6d4', paddingLeft: '1rem', opacity: n.read ? 0.5 : 1 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
