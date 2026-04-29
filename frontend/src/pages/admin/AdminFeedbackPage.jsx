import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { feedbackAPI } from '../../api';

function Stars({ value = 0 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 16 16" width="13" height="13">
          <polygon
            points="8,1 10,6 15,6 11,9.5 12.5,15 8,12 3.5,15 5,9.5 1,6 6,6"
            fill={i < value ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}
            stroke={i < value ? '#38bdf8' : 'rgba(255,255,255,0.12)'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

const CAT_COLOR = { service: '#0EA5E9', app: '#a855f7', staff: '#22c55e', general: '#f59e0b' };

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [responding, setResponding] = useState(null);
  const [response, setResponse] = useState('');
  const [saving, setSaving]     = useState(false);

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical' };

  const load = () => feedbackAPI.allFeedback().then((r) => setFeedback(r.data.feedback)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleRespond = async (id) => {
    setSaving(true);
    try { await feedbackAPI.respond(id, { response }); setResponding(null); setResponse(''); load(); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>Feedback Collections</h1>
          <p style={{ color: '#6b7280', fontSize: '.83rem', marginTop: '.25rem' }}>{feedback.length} response{feedback.length !== 1 ? 's' : ''} received</p>
        </div>

        {feedback.length === 0 ? (
          <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#4b5563' }}>No feedback received yet</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '1rem' }}>
            {feedback.map((fb) => {
              const catColor = CAT_COLOR[fb.category] || '#6b7280';
              return (
                <div key={fb._id} style={{ ...card, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                  {/* Top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '.9rem' }}>{fb.user?.name}</div>
                      <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{fb.user?.email}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <Stars value={fb.rating} />
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600, color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}40`, textTransform: 'capitalize' }}>{fb.category}</span>
                    </div>
                  </div>

                  {fb.comment && <p style={{ fontSize: '.82rem', color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>{fb.comment}</p>}

                  {fb.adminResponse && (
                    <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 8, padding: '.75rem', fontSize: '.8rem', color: '#7dd3fc' }}>
                      <strong style={{ color: '#0EA5E9' }}>Your Response:</strong> {fb.adminResponse}
                    </div>
                  )}

                  {responding === fb._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      <textarea rows={3} style={inp} value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Write your response..." />
                      <div style={{ display: 'flex', gap: '.5rem' }}>
                        <button onClick={() => handleRespond(fb._id)} disabled={saving} style={{ background: '#1a6ef7', border: 'none', borderRadius: 7, padding: '.4rem 1rem', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '.8rem' }}>
                          {saving ? '…' : 'Send'}
                        </button>
                        <button onClick={() => setResponding(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.4rem 1rem', color: '#9ca3af', cursor: 'pointer', fontSize: '.8rem' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '.72rem', color: '#4b5563' }}>{new Date(fb.createdAt).toLocaleDateString('en-GB')}</span>
                      <button onClick={() => { setResponding(fb._id); setResponse(fb.adminResponse || ''); }}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.3rem .85rem', color: '#9ca3af', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600 }}>
                        {fb.adminResponse ? 'Edit Response' : '↩ Respond'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
