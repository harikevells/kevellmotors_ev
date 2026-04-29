import { useEffect, useState } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function FranchiseCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    franchisePortalAPI.getCustomers()
      .then((r) => setCustomers(r.data.customers || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const th   = { padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px' };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', maxWidth: '260px', boxSizing: 'border-box' };

  return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Customers</h1>
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
        {/* Search */}
        <div style={{ marginBottom: '1.5rem' }}>
          <input style={{ ...inp, maxWidth: '280px' }} placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}><div style={{ width: 36, height: 36, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
            <div style={{ fontSize: '3rem' }}>👥</div>
            <p style={{ marginTop: '.5rem' }}>No customers found</p>
          </div>
        ) : (
          <div style={card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr>{['#', 'Customer', 'Phone', 'Vehicles', 'Total Visits', 'Last Service'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c._id}>
                      <td style={{ padding: '.55rem 1.25rem', color: '#6b7280' }}>{i + 1}</td>
                      <td style={{ padding: '.55rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.9rem', flexShrink: 0 }}>{c.name?.[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{c.name}</div>
                            <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '.55rem 1.25rem', color: '#9ca3af' }}>{c.phone}</td>
                      <td style={{ padding: '.55rem 1.25rem' }}>
                        {c.vehicles.map((v) => (
                          <span key={v} style={{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', borderRadius: 4, padding: '.1rem .4rem', fontSize: '.75rem', marginRight: '.25rem' }}>{v}</span>
                        ))}
                      </td>
                      <td style={{ padding: '.55rem 1.25rem' }}>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>{c.totalVisits}</span>
                        {c.totalVisits >= 5 && <span style={{ marginLeft: '.4rem', fontSize: '.7rem' }}>⭐ Loyal</span>}
                      </td>
                      <td style={{ padding: '.55rem 1.25rem', color: '#6b7280' }}>{c.lastServiceDate ? new Date(c.lastServiceDate).toLocaleDateString('en-IN') : '—'}</td>
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
