import { useEffect, useState } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function FranchisePaymentsPage() {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const loadRevenue = () =>
    franchisePortalAPI.getRevenue()
      .then((r) => {
        console.log('Revenue data:', r.data);
        setRevenueData(r.data);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load revenue:', err);
        setError('Failed to load revenue data');
      });

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadRevenue().finally(() => setLoading(false));
  }, []);

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const th   = { padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px' };
  const ch   = { padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl  = { display: 'block', fontSize: '.78rem', fontWeight: 600, color: '#6b7280', marginBottom: '.3rem' };

  if (loading) return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (error) return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>
        <button onClick={() => { setLoading(true); loadRevenue().finally(() => setLoading(false)); }} style={{ background: '#00e5ff', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    </div>
  );

  const { revenue = {}, payments = [] } = revenueData || {};

  return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Revenue</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#1a6ef7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', color: '#fff' }}>{user?.name?.[0]?.toUpperCase() || 'F'}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '.85rem', color: '#e2e8f0' }}>{user?.name || 'Franchise'}</div>
              <div style={{ fontSize: '.7rem', color: '#6b7280' }}>Franchise</div>
            </div>
          </div>
        </div>

        {/* Revenue Content */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: "Today's Revenue", value: revenue.today || 0, icon: '📅', color: '#0ea5e9' },
                { label: 'Weekly Revenue',  value: revenue.week  || 0, icon: '📆', color: '#8b5cf6' },
                { label: 'Monthly Revenue', value: revenue.month || 0, icon: '💰', color: '#22c55e' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ ...card, borderLeft: `4px solid ${color}`, padding: '1.25rem' }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '.4rem' }}>{icon}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>₹{value.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: '.25rem' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Payments table */}
            <div style={card}>
              <div style={ch}><h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Completed Service Payments</h3></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr>{['ID', 'Service Type', 'Amount', 'Payment Status', 'Date'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#4b5563', padding: '2rem' }}>No payment records yet</td></tr>
                    ) : (
                      payments.map((p) => {
                        const ps = p.paymentStatus || 'pending';
                        const psStyle = ps === 'confirmed' ? { color: '#22c55e' } : ps === 'waived' ? { color: '#f59e0b' } : { color: '#6b7280' };
                        return (
                          <tr key={p._id}>
                            <td style={{ padding: '.55rem 1.25rem', fontFamily: 'monospace', fontSize: '.8rem', color: '#6b7280' }}>{p._id.toString().slice(-6).toUpperCase()}</td>
                            <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>{p.serviceType || '—'}</td>
                            <td style={{ padding: '.55rem 1.25rem', fontWeight: 700, color: '#22c55e' }}>₹{(p.finalAmount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '.55rem 1.25rem' }}>
                              <span style={{ ...psStyle, fontWeight: 600, fontSize: '.75rem', textTransform: 'capitalize' }}>
                                {ps === 'confirmed' ? '✅ Confirmed' : ps === 'waived' ? '🔄 Waived' : '⏳ Pending'}
                              </span>
                            </td>
                            <td style={{ padding: '.55rem 1.25rem', color: '#6b7280' }}>{p.completedDate ? new Date(p.completedDate).toLocaleDateString('en-IN') : new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
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

