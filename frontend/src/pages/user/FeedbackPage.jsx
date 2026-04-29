import { useEffect, useState } from 'react';
import UserSidebar from '../../components/user/UserSidebar';
import UserPageHeader from '../../components/user/UserPageHeader';
import Spinner from '../../components/common/Spinner';
import { StarRating } from '../../components/common/UI';
import { feedbackAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const CATEGORIES = ['service', 'app', 'staff', 'general'];

const catStyle = (c) =>
  ({
    service: { bg: 'rgba(0,229,255,.12)', color: '#00e5ff' },
    app:     { bg: 'rgba(139,92,246,.15)', color: '#a78bfa' },
    staff:   { bg: 'rgba(34,197,94,.12)',  color: '#4ade80' },
    general: { bg: 'rgba(251,146,60,.12)', color: '#fb923c' },
  }[c] || { bg: 'rgba(255,255,255,.08)', color: '#94a3b8' });

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    padding: '1.1rem 1.25rem',
    marginBottom: '.75rem',
    transition: 'border-color .2s',
  },
  label: {
    display: 'block',
    fontSize: '.72rem',
    fontWeight: 700,
    color: '#64748b',
    marginBottom: '.3rem',
    textTransform: 'uppercase',
    letterSpacing: '.06em',
  },
  input: {
    width: '100%',
    background: '#06071a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    padding: '.5rem .75rem',
    fontSize: '.875rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '.9rem',
    padding: '.2rem .3rem',
    borderRadius: '6px',
    lineHeight: 1,
    transition: 'background .15s',
  },
};

// ─── FeedbackCard ────────────────────────────────────────────────────────────
function FeedbackCard({ fb, onUpdated, onDeleted }) {
  const [editing, setEditing]     = useState(false);
  const [form, setForm]           = useState({ rating: fb.rating, comment: fb.comment || '', category: fb.category });
  const [saving, setSaving]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr]             = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('rating', form.rating);
      fd.append('comment', form.comment);
      const res = await feedbackAPI.update(fb._id, fd);
      onUpdated(res.data.feedback);
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    try { await feedbackAPI.remove(fb._id); onDeleted(fb._id); } catch {}
  };

  const svc = fb.service;
  const svcType = svc?.serviceType ? svc.serviceType.charAt(0).toUpperCase() + svc.serviceType.slice(1) + ' Service' : null;
  const svcDate = svc?.scheduledDate ? new Date(svc.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const svcQuery = svc?.description || null;

  if (editing) {
    return (
      <div style={{ ...S.card, border: '1px solid rgba(0,229,255,.25)' }}>
        <p style={{ margin: '0 0 .9rem', fontWeight: 600, color: '#00e5ff', fontSize: '.8rem' }}>✏️ Edit Feedback</p>
        {svcType && (
          <div style={{ marginBottom: '.9rem', padding: '.6rem .85rem', background: 'rgba(255,255,255,.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,.07)' }}>
            <p style={{ margin: 0, fontSize: '.78rem', color: '#00e5ff', fontWeight: 600 }}>{svcType}</p>
            {svcDate && <p style={{ margin: '.15rem 0 0', fontSize: '.72rem', color: '#475569' }}>📅 {svcDate}</p>}
            {svcQuery && <p style={{ margin: '.2rem 0 0', fontSize: '.78rem', color: '#64748b', fontStyle: 'italic' }}>"{svcQuery}"</p>}
          </div>
        )}
        {err && <p style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.5rem' }}>{err}</p>}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '.8rem' }}>
            <label style={S.label}>Rating</label>
            <StarRating value={form.rating} onChange={(r) => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Comment</label>
            <textarea style={{ ...S.input, resize: 'vertical' }} rows={3} value={form.comment} onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Share your experience..." />
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setErr(''); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
          <StarRating value={fb.rating} readonly />
          {svcType && (
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.15rem' }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, padding: '.18rem .55rem', borderRadius: '6px', background: 'rgba(0,229,255,.1)', color: '#00e5ff' }}>{svcType}</span>
              {svcDate && <span style={{ fontSize: '.72rem', color: '#475569' }}>📅 {svcDate}</span>}
            </div>
          )}
          {svcQuery && <p style={{ margin: '.1rem 0 0', fontSize: '.78rem', color: '#475569', fontStyle: 'italic' }}>"{svcQuery}"</p>}
        </div>
        <div style={{ display: 'flex', gap: '.25rem', flexShrink: 0 }}>
          <button onClick={() => { setEditing(true); setConfirmDel(false); }} style={{ ...S.iconBtn, background: 'rgba(0,229,255,.08)', color: '#00e5ff' }} title="Edit">✏️</button>
          <button
            onClick={handleDelete}
            style={{ ...S.iconBtn, background: confirmDel ? 'rgba(248,113,113,.15)' : 'rgba(255,255,255,.04)', color: confirmDel ? '#f87171' : '#64748b' }}
            title={confirmDel ? 'Click again to confirm delete' : 'Delete'}
          >
            {confirmDel ? '⚠️' : '🗑️'}
          </button>
        </div>
      </div>
      {fb.comment && <p style={{ margin: '.65rem 0 0', fontSize: '.875rem', lineHeight: 1.6, color: '#cbd5e1' }}>{fb.comment}</p>}
      {fb.adminResponse && (
        <div style={{ marginTop: '.8rem', padding: '.6rem .85rem', background: 'rgba(0,229,255,.05)', border: '1px solid rgba(0,229,255,.15)', borderRadius: '8px', fontSize: '.82rem' }}>
          <span style={{ color: '#00e5ff', fontWeight: 700 }}>Admin: </span>
          <span style={{ color: '#94a3b8' }}>{fb.adminResponse}</span>
        </div>
      )}
      <p style={{ marginTop: '.55rem', fontSize: '.72rem', color: '#334155' }}>{fmt(fb.createdAt)}</p>
    </div>
  );
}

// ─── ReviewCard ──────────────────────────────────────────────────────────────
function ReviewCard({ review, currentUserId, onUpdated, onDeleted }) {
  const isOwn = String(review.user?._id || review.user) === String(currentUserId);
  const [editing, setEditing]       = useState(false);
  const [form, setForm]             = useState({ rating: review.rating, title: review.title || '', comment: review.comment });
  const [saving, setSaving]         = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [err, setErr]               = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const res = await feedbackAPI.updateReview(review._id, form);
      onUpdated(res.data.review);
      setEditing(false);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    try { await feedbackAPI.removeReview(review._id); onDeleted(review._id); } catch {}
  };

  const name = review.user?.name || 'User';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (editing && isOwn) {
    return (
      <div style={{ ...S.card, border: '1px solid rgba(0,229,255,.25)' }}>
        <p style={{ margin: '0 0 .9rem', fontWeight: 600, color: '#00e5ff', fontSize: '.8rem' }}>✏️ Edit Review</p>
        {err && <p style={{ color: '#f87171', fontSize: '.8rem', marginBottom: '.5rem' }}>{err}</p>}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '.8rem' }}>
            <label style={S.label}>Rating</label>
            <StarRating value={form.rating} onChange={(r) => setForm(f => ({ ...f, rating: r }))} />
          </div>
          <div style={{ marginBottom: '.8rem' }}>
            <label style={S.label}>Title (optional)</label>
            <input style={S.input} value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Great service!" maxLength={100} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Review *</label>
            <textarea style={{ ...S.input, resize: 'vertical' }} rows={3} required value={form.comment} onChange={(e) => setForm(f => ({ ...f, comment: e.target.value }))} placeholder="Describe your experience..." />
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditing(false); setErr(''); }}>Cancel</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.5rem' }}>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,229,255,.25), rgba(0,229,255,.05))', border: '1px solid rgba(0,229,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.8rem', color: '#00e5ff', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '.875rem', color: '#e2e8f0' }}>{name}</p>
            <StarRating value={review.rating} readonly />
          </div>
        </div>
        {isOwn && (
          <div style={{ display: 'flex', gap: '.25rem', flexShrink: 0 }}>
            <button onClick={() => { setEditing(true); setConfirmDel(false); }} style={{ ...S.iconBtn, background: 'rgba(0,229,255,.08)', color: '#00e5ff' }} title="Edit">✏️</button>
            <button
              onClick={handleDelete}
              style={{ ...S.iconBtn, background: confirmDel ? 'rgba(248,113,113,.15)' : 'rgba(255,255,255,.04)', color: confirmDel ? '#f87171' : '#64748b' }}
              title={confirmDel ? 'Click again to confirm delete' : 'Delete'}
            >
              {confirmDel ? '⚠️' : '🗑️'}
            </button>
          </div>
        )}
      </div>
      {review.title && <p style={{ margin: '.65rem 0 .15rem', fontWeight: 600, fontSize: '.9rem', color: '#e2e8f0' }}>{review.title}</p>}
      <p style={{ margin: '.4rem 0 0', fontSize: '.875rem', lineHeight: 1.6, color: '#94a3b8' }}>{review.comment}</p>
      {review.adminResponse && (
        <div style={{ marginTop: '.8rem', padding: '.6rem .85rem', background: 'rgba(0,229,255,.05)', border: '1px solid rgba(0,229,255,.15)', borderRadius: '8px', fontSize: '.82rem' }}>
          <span style={{ color: '#00e5ff', fontWeight: 700 }}>Response: </span>
          <span style={{ color: '#94a3b8' }}>{review.adminResponse}</span>
        </div>
      )}
      <div style={{ marginTop: '.55rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
        {review.isVerified && (
          <span style={{ fontSize: '.68rem', padding: '.15rem .45rem', borderRadius: '4px', background: 'rgba(74,222,128,.1)', color: '#4ade80', fontWeight: 600 }}>✓ Verified</span>
        )}
        <p style={{ margin: 0, fontSize: '.72rem', color: '#334155' }}>{fmt(review.createdAt)}</p>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#334155' }}>
      <div style={{ fontSize: '2.75rem', marginBottom: '.75rem' }}>{icon}</div>
      <p style={{ margin: 0, fontSize: '.9rem' }}>{text}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('feedback');

  const load = () =>
    Promise.all([feedbackAPI.myFeedback(), feedbackAPI.getReviews()])
      .then(([f, r]) => { setFeedback(f.data.feedback); setReviews(r.data.reviews); })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  if (loading)
    return <div className="layout user-dark"><UserSidebar /><div className="main-content"><Spinner /></div></div>;

  const tabs = [
    { key: 'feedback', label: 'My Feedback', count: feedback.length },
    { key: 'reviews',  label: 'All Reviews',  count: reviews.length },
  ];

  return (
    <div className="layout user-dark">
      <UserSidebar />
      <div className="main-content">
        <UserPageHeader title="Feedback & Reviews" subtitle="View and edit your feedback and community reviews" />

        {/* ── Tab bar ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? '#00e5ff' : 'rgba(255,255,255,0.05)',
                color: tab === t.key ? '#06071a' : '#94a3b8',
                border: 'none', borderRadius: '8px',
                padding: '.45rem 1.15rem', fontSize: '.875rem', fontWeight: 600,
                cursor: 'pointer', transition: 'all .2s',
                display: 'flex', alignItems: 'center', gap: '.45rem',
              }}
            >
              {t.label}
              <span style={{
                fontSize: '.7rem', fontWeight: 700,
                background: tab === t.key ? 'rgba(0,0,0,.15)' : 'rgba(255,255,255,.08)',
                borderRadius: '999px', padding: '.1rem .45rem',
              }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* ── Feedback tab ─────────────────────────────────────────────── */}
        {tab === 'feedback' && (
          feedback.length === 0
            ? <EmptyState icon="💬" text="No feedback submitted yet. Rate a service to get started." />
            : feedback.map(fb => (
              <FeedbackCard
                key={fb._id}
                fb={fb}
                onUpdated={(updated) => setFeedback(prev => prev.map(f => f._id === updated._id ? { ...f, ...updated } : f))}
                onDeleted={(id) => setFeedback(prev => prev.filter(f => f._id !== id))}
              />
            ))
        )}

        {/* ── Reviews tab ──────────────────────────────────────────────── */}
        {tab === 'reviews' && (
          reviews.length === 0
            ? <EmptyState icon="⭐" text="No community reviews yet." />
            : reviews.map(r => (
              <ReviewCard
                key={r._id}
                review={r}
                currentUserId={user?._id}
                onUpdated={(updated) => setReviews(prev => prev.map(rv => rv._id === updated._id ? { ...rv, ...updated } : rv))}
                onDeleted={(id) => setReviews(prev => prev.filter(rv => rv._id !== id))}
              />
            ))
        )}
      </div>
    </div>
  );
}

