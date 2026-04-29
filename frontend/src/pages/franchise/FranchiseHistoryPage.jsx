import { useEffect, useState } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function FranchiseHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const { user } = useAuth();

  const load = (p) => {
    setLoading(true);
    franchisePortalAPI.getHistory({ period: p })
      .then((r) => setHistory(r.data.history || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(period); }, [period]);

  const total = history.reduce((s, h) => s + (h.finalAmount || 0), 0);

  const bg      = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card    = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const th      = { padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px' };
  const btnOn   = { background: '#0EA5E9', border: '1px solid #0EA5E9', borderRadius: 20, padding: '.35rem .9rem', color: '#fff', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' };
  const btnOff  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '.35rem .9rem', color: '#9ca3af', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer' };

  return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Service History</h1>
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
        {/* Period filter */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
          {PERIODS.map((p) => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={period === p.key ? btnOn : btnOff}>{p.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}><div style={{ width: 36, height: 36, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
            <div style={{ fontSize: '3rem' }}>📋</div>
            <p style={{ marginTop: '.5rem' }}>No completed services for this period</p>
          </div>
        ) : (
          <div style={card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr>{['ID', 'Customer', 'Vehicle', 'Service Type', 'Amount', 'Completed'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td style={{ padding: '.55rem 1.25rem', fontFamily: 'monospace', fontSize: '.8rem', color: '#6b7280' }}>{h._id.toString().slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '.55rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{h.owner?.name || '—'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{h.owner?.phone}</div>
                      </td>
                      <td style={{ padding: '.55rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{h.vehicle?.registrationNumber || '—'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{h.vehicle?.make} {h.vehicle?.model}</div>
                      </td>
                      <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>{h.serviceType}</td>
                      <td style={{ padding: '.55rem 1.25rem', fontWeight: 700, color: '#22c55e' }}>{h.finalAmount ? `₹${h.finalAmount.toLocaleString('en-IN')}` : '—'}</td>
                      <td style={{ padding: '.55rem 1.25rem', color: '#6b7280' }}>{h.completedDate ? new Date(h.completedDate).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
