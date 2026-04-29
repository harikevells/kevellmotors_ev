import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { paymentAPI } from '../../api';

const PAY_CFG = {
  success:  { label: 'Success',  color: '#02FF7F' },
  failed:   { label: 'Failed',   color: '#ef4444' },
  refunded: { label: 'Refunded', color: '#0EA5E9' },
  pending:  { label: 'Pending',  color: '#f59e0b' },
};

function PayBadge({ status }) {
  const cfg = PAY_CFG[status] || { label: status || '—', color: '#6b7280' };
  return (
    <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [status, setStatus]     = useState('');
  const [refunding, setRefunding] = useState(null);
  const [total, setTotal]       = useState(0);

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const th   = { padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };

  const load = () => {
    const params = {};
    if (status) params.status = status;
    paymentAPI.listAll(params)
      .then((r) => { setPayments(r.data.payments); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const handleRefund = async (id) => {
    if (!confirm('Issue full refund?')) return;
    setRefunding(id);
    try { await paymentAPI.refund(id, {}); load(); }
    catch (err) { alert(err.response?.data?.message || 'Refund failed'); }
    finally { setRefunding(null); }
  };

  const filterBtn = (on) => ({
    padding: '.35rem .9rem', borderRadius: 20, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
    background: on ? '#0EA5E9' : 'rgba(255,255,255,0.05)',
    border: on ? '1px solid #0EA5E9' : '1px solid rgba(255,255,255,0.1)',
    color: on ? '#fff' : '#9ca3af', transition: 'all .15s',
  });

  if (loading) return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );

  const revenue = payments.filter(p => p.status === 'success').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Payment Management</h1>
          <p style={{ color: '#6b7280', fontSize: '.83rem', marginTop: '.25rem' }}>
            {total} transactions · Revenue: <span style={{ color: '#02FF7F', fontWeight: 700 }}>₹{revenue.toLocaleString()}</span>
          </p>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['', 'success', 'failed', 'refunded', 'pending'].map((s) => (
            <button key={s} style={filterBtn(status === s)} onClick={() => setStatus(s)}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr>
                  {['Date', 'Customer', 'For', 'Amount', 'Status', 'Reference', 'Action'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p._id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                  >
                    <td style={{ padding: '.8rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {p.user?.name}
                      <div style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 400 }}>{p.user?.email}</div>
                    </td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>
                      {p.paymentFor?.replace(/_/g, ' ')}
                      <div style={{ fontSize: '.68rem', color: '#4b5563' }}>{p.source || 'payment'}</div>
                    </td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#02FF7F', fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}><PayBadge status={p.status} /></td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#4b5563', fontSize: '.72rem', fontFamily: 'monospace' }}>
                      {p.razorpayPaymentId || p.orderId || p.invoiceNumber || '—'}
                    </td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      {p.status === 'success' && p.source !== 'invoice' && (
                        <button onClick={() => handleRefund(p._id)} disabled={refunding === p._id}
                          style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', borderRadius: 7, padding: '.3rem .75rem', color: '#ef4444', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600 }}>
                          {refunding === p._id ? '…' : 'Refund'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No payments found</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
