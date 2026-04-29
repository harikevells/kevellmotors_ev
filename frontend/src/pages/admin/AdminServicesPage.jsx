import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { adminAPI, serviceAPI, franchiseAPI } from '../../api';

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

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl  = { fontSize: '.73rem', color: '#6b7280', display: 'block', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.5px' };
  const th   = { padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };

  const filterBtn = (on) => ({
    padding: '.35rem .9rem', borderRadius: 20, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer',
    background: on ? '#0EA5E9' : 'rgba(255,255,255,0.05)',
    border: on ? '1px solid #0EA5E9' : '1px solid rgba(255,255,255,0.1)',
    color: on ? '#fff' : '#9ca3af', transition: 'all .15s', textTransform: 'capitalize',
  });

  const load = () => {
    const params = {};
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

  return (
    <div style={bg}>
      <AdminSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Service Management</h1>
          <p style={{ color: '#6b7280', fontSize: '.83rem', marginTop: '.25rem' }}>Monitor and update all service bookings</p>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button style={filterBtn(!status)} onClick={() => setStatus('')}>All</button>
          {STATUSES.map((s) => (
            <button key={s} style={filterBtn(status === s)} onClick={() => setStatus(s)}>{s.replace(/_/g, ' ')}</button>
          ))}
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
                {services.map((s, idx) => (
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
                        : <span style={{ fontSize: '.78rem', color: '#f59e0b', fontWeight: 600 }}>⚠ Unassigned</span>
                      }
                    </td>
                    <td style={{ padding: '.8rem 1.25rem' }}><SvcBadge status={s.status} /></td>
                    <td style={{ padding: '.8rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(s.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '.8rem 1.25rem' }}>
                      <button onClick={() => { setSelected(s); setUpdateForm({ status: s.status, note: '' }); }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.35rem .85rem', color: '#9ca3af', fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {services.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No services found</div>}
          </div>
        </div>

      </div>
    </div>
  );
}
