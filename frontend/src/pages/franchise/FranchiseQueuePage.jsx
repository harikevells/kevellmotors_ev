import { useEffect, useState } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = {
  onboarded:     'badge-info',
  diagnosis:     'badge-warning',
  in_progress:   'badge-secondary',
  waiting_parts: 'badge-warning',
  quality_check: 'badge-secondary',
};

const STATUS_LABEL = {
  onboarded:     'New',
  diagnosis:     'Accepted',
  in_progress:   'In Service',
  waiting_parts: 'Waiting Parts',
  quality_check: 'QC',
};

export default function FranchiseQueuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const { user } = useAuth();

  const load = () => {
    setLoading(true);
    franchisePortalAPI.getQueue()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const advance = async (id, currentStatus) => {
    const nextMap = { onboarded: 'diagnosis', diagnosis: 'in_progress', in_progress: 'quality_check', quality_check: 'delivered' };
    const next = nextMap[currentStatus];
    if (!next) return;
    setUpdating(id);
    try { await franchisePortalAPI.updateBookingStatus(id, { status: next }); load(); }
    catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };
  const scColors = { onboarded: '#1a6ef7', diagnosis: '#00e5ff', in_progress: '#f59e0b', waiting_parts: '#ff9100', quality_check: '#a855f7', delivered: '#22c55e', cancelled: '#ef4444' };

  if (loading) return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  const { queue = [], capacity = 0, occupied = 0, availableSlots = 0 } = data || {};
  const pct = capacity ? Math.round((occupied / capacity) * 100) : 0;
  const capColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e';

  return (
    <div className="layout user-dark">
      <FranchiseSidebar />
      <div className="main-content" style={{ padding: '1.5rem 2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Vehicle Queue</h1>
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

        {/* Capacity banner */}
        <div style={{ ...card, borderLeft: `4px solid ${capColor}`, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: capColor }}>{occupied}</span>
              <span style={{ color: '#6b7280', fontSize: '1rem' }}> / {capacity} vehicles</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '1rem' }}>{availableSlots} slots free</div>
              <div style={{ color: '#6b7280', fontSize: '.8rem' }}>today's capacity</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: capColor }} />
          </div>
        </div>

        {/* Queue list */}
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}>
            <div style={{ fontSize: '3rem' }}>🚗</div>
            <p style={{ marginTop: '.5rem' }}>No vehicles in queue today</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {queue.map((item, idx) => {
              const sc = scColors[item.status] || '#6b7280';
              return (
                <div key={item._id} className="list-row-item" style={{ ...card, borderLeft: '4px solid #0ea5e9', transition: 'all 0.2s ease' }}>
                  <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>#{idx + 1}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{item.vehicle?.registrationNumber || '—'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{item.vehicle?.make} {item.vehicle?.model}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{item.owner?.name}</div>
                      <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{item.owner?.phone}</div>
                    </div>
                    <div style={{ textTransform: 'capitalize', color: '#9ca3af' }}>{item.serviceType}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: sc, background: `${sc}18`, border: `1px solid ${sc}40` }}>{STATUS_LABEL[item.status] || item.status}</span>
                    <button
                      disabled={updating === item._id}
                      onClick={() => advance(item._id, item.status)}
                      style={{ background: '#1a6ef7', border: 'none', borderRadius: 7, padding: '.4rem .9rem', color: '#fff', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', opacity: updating === item._id ? .6 : 1 }}
                    >
                      {updating === item._id ? '…' : 'Advance →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
