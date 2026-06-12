import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, socket } = useAuth();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);

    if (socket) {
      socket.on('new_notification', () => {
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.off('new_notification');
    };
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationsAPI.list();
      const notifs = res.data.notifications || [];
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  const handleNotificationClick = () => {
    if (user?.role === 'admin') {
      navigate('/admin/notifications');
    } else if (user?.role === 'franchise') {
      navigate('/franchise/notifications');
    } else {
      navigate('/notifications');
    }
  };

  const iconBtn = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8, padding: '6px 10px', color: '#9ca3af', cursor: 'pointer', fontSize: '.9rem',
    position: 'relative'
  };

  return (
    <button style={iconBtn} onClick={handleNotificationClick} type="button" aria-label="Notifications">
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: -5, right: -5,
          background: '#ef4444', color: '#fff', fontSize: '.6rem', fontWeight: 700,
          padding: '2px 5px', borderRadius: '10px', border: '2px solid #06071a'
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
