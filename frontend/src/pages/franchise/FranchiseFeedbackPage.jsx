import { useEffect, useState } from 'react';
import FranchiseSidebar from '../../components/franchise/FranchiseSidebar';
import { franchisePortalAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

function Stars({ rating }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= rating ? '#f59e0b' : '#e2e8f0', fontSize: '1.1rem' }}>★</span>
      ))}
    </span>
  );
}

export default function FranchiseFeedbackPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('reviews');
  const { user } = useAuth();

  useEffect(() => {
    franchisePortalAPI.getFeedback()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' };

  if (loading) return (
    <div style={bg}><FranchiseSidebar /><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, border: '4px solid rgba(0,229,255,.2)', borderTopColor: '#00e5ff', borderRadius: '50%', animation: 'spin .8s linear infinite' }} /></div></div>
  );

  const { reviews = [], feedbacks = [] } = data || {};
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div style={bg}>
      <FranchiseSidebar />
      <div style={{ flex: 1, padding: '1.5rem 2rem', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Feedback &amp; Ratings</h1>
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

        {/* Summary stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ ...card, borderLeft: '4px solid #f59e0b', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }}>{avgRating}</div>
            <Stars rating={Math.round(parseFloat(avgRating) || 0)} />
            <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: '.4rem' }}>Average Rating</div>
          </div>
          <div style={{ ...card, borderLeft: '4px solid #0ea5e9', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0ea5e9' }}>{reviews.length}</div>
            <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: '.25rem' }}>Total Reviews</div>
          </div>
          <div style={{ ...card, borderLeft: '4px solid #8b5cf6', padding: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6' }}>{feedbacks.length}</div>
            <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: '.25rem' }}>Service Feedbacks</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '.5rem' }}>
          {[['reviews', '⭐ Reviews'], ['feedbacks', '💬 Feedbacks']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '.35rem .85rem', fontWeight: tab === key ? 700 : 500,
              color: tab === key ? '#00e5ff' : '#6b7280',
              borderBottom: tab === key ? '2px solid #00e5ff' : '2px solid transparent',
              fontSize: '.875rem',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'reviews' ? (
          reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}><div style={{ fontSize: '3rem' }}>⭐</div><p style={{ marginTop: '.5rem' }}>No reviews yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((r) => (
                <div key={r._id} style={card}>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{r.user?.name || 'Anonymous'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      <Stars rating={r.rating} />
                    </div>
                    {r.title && <div style={{ fontWeight: 600, marginTop: '.5rem', color: '#e2e8f0' }}>{r.title}</div>}
                    <p style={{ color: '#9ca3af', marginTop: '.4rem', fontSize: '.9rem' }}>{r.comment}</p>
                    {r.isVerified && <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 10, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>✓ Verified</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          feedbacks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#4b5563' }}><div style={{ fontSize: '3rem' }}>💬</div><p style={{ marginTop: '.5rem' }}>No feedbacks yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {feedbacks.map((f) => (
                <div key={f._id} style={card}>
                  <div style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{f.service?.owner?.name || 'Customer'}</div>
                        <div style={{ color: '#6b7280', fontSize: '.8rem' }}>{new Date(f.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      <Stars rating={f.rating} />
                    </div>
                    {f.comment && <p style={{ color: '#9ca3af', marginTop: '.4rem', fontSize: '.9rem' }}>{f.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
