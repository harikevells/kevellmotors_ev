import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminAPI } from '../../api';

const STATUS_STYLE = {
  pending:  { background: 'rgba(245,158,11,0.12)', color: '#f59e0b',  border: '1px solid rgba(245,158,11,0.3)' },
  approved: { background: 'rgba(34,197,94,0.12)',  color: '#22c55e',  border: '1px solid rgba(34,197,94,0.3)' },
  rejected: { background: 'rgba(239,68,68,0.12)',  color: '#ef4444',  border: '1px solid rgba(239,68,68,0.3)' },
};

export default function AdminFranchiseWalletPage() {
  const [requests, setRequests]   = useState([]);
  const [balances, setBalances]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter]       = useState('all');
  const [tab, setTab]             = useState('requests'); // 'requests' | 'balances'

  const load = () => {
    setLoading(true);
    Promise.all([
      adminAPI.getRedeemRequests().then((r) => setRequests(r.data.requests || [])),
      adminAPI.getWalletBalances().then((r) => setBalances(r.data.balances || [])),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (franchiseId, txId, action) => {
    setProcessing(txId);
    try {
      await adminAPI.processRedeemRequest(franchiseId, txId, { action });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === txId
            ? { ...r, status: action === 'approve' ? 'approved' : 'rejected', processedAt: new Date().toISOString() }
            : r
        )
      );
      // Refresh balances too so pendingBalance updates
      adminAPI.getWalletBalances().then((r) => setBalances(r.data.balances || []));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const th   = { padding: '.65rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px' };
  const ch   = { padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

  const pendingCount   = requests.filter((r) => r.status === 'pending').length;
  const totalPending   = requests.filter((r) => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  const totalApproved  = requests.filter((r) => r.status === 'approved').reduce((s, r) => s + r.amount, 0);
  const totalAvailable = balances.reduce((s, b) => s + b.pendingBalance, 0);
  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {/* Header */}
        <AdminPageHeader title="Franchise Wallets" subtitle="View balances and process commission payouts" />

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Available Balance', value: `₹${totalAvailable.toLocaleString('en-IN')}`, sub: `across ${balances.filter(b => b.pendingBalance > 0).length} franchises`, color: '#22c55e', icon: '💰' },
            { label: 'Pending Requests',         value: pendingCount, sub: `₹${totalPending.toLocaleString('en-IN')} awaiting`, color: '#f59e0b', icon: '⏳' },
            { label: 'Total Requested',          value: requests.length, sub: `all time`, color: '#0ea5e9', icon: '📤' },
            { label: 'Total Approved',           value: `₹${totalApproved.toLocaleString('en-IN')}`, sub: `${requests.filter(r => r.status === 'approved').length} approved`, color: '#8b5cf6', icon: '✅' },
          ].map(({ label, value, sub, color, icon }) => (
            <div key={label} style={{ ...card, borderLeft: `4px solid ${color}`, padding: '1.25rem' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '.35rem' }}>{icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '.25rem' }}>{label}</div>
              <div style={{ fontSize: '.7rem', color: '#4b5563', marginTop: '.2rem' }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem', alignItems: 'center' }}>
          {[['requests', '📤 Redeem Requests'], ['balances', '💰 Franchise Balances']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? 'linear-gradient(135deg,#6366f1,#06b6d4)' : 'rgba(255,255,255,0.05)',
              border: tab === key ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '.35rem 1rem', color: tab === key ? '#fff' : '#9ca3af',
              fontSize: '.8rem', fontWeight: tab === key ? 700 : 500, cursor: 'pointer',
            }}>
              {label}{key === 'requests' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          ))}
          <button onClick={load} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '.35rem .9rem', color: '#9ca3af', fontSize: '.78rem', cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        {/* ── REDEEM REQUESTS TAB ── */}
        {tab === 'requests' && (
          <>
            {/* Filter sub-tabs */}
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
              {['all', 'pending', 'approved', 'rejected'].map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter === f ? 'rgba(99,102,241,0.2)' : 'transparent',
                  border: `1px solid ${filter === f ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 8, padding: '.25rem .75rem', color: filter === f ? '#a5b4fc' : '#6b7280',
                  fontSize: '.75rem', fontWeight: filter === f ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize',
                }}>
                  {f}{f === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
                </button>
              ))}
            </div>

            <div style={card}>
              <div style={ch}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Redemption Requests</h3>
                <span style={{ fontSize: '.78rem', color: '#4b5563' }}>{filtered.length} request{filtered.length !== 1 ? 's' : ''}</span>
              </div>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                  <div style={{ width: 36, height: 36, border: '4px solid rgba(99,102,241,.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem', color: '#4b5563' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>💳</div>
                  <p>No {filter !== 'all' ? filter : ''} redemption requests</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                    <thead>
                      <tr>{['Franchise', 'Contact', 'Amount', 'Note', 'Requested', 'Status', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                          <td style={{ padding: '.65rem 1.25rem' }}>
                            <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{r.franchiseName}</div>
                            <div style={{ color: '#4b5563', fontSize: '.72rem', fontFamily: 'monospace' }}>ID: {r.franchiseId?.toString().slice(-6).toUpperCase()}</div>
                          </td>
                          <td style={{ padding: '.65rem 1.25rem' }}>
                            <div style={{ color: '#9ca3af', fontSize: '.78rem' }}>{r.franchiseEmail}</div>
                            <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{r.franchisePhone}</div>
                          </td>
                          <td style={{ padding: '.65rem 1.25rem', fontWeight: 800, color: '#f59e0b', fontSize: '.95rem' }}>
                            ₹{(r.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '.65rem 1.25rem', color: '#6b7280', maxWidth: '200px' }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note || '—'}</div>
                          </td>
                          <td style={{ padding: '.65rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-IN') : new Date(r.createdAt).toLocaleDateString('en-IN')}
                          </td>
                          <td style={{ padding: '.65rem 1.25rem' }}>
                            <span style={{ ...STATUS_STYLE[r.status], borderRadius: '999px', padding: '.2rem .7rem', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize' }}>
                              {r.status}
                            </span>
                            {r.processedAt && (
                              <div style={{ color: '#4b5563', fontSize: '.68rem', marginTop: '.2rem' }}>
                                {new Date(r.processedAt).toLocaleDateString('en-IN')}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '.65rem 1.25rem' }}>
                            {r.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '.4rem' }}>
                                <button
                                  disabled={processing === r._id}
                                  onClick={() => handleAction(r.franchiseId, r._id, 'approve')}
                                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 7, padding: '.35rem .8rem', color: '#22c55e', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', opacity: processing === r._id ? .6 : 1 }}
                                >
                                  {processing === r._id ? '…' : '✅ Approve'}
                                </button>
                                <button
                                  disabled={processing === r._id}
                                  onClick={() => handleAction(r.franchiseId, r._id, 'reject')}
                                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 7, padding: '.35rem .8rem', color: '#ef4444', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', opacity: processing === r._id ? .6 : 1 }}
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#4b5563', fontSize: '.78rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── FRANCHISE BALANCES TAB ── */}
        {tab === 'balances' && (
          <div style={card}>
            <div style={ch}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Franchise Wallet Balances</h3>
              <span style={{ fontSize: '.78rem', color: '#4b5563' }}>{balances.length} franchise{balances.length !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                <div style={{ width: 36, height: 36, border: '4px solid rgba(99,102,241,.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
              </div>
            ) : balances.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem', color: '#4b5563' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🏦</div>
                <p>No franchise wallet data found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                  <thead>
                    <tr>{['Franchise', 'Contact', 'Available to Redeem', 'Total Redeemed', 'Payments Confirmed', 'Status'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {balances.map((b) => (
                      <tr key={b.franchiseId} style={{ borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                        <td style={{ padding: '.65rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{b.franchiseName}</div>
                          <div style={{ color: '#4b5563', fontSize: '.72rem', fontFamily: 'monospace' }}>ID: {b.franchiseId?.toString().slice(-6).toUpperCase()}</div>
                        </td>
                        <td style={{ padding: '.65rem 1.25rem' }}>
                          <div style={{ color: '#9ca3af', fontSize: '.78rem' }}>{b.franchiseEmail}</div>
                          <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{b.franchisePhone}</div>
                        </td>
                        <td style={{ padding: '.65rem 1.25rem' }}>
                          <span style={{ fontWeight: 800, color: b.pendingBalance > 0 ? '#22c55e' : '#4b5563', fontSize: '.95rem' }}>
                            ₹{(b.pendingBalance || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '.65rem 1.25rem', fontWeight: 700, color: '#0ea5e9' }}>
                          ₹{(b.totalRedeemed || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '.65rem 1.25rem', color: '#9ca3af', textAlign: 'center' }}>
                          {b.creditCount} payment{b.creditCount !== 1 ? 's' : ''}
                        </td>
                        <td style={{ padding: '.65rem 1.25rem' }}>
                          <span style={{
                            background: b.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                            color: b.status === 'active' ? '#22c55e' : '#ef4444',
                            border: `1px solid ${b.status === 'active' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            borderRadius: '999px', padding: '.2rem .7rem', fontSize: '.72rem', fontWeight: 700, textTransform: 'capitalize',
                          }}>
                            {b.status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
