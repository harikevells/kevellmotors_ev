import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminAPI, serviceAPI, franchiseAPI } from '../../api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const STATUSES = ['onboarded', 'diagnosis', 'in_progress', 'waiting_parts', 'quality_check', 'delivered'];

const STATUS_CFG = {
  onboarded:     { label: 'On Boarded',    color: '#1a6ef7' },
  diagnosis:     { label: 'Diagnosis',     color: '#00e5ff' },
  in_progress:   { label: 'In Progress',   color: '#f59e0b' },
  waiting_parts: { label: 'Waiting Parts', color: '#ff9100' },
  quality_check: { label: 'Quality Check', color: '#a855f7' },
  delivered:     { label: 'Delivered',     color: '#22c55e' },
};

function SvcBadge({ status }) {
  const cfg = STATUS_CFG[status] || { label: status || '—', color: '#6b7280' };
  return (
    <span style={{ padding: '3px 11px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
      {cfg.label}
    </span>
  );
}

function ProgressBar({ status }) {
  const idx = STATUSES.indexOf(status);
  return (
    <div style={{ display: 'flex', gap: 3, margin: '.75rem 0' }}>
      {STATUSES.map((s, i) => (
        <div key={s} title={s.replace(/_/g, ' ')} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= idx ? (STATUS_CFG[s]?.color || '#00e5ff') : 'rgba(255,255,255,0.08)', transition: 'background .2s' }} />
      ))}
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices]         = useState([]);
  const [allFranchises, setAllFranchises] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [status, setStatus]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [updating, setUpdating]         = useState(false);
  const [updateForm, setUpdateForm]     = useState({ status: '', note: '' });
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignFranchise, setAssignFranchise] = useState('');
  const [assigning, setAssigning]       = useState(false);
  const [viewModal, setViewModal]       = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '.4rem .8rem', borderRadius: 6, fontSize: '.8rem', outline: 'none' };
  const lbl  = { fontSize: '.73rem', color: '#6b7280', display: 'block', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.5px' };
  const th   = { padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };

  const filterBtn = (on) => ({
    padding: '.35rem .9rem', borderRadius: 20, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
    background: on ? '#0EA5E9' : 'rgba(255,255,255,0.05)',
    border: on ? '1px solid #0EA5E9' : '1px solid rgba(255,255,255,0.1)',
    color: on ? '#fff' : '#9ca3af', transition: 'all .15s', textTransform: 'capitalize',
  });

  const load = () => {
    const params = { limit: 1000 };
    if (status) params.status = status;
    Promise.all([adminAPI.listServices(params), franchiseAPI.list({ status: 'active' })])
      .then(([sr, fr]) => { setServices(sr.data.services); setAllFranchises(fr.data.franchises || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const handleAssign = async (e) => {
    e.preventDefault(); setAssigning(true);
    try { await serviceAPI.assign(assignTarget._id, assignFranchise || null); setAssignTarget(null); setAssignFranchise(''); load(); }
    catch (err) { console.error(err); } finally { setAssigning(false); }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault(); setUpdating(true);
    try { await serviceAPI.updateStatus(selected._id, updateForm); setSelected(null); load(); }
    catch (err) { console.error(err); } finally { setUpdating(false); }
  };

  if (loading) return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      </div>
    </div>
  );

  const filteredServices = services.filter(s => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const n = (s.owner?.name || '').toLowerCase();
      const p = (s.owner?.phone || '').toLowerCase();
      const m = (s.vehicle?.make || '').toLowerCase();
      const mo = (s.vehicle?.model || '').toLowerCase();
      const v = (s.vehicle?.registrationNumber || '').toLowerCase();
      const type = (s.serviceType || '').toLowerCase();
      const st = (s.status || '').replace(/_/g, ' ').toLowerCase();
      const fr = (s.franchise?.name || '').toLowerCase();

      if (!n.includes(q) && !p.includes(q) && !m.includes(q) && !mo.includes(q) && !v.includes(q) && !type.includes(q) && !st.includes(q) && !fr.includes(q)) match = false;
    }
    if (startDate) {
      if (new Date(s.createdAt) < new Date(startDate)) match = false;
    }
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(s.createdAt) > endOfDay) match = false;
    }
    return match;
  });

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <AdminPageHeader title="Service Management" subtitle={`Monitor and update all service bookings (${filteredServices.length} found)`} />

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button style={filterBtn(!status)} onClick={() => setStatus('')}>All</button>
            {STATUSES.map((s) => (
              <button key={s} style={filterBtn(status === s)} onClick={() => setStatus(s)}>{s.replace(/_/g, ' ')}</button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search by customer, vehicle, status..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ ...inputStyle, width: '240px' }} 
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

        {/* Assign Panel */}
        {assignTarget && (
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1rem', borderColor: 'rgba(14,165,233,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Assign Service Centre</span>
              <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }} onClick={() => setAssignTarget(null)}>×</button>
            </div>
            <p style={{ fontSize: '.82rem', color: '#9ca3af', marginBottom: '1rem' }}>
              Assigning: <strong style={{ color: '#e2e8f0' }}>{assignTarget.serviceType}</strong> — {assignTarget.owner?.name} ({assignTarget.vehicle?.registrationNumber})
            </p>
            <form onSubmit={handleAssign} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={lbl}>Service Centre</label>
                <select style={inp} value={assignFranchise} onChange={(e) => setAssignFranchise(e.target.value)} required>
                  <option value="">Select service centre</option>
                  {allFranchises.map((f) => <option key={f._id} value={f._id}>{f.name} — {f.address?.city}</option>)}
                </select>
              </div>
              <button type="submit" disabled={assigning} style={{ background: '#1a6ef7', border: 'none', borderRadius: 8, padding: '.55rem 1.5rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </form>
          </div>
        )}

        {/* Update Status Panel */}
        {selected && (
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1rem', borderColor: 'rgba(168,85,247,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
              <span style={{ fontWeight: 700, color: '#e2e8f0' }}>Update Service Status</span>
              <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.4rem', lineHeight: 1 }} onClick={() => setSelected(null)}>×</button>
            </div>
            <p style={{ fontSize: '.82rem', color: '#9ca3af', marginBottom: '.5rem' }}>
              <strong style={{ color: '#e2e8f0' }}>{selected.vehicle?.make} {selected.vehicle?.model}</strong> — {selected.owner?.name}
            </p>
            <ProgressBar status={selected.status} />
            <form onSubmit={handleUpdateStatus} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '.75rem' }}>
              <div>
                <label style={lbl}>New Status</label>
                <select style={inp} value={updateForm.status} onChange={(e) => setUpdateForm((f) => ({ ...f, status: e.target.value }))} required>
                  <option value="">Select status</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Note</label>
                <input style={inp} value={updateForm.note} onChange={(e) => setUpdateForm((f) => ({ ...f, note: e.target.value }))} placeholder="Progress note..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <button type="submit" disabled={updating} style={{ background: '#1a6ef7', border: 'none', borderRadius: 8, padding: '.55rem 1.5rem', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
                  {updating ? 'Updating…' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Services Table */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr>{['Customer', 'Vehicle', 'Type', 'Service Centre', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredServices.map((s, idx) => (
                  <tr key={s._id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: !s.franchise ? 'rgba(245,158,11,0.04)' : idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = !s.franchise ? 'rgba(245,158,11,0.04)' : idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                  >
                    <td style={{ padding: '.8rem 1.25rem', color: '#e2e8f0', fontWeight: 600 }}>
                      {s.owner?.name}
                      <div style={{ fontSize: '.72rem', color: '#6b7280', fontWeight: 400 }}>{s.owner?.phone}</div>
                    </td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>
                      {s.vehicle?.make} {s.vehicle?.model}
                      <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{s.vehicle?.registrationNumber}</div>
                    </td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af', textTransform: 'capitalize' }}>{s.serviceType}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      {s.franchise
                        ? <span style={{ fontSize: '.83rem', color: '#9ca3af' }}>{s.franchise?.name}</span>
                        : <button onClick={() => setAssignTarget(s)} style={{ background: 'rgba(245,158,11,.1)', color: '#f59e0b', border: '1px dashed rgba(245,158,11,.4)', borderRadius: 6, padding: '4px 8px', fontSize: '.75rem', cursor: 'pointer' }}>Assign</button>
                      }
                    </td>
                    <td style={{ padding: '.8rem 1.25rem' }}><SvcBadge status={s.status} /></td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button onClick={() => setViewModal(s)}
                          style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 7, padding: '.35rem .75rem', color: '#0EA5E9', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>
                          View
                        </button>
                        <button onClick={() => { setSelected(s); setUpdateForm({ status: s.status, note: '' }); }}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.35rem .75rem', color: '#9ca3af', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredServices.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No services found</div>}
          </div>
        </div>

      </div>

      {/* View Modal */}
      {viewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem', boxSizing: 'border-box' }}>
          <div style={{ ...card, width: '100%', maxWidth: 750, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>Service Details</h2>
                <span style={{ fontSize: '.8rem', color: '#94a3b8' }}>ID: {viewModal._id}</span>
              </div>
              <button onClick={() => setViewModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer', padding: '0 .5rem' }}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '.85rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* User Details */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ margin: '0 0 .75rem 0', fontSize: '.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.5px' }}>User Details</h3>
                  <div style={{ color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    <div><strong style={{ color: '#cbd5e1' }}>Name:</strong> {viewModal.owner?.name || '—'}</div>
                    <div><strong style={{ color: '#cbd5e1' }}>Phone:</strong> {viewModal.owner?.phone || '—'}</div>
                    <div><strong style={{ color: '#cbd5e1' }}>Email:</strong> {viewModal.owner?.email || '—'}</div>
                  </div>
                </div>

                {/* Franchise Details */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ margin: '0 0 .75rem 0', fontSize: '.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.5px' }}>Service Centre Details</h3>
                  <div style={{ color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {viewModal.franchise ? (
                      <>
                        <div><strong style={{ color: '#cbd5e1' }}>Name:</strong> {viewModal.franchise?.name}</div>
                        <div><strong style={{ color: '#cbd5e1' }}>Phone:</strong> {viewModal.franchise?.phone || '—'}</div>
                        <div><strong style={{ color: '#cbd5e1' }}>Email:</strong> {viewModal.franchise?.email || '—'}</div>
                        <div><strong style={{ color: '#cbd5e1' }}>Location:</strong> {viewModal.franchise?.address?.city || '—'}</div>
                      </>
                    ) : (
                      <div style={{ color: '#f59e0b', fontStyle: 'italic' }}>Not assigned yet.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle & Service Details */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 .75rem 0', fontSize: '.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.5px' }}>Service & Vehicle Info</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', color: '#9ca3af' }}>
                  <div><strong style={{ color: '#cbd5e1' }}>Vehicle:</strong> {viewModal.vehicle?.make} {viewModal.vehicle?.model}</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Reg No:</strong> {viewModal.vehicle?.registrationNumber || '—'}</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{viewModal.serviceType}</span></div>
                  <div><strong style={{ color: '#cbd5e1' }}>Created:</strong> {new Date(viewModal.createdAt).toLocaleString('en-GB')}</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Scheduled:</strong> {viewModal.scheduledDate ? `${new Date(viewModal.scheduledDate).toLocaleDateString('en-GB')}${viewModal.scheduledTime ? ` at ${(() => {
                    let [h, m] = viewModal.scheduledTime.split(':').map(Number);
                    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
                  })()}` : ''}` : 'Not set'}</div>
                  <div style={{ gridColumn: '1/-1', marginTop: '.5rem' }}><strong style={{ color: '#cbd5e1' }}>Description:</strong> {viewModal.description || 'No description provided.'}</div>
                </div>
              </div>

              {/* Payment & Invoice Details */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: '0 0 .75rem 0', fontSize: '.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.5px' }}>Payment & Invoice</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', color: '#9ca3af' }}>
                  <div><strong style={{ color: '#cbd5e1' }}>Status:</strong> <span style={{ textTransform: 'capitalize', color: viewModal.paymentStatus === 'confirmed' ? '#22c55e' : '#f59e0b' }}>{viewModal.paymentStatus}</span></div>
                  <div><strong style={{ color: '#cbd5e1' }}>Estimated Amount:</strong> ₹{viewModal.estimatedAmount || 0}</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Final Amount:</strong> ₹{viewModal.finalAmount || 0}</div>
                  <div><strong style={{ color: '#cbd5e1' }}>Invoice No:</strong> {viewModal.invoiceNumber || '—'}</div>
                </div>
                {viewModal.invoiceItems?.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <strong style={{ color: '#cbd5e1', display: 'block', marginBottom: '.5rem' }}>Invoice Items:</strong>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 6, overflow: 'hidden' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '.5rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Item</th>
                          <th style={{ padding: '.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Qty</th>
                          <th style={{ padding: '.5rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewModal.invoiceItems.map((item, i) => (
                          <tr key={i}>
                            <td style={{ padding: '.5rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>{item.description}</td>
                            <td style={{ padding: '.5rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>{item.quantity}</td>
                            <td style={{ padding: '.5rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>₹{item.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Status updates */}
              <div>
                <h3 style={{ margin: '0 0 .75rem 0', fontSize: '.85rem', color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '.5px' }}>Progress Updates & Notes</h3>
                <ProgressBar status={viewModal.status} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '1rem' }}>
                  {viewModal.technicianNotes && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                      <strong style={{ color: '#cbd5e1' }}>Technician Notes:</strong> {viewModal.technicianNotes}
                    </div>
                  )}
                  {viewModal.progressUpdates?.map((upd, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '.75rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <SvcBadge status={upd.status} />
                        <span style={{ color: '#9ca3af', marginLeft: '1rem' }}>{upd.note || 'Status updated'}</span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '.75rem' }}>{new Date(upd.updatedAt).toLocaleString('en-GB')}</div>
                    </div>
                  ))}
                  {(!viewModal.progressUpdates || viewModal.progressUpdates.length === 0) && !viewModal.technicianNotes && (
                    <div style={{ color: '#6b7280', fontStyle: 'italic' }}>No updates or notes available.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
