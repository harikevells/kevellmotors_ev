import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { feedAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const TYPE_ICONS = { post: '📝', offer: '🎉', news: '📰', tip: '💡', announcement: '📢' };
const TYPE_COLORS = {
  offer: { bg: 'rgba(249,115,22,.18)', color: '#fb923c' },
  announcement: { bg: 'rgba(239,68,68,.18)', color: '#f87171' },
  news: { bg: 'rgba(99,102,241,.18)', color: '#818cf8' },
  tip: { bg: 'rgba(34,197,94,.18)', color: '#4ade80' },
  post: { bg: 'rgba(100,116,139,.18)', color: '#94a3b8' },
};

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', type: 'post', targetAudience: 'all' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    const params = {};
    if (type) params.type = type;
    feedAPI.list(params).then((r) => setPosts(r.data.posts)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [type]);

  const handleLike = async (id) => {
    await feedAPI.like(id);
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await feedAPI.create(fd);
      setShowCreate(false);
      setForm({ title: '', content: '', type: 'post', targetAudience: 'all' });
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post?')) return;
    await feedAPI.remove(id);
    load();
  };

  if (loading) return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content"><Spinner /></div>
    </div>
  );

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader title="⚡ EV Feed" subtitle="Latest updates, offers & announcements" />

        {/* Type filter tabs */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['', 'post', 'offer', 'news', 'tip', 'announcement'].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '.4rem 1rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '.8rem',
                fontWeight: 600,
                background: type === t ? '#06b6d4' : 'rgba(99,102,241,.12)',
                color: type === t ? '#000' : '#94a3b8',
                transition: 'all .2s',
              }}
            >
              {t ? `${TYPE_ICONS[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}` : '🌐 All'}
            </button>
          ))}
        </div>

        {/* Create post (admin/franchise) */}
        {(user?.role === 'admin' || user?.role === 'franchise') && (
          <div style={{ marginBottom: '1.5rem' }}>
            {!showCreate ? (
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create Post</button>
            ) : (
              <div style={{ background: '#0d0e2b', border: '1px solid rgba(99,102,241,.3)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#e2e8f0' }}>New Post</h3>
                  <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.3rem', fontSize: '.8rem', color: '#94a3b8' }}>Type</label>
                      <select
                        style={{ width: '100%', background: '#06071a', color: '#e2e8f0', border: '1px solid rgba(99,102,241,.3)', borderRadius: '8px', padding: '.5rem .75rem' }}
                        value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      >
                        {['post', 'offer', 'news', 'tip', 'announcement'].map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.3rem', fontSize: '.8rem', color: '#94a3b8' }}>Audience</label>
                      <select
                        style={{ width: '100%', background: '#06071a', color: '#e2e8f0', border: '1px solid rgba(99,102,241,.3)', borderRadius: '8px', padding: '.5rem .75rem' }}
                        value={form.targetAudience} onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value }))}
                      >
                        {['all', 'subscribers', 'franchise'].map((t) => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.3rem', fontSize: '.8rem', color: '#94a3b8' }}>Title</label>
                    <input
                      style={{ width: '100%', background: '#06071a', color: '#e2e8f0', border: '1px solid rgba(99,102,241,.3)', borderRadius: '8px', padding: '.5rem .75rem', boxSizing: 'border-box' }}
                      value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Post title..."
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.3rem', fontSize: '.8rem', color: '#94a3b8' }}>Content *</label>
                    <textarea
                      rows={4} required
                      style={{ width: '100%', background: '#06071a', color: '#e2e8f0', border: '1px solid rgba(99,102,241,.3)', borderRadius: '8px', padding: '.5rem .75rem', resize: 'vertical', boxSizing: 'border-box' }}
                      value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Write your post..."
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
                    {saving ? 'Posting...' : 'Publish Post'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Posts list */}
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#0d0e2b', borderRadius: '12px', border: '1px solid rgba(99,102,241,.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
            <p style={{ color: '#64748b' }}>No posts yet. Check back later!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {posts.map((post) => {
              const tc = TYPE_COLORS[post.type] || TYPE_COLORS.post;
              return (
                <div key={post._id} style={{
                  background: '#0d0e2b',
                  border: post.isPinned ? '1px solid #06b6d4' : '1px solid rgba(99,102,241,.2)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(99,102,241,.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '.9rem', color: '#818cf8',
                      }}>
                        {post.author?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{post.author?.name}</div>
                        <div style={{ fontSize: '.75rem', color: '#64748b' }}>{new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexShrink: 0 }}>
                      {post.isPinned && (
                        <span style={{ fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(6,182,212,.15)', color: '#22d3ee', letterSpacing: '.06em' }}>📌 PINNED</span>
                      )}
                      <span style={{
                        fontSize: '.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                        background: tc.bg, color: tc.color, letterSpacing: '.06em', textTransform: 'uppercase',
                      }}>
                        {TYPE_ICONS[post.type]} {post.type}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  {post.title && <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#f1f5f9', marginBottom: '.4rem' }}>{post.title}</div>}
                  <p style={{ color: '#94a3b8', lineHeight: 1.65, margin: 0 }}>{post.content}</p>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '.75rem', borderTop: '1px solid rgba(99,102,241,.1)' }}>
                    <button
                      onClick={() => user && handleLike(post._id)}
                      style={{
                        background: 'none', border: '1px solid rgba(99,102,241,.25)', borderRadius: '999px',
                        padding: '.3rem .9rem', cursor: 'pointer', color: '#94a3b8', fontSize: '.85rem',
                        transition: 'all .2s',
                      }}
                    >
                      ♥ {post.likeCount || 0}
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(post._id)}
                        style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.3rem .8rem', cursor: 'pointer', color: '#f87171', fontSize: '.8rem' }}
                      >
                        Delete
                      </button>
                    )}
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
