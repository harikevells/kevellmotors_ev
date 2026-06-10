import { useEffect, useState } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { adminAPI, feedAPI } from '../../api';

export default function AdminFeedManagePage() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState('feed');
  const [form, setForm]     = useState({ title: '', content: '', type: 'post', expiresAt: '', isPinned: false });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]   = useState('');

  const bg   = { background: '#06071a', color: '#e2e8f0', minHeight: '100vh', display: 'flex' };
  const card = { background: '#0d0e2b', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 };
  const inp  = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '.55rem .85rem', color: '#e2e8f0', fontSize: '.85rem', outline: 'none', width: '100%', boxSizing: 'border-box' };
  const lbl  = { fontSize: '.73rem', color: '#6b7280', display: 'block', marginBottom: '.3rem', textTransform: 'uppercase', letterSpacing: '.5px' };
  const th   = { padding: '.75rem 1.25rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 700, color: '#4b5563', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap' };

  const load = () => feedAPI.list({ page: 1, limit: 50 }).then((r) => setPosts(r.data.posts)).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      if (tab === 'offer') {
        await adminAPI.pushOffer({ ...form, type: 'offer' });
      } else {
        await adminAPI.pushFeed({ ...form, type: 'announcement' });
      }
      setSuccess(`${tab === 'offer' ? 'Offer' : 'Announcement'} published!`);
      setForm({ title: '', content: '', type: 'post', expiresAt: '', isPinned: false });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await feedAPI.remove(id);
    load();
  };

  const handlePin = async (post) => {
    await feedAPI.update(post._id, { isPinned: !post.isPinned });
    load();
  };

  const tabBtn = (on) => ({
    padding: '.4rem 1.1rem', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, cursor: 'pointer',
    background: on ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
    border: on ? '1px solid rgba(0,229,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
    color: on ? '#00e5ff' : '#6b7280', transition: 'all .15s',
  });

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
        <AdminPageHeader title="Live Push Feed" subtitle="Manage and broadcast updates to franchise and user dashboards" />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem' }}>
          <button style={tabBtn(tab === 'feed')}   onClick={() => setTab('feed')}>📢 Push Announcement</button>
          <button style={tabBtn(tab === 'offer')}  onClick={() => setTab('offer')}>🎉 Push Offer</button>
          <button style={tabBtn(tab === 'manage')} onClick={() => setTab('manage')}>📋 Manage Posts</button>
        </div>

        {/* Publish Form */}
        {(tab === 'feed' || tab === 'offer') && (
          <div style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#e2e8f0', marginBottom: '1.25rem' }}>
              {tab === 'offer' ? '🎉 Create Offer' : '📢 Create Announcement'}
            </div>
            {success && <div style={{ background: 'rgba(2,255,127,0.1)', border: '1px solid rgba(2,255,127,0.3)', color: '#02FF7F', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.85rem' }}>{success}</div>}
            {error   && <div style={{ background: 'rgba(239,68,68,0.1)',  border: '1px solid rgba(239,68,68,0.3)',  color: '#ef4444', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.85rem' }}>{error}</div>}
            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={lbl}>Title</label>
                <input style={inp} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={tab === 'offer' ? 'Summer EV Service Offer!' : 'Important Announcement'} />
              </div>
              <div>
                <label style={lbl}>Content *</label>
                <textarea style={{ ...inp, resize: 'vertical' }} rows={4} required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder={tab === 'offer' ? 'Get 20% off on all battery services this month!' : 'We are expanding our service network...'} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                <div>
                  <label style={lbl}>Expires At</label>
                  <input type="date" style={inp} value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#9ca3af', fontSize: '.83rem', cursor: 'pointer', paddingBottom: '.55rem' }}>
                  <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} style={{ accentColor: '#00e5ff' }} />
                  Pin to top
                </label>
              </div>
              <div>
                <button type="submit" disabled={saving} style={{ background: '#1a6ef7', border: 'none', borderRadius: 8, padding: '.6rem 1.75rem', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '.88rem' }}>
                  {saving ? 'Publishing…' : `Publish ${tab === 'offer' ? 'Offer' : 'Announcement'}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Posts Table */}
        {tab === 'manage' && (
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
                <thead>
                  <tr>{['Title', 'Type', 'Author', 'Likes', 'Date', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {posts.map((p, idx) => (
                    <tr key={p._id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,229,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 !== 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                    >
                      <td style={{ padding: '.8rem 1.25rem', color: '#e2e8f0', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title || <span style={{ color: '#6b7280', fontWeight: 400 }}>{p.content?.slice(0, 40)}…</span>}
                        {p.isPinned && <span style={{ marginLeft: 6, fontSize: '.7rem' }}>📌</span>}
                      </td>
                      <td style={{ padding: '.8rem 1.25rem' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 600, color: '#0EA5E9', background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.3)', textTransform: 'capitalize' }}>{p.type}</span>
                      </td>
                      <td style={{ padding: '.8rem 1.25rem', color: '#9ca3af' }}>{p.author?.name}</td>
                      <td style={{ padding: '.8rem 1.25rem', color: '#6b7280' }}>♥ {p.likeCount}</td>
                      <td style={{ padding: '.8rem 1.25rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding: '.8rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '.4rem' }}>
                          <button onClick={() => handlePin(p)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '.3rem .75rem', color: '#9ca3af', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600 }}>
                            {p.isPinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button onClick={() => handleDelete(p._id)} style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 7, padding: '.3rem .75rem', color: '#ef4444', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {posts.length === 0 && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#4b5563' }}>No posts yet</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
