import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { paymentAPI } from '../../api';
import { Download } from 'lucide-react';

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

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const th   = { padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '.4rem .8rem', borderRadius: 6, fontSize: '.8rem', outline: 'none' };

  const load = () => {
    const params = { limit: 1000 };
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

  const filteredPayments = payments.filter(p => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const n = (p.user?.name || '').toLowerCase();
      const e = (p.user?.email || '').toLowerCase();
      const r = (p.razorpayPaymentId || p.orderId || p.invoiceNumber || '').toLowerCase();
      const a = String(p.amount || '');
      const s = (p.status || '').toLowerCase();
      const pf = (p.paymentFor || '').replace(/_/g, ' ').toLowerCase();
      const src = (p.source || 'payment').toLowerCase();
      const act = (p.status === 'success' && p.source !== 'invoice') ? 'refund' : '';
      
      if (!n.includes(q) && !e.includes(q) && !r.includes(q) && !a.includes(q) && !s.includes(q) && !pf.includes(q) && !src.includes(q) && !act.includes(q)) match = false;
    }
    if (startDate) {
      if (new Date(p.createdAt) < new Date(startDate)) match = false;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(p.createdAt) > endOfDay) match = false;
    }
    return match;
  });

  const revenue = filteredPayments.filter(p => p.status === 'success').reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <AdminPageHeader title="Payments" subtitle={`Total: ${filteredPayments.length} transactions · Revenue: ₹${revenue.toLocaleString()}`} />

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            {['', 'success', 'failed', 'refunded', 'pending'].map((s) => (
              <button key={s} style={filterBtn(status === s)} onClick={() => setStatus(s)}>
                {s || 'All'}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ ...inputStyle, width: '220px' }} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                style={inputStyle} 
              />
              <span style={{ color: '#6b7280' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                style={inputStyle} 
              />
              {(searchTerm || startDate || endDate) && (
                <button 
                  onClick={() => { setSearchTerm(''); setStartDate(''); setEndDate(''); }}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr>
                  {['Date', 'Customer', 'For', 'Amount', 'Status', 'Reference', 'Download', 'Action'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p, idx) => (
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
                    <td style={{ padding: '.8rem 1.25rem', textAlign: 'center' }}>
                      {p.source === 'invoice' && (
                        <button onClick={() => window.open(`http://localhost:5000/api/payments/invoice/${p.referenceId}`, '_blank')}
                          title="Print/Download Invoice"
                          style={{ background: 'rgba(14,165,233,.12)', border: '1px solid rgba(14,165,233,.4)', borderRadius: 7, padding: '.4rem .6rem', color: '#0EA5E9', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(14,165,233,.25)'; e.currentTarget.style.transform = 'scale(1.05)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(14,165,233,.12)'; e.currentTarget.style.transform = 'scale(1)' }}>
                          <Download size={15} strokeWidth={2.5} />
                        </button>
                      )}
                      {p.source !== 'invoice' && <span style={{ color: '#4b5563' }}>—</span>}
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
            {filteredPayments.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No payments found</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
