import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from '../common/NotificationDropdown';
export default function AdminPageHeader({ title, subtitle, action }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{title}</h1>
          {subtitle && <p style={{ color: '#6b7280', fontSize: '.83rem', marginTop: '.25rem', marginBottom: 0 }}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <NotificationDropdown />
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#1a6ef7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '.9rem', color: '#fff', flexShrink: 0,
          }}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#e2e8f0' }}>{user?.name || 'Admin'}</div>
            <div style={{ fontSize: '.7rem', color: '#6b7280', textTransform: 'capitalize' }}>{user?.role || 'Admin'}</div>
          </div>
        </div>
        <div 
          onClick={() => navigate('/admin/feed')}
          style={{
            display: 'flex', alignItems: 'center', gap: '.4rem',
            background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: 20, padding: '5px 14px', fontSize: '.75rem', fontWeight: 600,
            color: '#00e5ff', cursor: 'pointer',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          Live Feed
        </div>
      </div>
    </div>
  );
}
