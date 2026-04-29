import { useAuth } from '../../context/AuthContext';

export default function UserPageHeader({ title, subtitle, actions }) {
  const { user } = useAuth();

  const iconButtonStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '6px 10px',
    color: '#9ca3af',
    cursor: 'pointer',
    fontSize: '.9rem',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ margin: '.2rem 0 0', color: '#6b7280', fontSize: '.78rem' }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {actions}
        <button style={iconButtonStyle} type="button" aria-label="Search">🔍</button>
        <button style={iconButtonStyle} type="button" aria-label="Notifications">🔔</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#1a6ef7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '.9rem',
            color: '#fff',
            flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#e2e8f0' }}>{user?.name || 'User'}</div>
            <div style={{ fontSize: '.7rem', color: '#6b7280' }}>EV Owner</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.4rem',
          background: 'rgba(0,229,255,0.08)',
          border: '1px solid rgba(0,229,255,0.25)',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: '.75rem',
          fontWeight: 600,
          color: '#00e5ff',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          Live Feed
        </div>
      </div>
    </div>
  );
}
