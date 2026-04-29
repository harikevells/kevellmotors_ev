import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const STATUS_MAP = {
  onboarded:     { label: 'New',          badge: 'badge-info' },
  diagnosis:     { label: 'Accepted',     badge: 'badge-warning' },
  in_progress:   { label: 'In Service',   badge: 'badge-secondary' },
  waiting_parts: { label: 'Waiting Parts',badge: 'badge-warning' },
  quality_check: { label: 'QC',           badge: 'badge-secondary' },
  delivered:     { label: 'Completed',    badge: 'badge-success' },
  cancelled:     { label: 'Cancelled',    badge: 'badge-danger' },
};

export default function FranchiseDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    franchisePortalAPI.getDashboard()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' }}>
      <FranchiseSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );
  if (!data) return (
    <div style={{ background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' }}>
      <FranchiseSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Failed to load dashboard.</p>
      </div>
    </div>
  );

  const { stats, dailyBookings, recentServices } = data;
  const capacityPct = stats.capacityTotal ? Math.round((stats.capacityUsed / stats.capacityTotal) * 100) : 0;

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const ch   = { padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const th   = { padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px' };
  const scColors = { onboarded: '#1a6ef7', diagnosis: '#00e5ff', in_progress: '#f59e0b', waiting_parts: '#ff9100', quality_check: '#a855f7', delivered: '#22c55e', cancelled: '#ef4444' };

  return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#9ca3af', cursor: 'pointer', fontSize: '.9rem' }}>🔍</button>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', color: '#9ca3af', cursor: 'pointer', fontSize: '.9rem' }}>🔔</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#1a6ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', color: '#fff', flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase() || 'F'}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#e2e8f0' }}>{user?.name || 'Franchise'}</div>
                <div style={{ fontSize: '.7rem', color: '#6b7280' }}>Franchise</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 20, padding: '5px 14px', fontSize: '.75rem', fontWeight: 600, color: '#00e5ff', cursor: 'pointer' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Live Feed
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: "Today's Bookings",  value: stats.todayBookings,   icon: '📅', color: '#0ea5e9' },
            { label: 'Vehicles Serviced', value: stats.completedToday,  icon: '✅', color: '#22c55e' },
            { label: 'Pending Requests',  value: stats.pendingBookings, icon: '⏳', color: '#f59e0b' },
            { label: 'Week Revenue',      value: `₹${(stats.weekRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#8b5cf6' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ ...card, borderLeft: `4px solid ${color}`, padding: '1.25rem' }}>
              {/* <div style={{ fontSize: '1.4rem', marginBottom: '.5rem' }}>{icon}</div> */}
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: '.25rem' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Capacity card */}
          <div style={card}>
            <div style={ch}><h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Today's Capacity</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.5rem', color: '#e2e8f0' }}>{stats.capacityUsed} / {stats.capacityTotal}</span>
                <span style={{ color: capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>{capacityPct}% full</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${capacityPct}%`, height: '100%', borderRadius: '999px', background: capacityPct >= 90 ? '#ef4444' : capacityPct >= 70 ? '#f59e0b' : '#22c55e', transition: 'width .3s' }} />
              </div>
              <p style={{ color: '#6b7280', fontSize: '.8rem', marginTop: '.5rem' }}>{Math.max(0, stats.capacityTotal - stats.capacityUsed)} slots available today</p>
              <Link to="/franchise/queue" style={{ display: 'inline-block', marginTop: '.75rem', padding: '.35rem .9rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#9ca3af', fontSize: '.78rem', textDecoration: 'none' }}>View Queue →</Link>
            </div>
          </div>

          {/* Mini bar chart */}
          <div style={card}>
            <div style={ch}><h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Last 7 Days — Bookings</h3></div>
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '100px' }}>
                {dailyBookings.map((d) => {
                  const max = Math.max(...dailyBookings.map(x => x.count), 1);
                  const h = Math.round((d.count / max) * 90) + 10;
                  return (
                    <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '.65rem', color: '#6b7280' }}>{d.count}</span>
                      <div style={{ width: '100%', height: `${h}px`, background: '#22c55e', borderRadius: '4px 4px 0 0', opacity: .8 }} />
                      <span style={{ fontSize: '.65rem', color: '#6b7280' }}>{d.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div style={card}>
          <div style={ch}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Recent Bookings</h3>
            <Link to="/franchise/bookings" style={{ padding: '.35rem .9rem', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: '#9ca3af', fontSize: '.78rem', textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr>{['Customer', 'Vehicle', 'Service Type', 'Status', 'Date'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recentServices.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#4b5563', padding: '2rem' }}>No bookings yet</td></tr>
                ) : (
                  recentServices.map((s) => {
                    const sm = STATUS_MAP[s.status] || { label: s.status };
                    const sc = scColors[s.status] || '#6b7280';
                    return (
                      <tr key={s._id}>
                        <td style={{ padding: '.55rem 1.25rem', color: '#e2e8f0', fontWeight: 600 }}>
                          {s.owner?.name || '—'}
                          <div style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 400 }}>{s.owner?.phone}</div>
                        </td>
                        <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af' }}>
                          {s.vehicle?.registrationNumber || '—'}
                          <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{s.vehicle?.make} {s.vehicle?.model}</div>
                        </td>
                        <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>{s.serviceType}</td>
                        <td style={{ padding: '.55rem 1.25rem' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: sc, background: `${sc}18`, border: `1px solid ${sc}40` }}>{sm.label}</span>
                        </td>
                        <td style={{ padding: '.55rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
